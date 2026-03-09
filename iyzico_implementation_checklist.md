### 1. Sequence Diagrams (Text)

**Flow A: Sitter Onboarding (Sub-Merchant Creation)**
1. Sitter registers on KampusAbla (provides TCKN, IBAN, GSM, Address).
2. KampusAbla Backend (KB) validates inputs (e.g., TCKN verification via NVI).
3. KB sends `POST /onboarding/submerchant` with `subMerchantType: PERSONAL`.
4. iyzico validates and creates the sub-merchant, returning a unique `subMerchantKey`.
5. KB stores `subMerchantKey` in the database linked to the sitter's profile.

**Flow B: Parent Booking & Escrow Holding**
1. Parent initiates a booking (e.g., Total: 100 TRY).
2. KB calculates fees: 80 TRY base, 0.8 TRY Stopaj (1%), Platform Fee: 5 TRY, VAT on fee. Sitter Net: 94.2 TRY.
3. KB sends `POST /payment/auth` (or `/payment/3dsecure/initialize` for 3DS). Payload includes `basketItems` with the sitter's `subMerchantKey`, `subMerchantPrice: "94.2"`, and `withholdingTax: "0.8"`.
4. iyzico charges the parent's card and holds the 100 TRY in a safeguarded pool account.
5. iyzico returns `status: success` and a `paymentTransactionId` for the specific basket item. 
6. KB stores `paymentTransactionId` and marks the booking as "Paid - In Escrow".

**Flow C: Service Completion & Payout (Approval)**
1. Sitter completes the childcare session.
2. Parent confirms completion via the KampusAbla app (or auto-completes after 24 hours).
3. KB sends `POST /payment/iyzipos/item/approve` passing the `paymentTransactionId`.
4. iyzico releases the funds: 94.2 TRY routes to Sitter's IBAN, 0.8 TRY is recorded as withholding tax, and the remainder routes to KampusAbla's corporate account.
5. iyzico triggers a Webhook to KB confirming settlement status.

### 2. API Endpoint & Event Checklist

*   **Authentication & Idempotency:**
    *   [ ] Generate `Authorization` header: `IYZWSv2` + `base64Encoded(HMACSHA256)`.
    *   [ ] Generate unique `conversationId` per request to ensure idempotency and prevent duplicate processing.
*   **Sitter Onboarding:**
    *   [ ] `POST /onboarding/submerchant`: Send `contactName`, `contactSurname`, `identityNumber` (TCKN), `email`, `gsmNumber`, `address`, `iban`, and `subMerchantExternalId`.
*   **Collection (Escrow):**
    *   [ ] `POST /payment/auth` (Non-3DS) or `POST /payment/3dsecure/initialize` (3DS). Ensure `subMerchantKey` is attached to every relevant basket item.
*   **Fund Release & Refunds:**
    *   [ ] `POST /payment/iyzipos/item/approve`: Called when the session is successfully finished to release funds to the sitter.
    *   [ ] `POST /payment/iyzipos/item/disapprove`: Called to reverse an approval before the nightly settlement cut-off if a dispute arises.
    *   [ ] `POST /payment/refund`: Called if the session is canceled before approval, returning funds from the pool to the parent.
*   **Webhook Handling:**
    *   [ ] Expose an HTTPS endpoint for iyzico IPNs.
    *   [ ] Validate webhook signature (`X-IYZ-SIGNATURE-V3`) using HMAC SHA256. The hash string must be strictly ordered: `secretKey + iyziEventType + paymentId + paymentConversationId + status`.
*   **Reconciliation:**
    *   [ ] `GET /v2/reporting/payment/details`: Used with `paymentConversationId` to verify the final status of a transaction and detect any fraud flags.

### 3. Failure-Mode Table

| Failure Mode | Trigger / Error Code | Mitigation Strategy |
| :--- | :--- | :--- |
| Sitter Onboarding Failure | Invalid TCKN or IBAN format | Validate TCKN via NVI SOAP API locally before hitting iyzico. Reject mismatched IBANs on the frontend. |
| Parent Payment Decline | Code 10051 (NOT_SUFFICIENT_FUNDS) | Gracefully prompt the parent to use a different card. Retain the booking state as "Pending Payment". |
| Escrow Approval Timeout | `/payment/iyzipos/item/approve` fails | Implement an exponential backoff retry queue for approvals. Do not mark as "Settled" internally until HTTP 200 is received. |
| Duplicate Webhooks | iyzico sends the same event twice | Use `paymentId` and `paymentConversationId` as unique database constraints to ignore duplicate incoming events. |
| Invalid Webhook Signature | `X-IYZ-SIGNATURE-V3` mismatch | Immediately drop the request (return 400). Log the IP address. Do not update order status to prevent spoofing. |
| Refund Race Condition | Sitter cancels while payout is processing | Lock the booking row in the database. Ensure `/payment/refund` is blocked if `/payment/iyzipos/item/approve` has already fired successfully. |

### 4. Test Plan (Sandbox and Production-Readiness)

**Sandbox Phase:**
1.  **Account Elevation:** Create a standard sandbox account, then email `entegrasyon@iyzico.com` to explicitly enable the "Marketplace" (Pazaryeri) permissions; otherwise, sub-merchant endpoints will fail.
2.  **Mock Data Integrity:** Unlike production, use iyzico's provided test credit cards and test IBANs, but ensure the payload structure strictly mimics real data types.
3.  **State Machine Testing:** 
    *   Test the "Happy Path" (Auth -> Approve -> Settle).
    *   Test "Sitter No-Show" (Auth -> Refund).
    *   Test "Last Minute Dispute" (Auth -> Approve -> Disapprove -> Refund).
4.  **Webhook Validation:** Trigger a test payment and verify your system correctly calculates the HMAC SHA256 hash to validate the incoming webhook signature.

### 5. Go-Live Acceptance Criteria

Before swapping sandbox keys for production keys, ensure the following are complete:
*   [ ] **Financial Logic:** Stopaj (1%) is mathematically verified and dynamically injected into the `withholdingTax` parameter for every booking.
*   [ ] **Legal Requirements:** Distance Selling Agreement, Cancellation Policy, and KVKK Consent texts are fully published and linked on the checkout page.
*   [ ] **Corporate Alignment:** The KampusAbla production URL matches the URL submitted during the iyzico corporate onboarding, and an SSL certificate (HTTPS) is actively enforcing traffic.
*   [ ] **Fraud Controls:** 3D Secure is mandated for all parent checkouts to prevent "stolen card" chargebacks.
*   [ ] **Credential Management:** Production API and Secret Keys are securely injected via environment variables (e.g., AWS Secrets Manager) and are not hardcoded in the repository.