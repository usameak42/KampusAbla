import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {

    test('Complete payment checkout flow', async ({ page, context }) => {
        console.log('Setting up payment flow test...');

        // Block external Supabase domain
        await context.route('**supabase.co/**', route => route.abort());

        // Mock auth endpoints - return a verified user
        await context.route('**/auth/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-user-123',
                        email: 'test@example.com',
                        user_metadata: {
                            verification_status: 'verified'
                        }
                    },
                    session: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token'
                    }
                })
            });
        });

        // Mock all other Supabase API calls
        await context.route('**/rest/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Navigate to payment checkout page
        console.log('Navigating to /book/sitter-test-1');
        await page.goto('http://localhost:8080/book/sitter-test-1');

        // Wait for page to load and React to hydrate
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify checkout page loaded
        await expect(page.getByText('Ödeme')).toBeVisible({ timeout: 10000 });
        console.log('✓ Payment checkout page loaded');

        // Verify booking summary is displayed
        await expect(page.getByText('Rezervasyon Özeti')).toBeVisible();
        console.log('✓ Booking summary displayed');

        // Verify payment method section is displayed
        await expect(page.getByText('Ödeme Yöntemi')).toBeVisible();
        console.log('✓ Payment method section displayed');

        // Verify security notice is displayed
        await expect(page.getByText('Güvenli Ödeme')).toBeVisible();
        console.log('✓ Security notice displayed');

        // Verify total amount is displayed
        await expect(page.locator('text=/₺[0-9,]+( Öde)?/')).toBeVisible();
        console.log('✓ Total amount displayed');

        // Note: Actual payment processing would require additional mocking
        // of payment gateway APIs and saved card data
        console.log('✓ Payment checkout flow validated');
    });

    test('Handle payment with no saved cards', async ({ page, context }) => {
        console.log('Setting up no saved cards test...');

        // Block external Supabase domain
        await context.route('**supabase.co/**', route => route.abort());

        // Mock auth endpoints
        await context.route('**/auth/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-user-no-cards',
                        email: 'test@example.com',
                        user_metadata: {
                            verification_status: 'verified'
                        }
                    },
                    session: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token'
                    }
                })
            });
        });

        // Mock all other Supabase API calls
        await context.route('**/rest/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Navigate to payment checkout page
        await page.goto('http://localhost:8080/book/sitter-test-no-cards');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify "no saved cards" message is displayed
        await expect(page.getByText(/Kayıtlı kart bulunamadı/i)).toBeVisible({ timeout: 10000 });
        console.log('✓ No saved cards message displayed');

        // Verify payment button is disabled when no cards are available
        const payButton = page.locator('button', { hasText: /Öde/ });
        await expect(payButton).toBeDisabled();
        console.log('✓ Payment button disabled without cards');
    });

    test('Navigate to payment confirmation', async ({ page, context }) => {
        console.log('Setting up payment confirmation navigation test...');

        // Block external Supabase domain
        await context.route('**supabase.co/**', route => route.abort());

        // Mock auth endpoints
        await context.route('**/auth/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-user-123',
                        email: 'test@example.com',
                        user_metadata: {
                            verification_status: 'verified'
                        }
                    },
                    session: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token'
                    }
                })
            });
        });

        // Mock all other Supabase API calls
        await context.route('**/rest/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Navigate to payment confirmation page (simulating successful payment)
        await page.goto('http://localhost:8080/checkout/confirmation?transactionId=txn-123');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify confirmation page elements
        // Note: Actual content depends on PaymentConfirmationPage implementation
        await expect(page).toHaveURL(/\/checkout\/confirmation/);
        console.log('✓ Payment confirmation page loaded');
    });

    test('Navigate to payment receipt', async ({ page, context }) => {
        console.log('Setting up payment receipt test...');

        // Block external Supabase domain
        await context.route('**supabase.co/**', route => route.abort());

        // Mock auth endpoints
        await context.route('**/auth/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-user-123',
                        email: 'test@example.com',
                        user_metadata: {
                            verification_status: 'verified'
                        }
                    },
                    session: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token'
                    }
                })
            });
        });

        // Mock all other Supabase API calls
        await context.route('**/rest/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Navigate to payment receipt page
        await page.goto('http://localhost:8080/checkout/receipt');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify receipt page loaded
        await expect(page).toHaveURL(/\/checkout\/receipt/);
        console.log('✓ Payment receipt page loaded');
    });

    test('Verify unverified user cannot complete payment', async ({ page, context }) => {
        console.log('Setting up unverified user payment test...');

        // Block external Supabase domain
        await context.route('**supabase.co/**', route => route.abort());

        // Mock auth endpoints - return an UNVERIFIED user
        await context.route('**/auth/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-user-unverified',
                        email: 'unverified@example.com',
                        user_metadata: {
                            verification_status: 'pending' // NOT verified
                        }
                    },
                    session: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token'
                    }
                })
            });
        });

        // Mock all other Supabase API calls
        await context.route('**/rest/v1/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Navigate to payment checkout page
        await page.goto('http://localhost:8080/book/sitter-test-unverified');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify verification warning is displayed
        await expect(page.getByText(/Kimlik Doğrulama Gerekli/i)).toBeVisible({ timeout: 10000 });
        console.log('✓ Verification requirement message displayed');

        // Verify payment button is disabled for unverified users
        const payButton = page.locator('button', { hasText: /Öde/ });
        await expect(payButton).toBeDisabled();
        console.log('✓ Payment button disabled for unverified user');
    });

});
