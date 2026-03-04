# PRD — KampusAbla (CampusSister)

**Tagline:** Verified Student Play-Sisters
**Category:** Income marketplace / childcare-lite + educational support
**Pilot:** Istanbul → Beşiktaş (private & international schools; strong expat/Arab demand)

## 1) Product positioning (recommended)

You said #3 is unclear, so here are 3 options—**I recommend (A)** because it’s both distinct and trust-driven:

**A. “Verified Uni Students for After-School Pickup + Language/Homework Support”** *(recommended)*

* Trust anchor: vetted student identity + in-app safety + reviews.

**B. “Language Immersion After School (Turkish for expat kids / English practice for locals)”**

* Anchor: language outcome; childcare is secondary.

**C. “Department-Matched Homework Help at Home (with pickup add-on)”**

* Anchor: academic help; pickup is a convenience layer.

**PRD will proceed with A** unless you tell me otherwise.

## 2) Problem & goal

**Parent goal (Selin):** “Within 24 hours, I can find a verified student who can pick my child up from school, spend 2–3 hours on Turkish/English + homework, and I can track the session safely until I arrive.”
**Student goal (Burcu):** “Earn flexible income near my area with a credible profile and repeat clients.”

## 3) Target users

### Primary demand

* Working moms in Beşiktaş using **private & international schools**, incl. **Arab/expat families** who want kids to practice **Turkish**.

### Primary supply

* **3rd year+ university students** living near the target school area.

### Not a fit (proposed exclusions for V1)

* Kids under **7** (higher care risk), infants/toddlers
* Overnight, late-night, full-day nannying
* Medical/special-needs care (until you build training + insurance)
* Long-distance transport / driving (keep to “walkable radius” initially)

## 4) Core service definition (MVP)

* **In-person only**
* **Pickup + Edu-sitting**: pick child up, go to parent-chosen place (home/cafe/library), do Turkish/English practice and/or homework help **until parent arrives**.
* **Constraint:** sitter must be based in the **same area as the school** (supply quality + reliability).

## 5) Marketplace model

You said “both” (#14). For MVP, implement both but keep it simple:

1. **Browse & Request (default):** parent searches sitters and sends a booking request.
2. **Post a Need:** parent posts time + language/homework goal; nearby verified sitters can “apply.”

## 6) MVP scope (4 weeks) — features & requirements

### 6.1 Onboarding & profiles

**Parent**

* Phone + email
* Create “Child profile” (no child login): age, grade/class, languages, allergies/notes
* Add pickup details: school name, pickup window, home/meeting location

**Sitter**

* Account + profile: university, year (>=3), department, languages, intro video optional
* **Verification stack (MVP):**

  * University verification (institutional email *or* proof via official student document upload)
  * Government ID upload + selfie match / liveness
  * Criminal record/background check **via e-Devlet document + verification** (practical for private companies) ([turkiye.gov.tr][1])
  * “Verified” badge shown on profile

> Note: true “direct e-Devlet integration” typically requires formal integration protocols. ([kamu.turkiye.gov.tr][2])
> For V1: user uploads the official document; you verify authenticity via its verification mechanism, then store minimal data.

### 6.2 Search & filters (pragmatic MVP)

You asked for “all filters,” but MVP needs a **core set** + an “Advanced” drawer.

**Core filters (MVP):**

* Distance to school (geo radius)
* Language skills (Turkish / English / Arabic)
* Availability (date/time)
* Verified badge
* Price range

**Advanced (V1.1):**

* Department/major (Math, Psych, Engineering…)
* Gender preference (if you choose to allow)
* Age experience bands (7–10 / 11–13 / 14–16)
* “International school experience”
* Repeat-client rate

### 6.3 Booking flow

1. Parent picks a sitter (or posts a need) → enters: date/time, duration (flexible), pickup needed, address, child info, notes.
2. Student **manually accepts** (#23).
3. In-app chat opens (no phone numbers) (#19).
4. Session starts: “On my way” → “Picked up” → “Arrived” → “Session ended” (parent confirms).

### 6.4 Live location sharing (safety core)

* **Live location visible to parent** during:

  * route to school pickup
  * transit to meeting location
  * optional “session location pinned” (privacy-safe)
* Location tracking is sensitive personal data → requires clear KVKK notice/consent flows. ([kvkk.gov.tr][3])

### 6.5 Reviews

* Two-sided reviews, unlocked only when **session end is confirmed** (#25).
* Weight “trusted reviews” higher (repeat bookings, verified users).

### 6.6 Payments & fees (since you want 10%)

* In-app card payments + platform fee **10%**.
* Use a Turkish **marketplace payment** provider (sub-merchant payouts) rather than trying to become a payment institution under Law 6493. ([TCMB][4])

## 7) Pricing (Turkey) — initial benchmark for Beşiktaş

You asked “do your research.” Market signals:

* Istanbul hourly childcare appears commonly in the **~300–500 TL/hour** range in 2026 estimates, depending on experience/location. ([Bakıcı Rehberi][5])
* Istanbul English private lesson pricing ranges widely (examples show **~500–3,500 TL/hour** depending on tutor/profile). ([armut.com][6])

**Recommended starting price band (for pilot):**

* **450–800 TL/hour** for “pickup + edu-sitting” in Beşiktaş

  * lower end: homework support
  * upper end: strong language (Turkish/English) + strong reviews
* Platform takes 10% (+ payment processing costs).

## 8) Subscription ideas (you asked for subscription-only features)

### Parent subscription (monthly)

* “Priority matching” (top placement to verified sitters, faster response nudges)
* “Recurring schedule” (set Mon–Fri pickup; auto-request)
* “Last-minute boost” (send request to multiple nearby verified sitters at once)
* “Premium-only pool” (sitters with background-check + training badge)

### Student subscription (monthly)

* Higher ranking in search
* “Premium Verified+” badge (extra checks / training completion)
* Faster payouts (if your PSP supports it)
* Lead insights (views, save rate, acceptance rate analytics)

## 9) Safety, liability, and compliance (must-have PRD section)

### Minimum safety bar (answering your #18)

For launch, “minimum bar” = the smallest set of controls you won’t compromise on:

* ID + selfie match
* Verified student status
* Criminal record doc verification
* In-app chat only
* Live location during pickup
* Reporting + rapid suspension workflow

KVKK needs:

* Aydınlatma (privacy notice) is mandatory and separate from consent. ([kvkk.gov.tr][3])
* Child data requires extra care; parent/guardian consent handling is critical. ([kvkk.gov.tr][7])

## 10) Leakage (answering your #28)

“Platform leakage” = users exchanging numbers and paying off-platform to avoid the 10%.
Controls:

* In-app payments required to unlock live location + session start
* Block phone numbers in chat + warnings
* Repeat booking tools only available in-app (recurring schedules, priority matching)
* Trust features tied to on-platform completion (reviews, badges)

## 11) Disputes & support (answering your #30)

Even if “Turkish court” is the final venue, you still need:

* In-app dispute intake (missed pickup, unsafe behavior, refund request)
* Clear refund/cancellation policy
* Terms: governing law Turkey; jurisdiction Istanbul courts (standard)

## 12) Cancellation policy (your #24 — recommended)

* **>12 hours:** full refund
* **12 → 2 hours:** 50% charge (student protected)
* **<2 hours / no-show:** 100% charge
* Student cancels: refund + sitter reliability score hit; repeated cancels reduce ranking.

## 13) Metrics (initial)

* **Time-to-match** (request → acceptance)
* **Completion rate** (accepted → completed)
* **Repeat booking rate** (30-day)
* **Safety incident rate** (reports per 1,000 sessions)
* Student earnings/week
