

## Plan: Admin Security Hardening + Landing Page Readiness Audit

### Part 1: Admin Security Hardening

**Current state:** The `/admin/login` route is publicly visible in the router. While `AdminRoute` correctly checks the `user_roles` table (not user_metadata), the admin login page is discoverable by anyone navigating to `/admin/login`. No admin links exist in the Header, Footer, or navigation -- that's good.

**Changes needed:**

1. **Obfuscate the admin login URL** -- Change `/admin/login` to a non-guessable path like `/portal/access` or `/mgmt/auth`. Update all references in `App.tsx`, `AdminRoute.tsx`, `AdminLogin.tsx`, and `AdminDashboard.tsx`.

2. **Hide admin routes from source bundle** -- The admin pages are already lazy-loaded (code-split), so they won't appear in the main bundle. No change needed here.

3. **Add rate limiting to admin login** -- The login uses the standard `handleSignIn` from `useAuthentication`. We should add client-side attempt tracking (lock out after 5 failed attempts for 15 minutes) on the `AdminLogin` page specifically.

4. **Remove `/admin` redirect convenience route** -- Currently `/admin` directly loads AdminDashboard. Keep only the dashboard route at the obfuscated path to reduce surface area.

5. **Ensure `robots.txt` blocks admin paths** -- Add `Disallow: /admin` and the new obfuscated path.

6. **No admin links in any public UI** -- Already confirmed: Header, Footer, landing sections have zero admin references.

---

### Part 2: Landing Page Readiness Audit

**Current state analysis of the promotional site (Index page for unauthenticated users):**

| Area | Status | Issue |
|------|--------|-------|
| Hero Section | Good | Animations, CTAs, trust badge all present |
| Features Section | Good | 4 feature cards with icons and i18n |
| How It Works | Good | Parent + Student flows, 3 steps each |
| Stats Section | Needs fix | Hardcoded "500+", "2,000+", "4.9", "< 1h" -- should be real or clearly labeled as targets |
| CTA Section | Good | Register CTA with gradient |
| Header | Good | Nav links, language switcher, login/signup |
| Footer | Minor issues | `/careers`, `/press`, `/contact` links go to 404 (no pages exist) |
| SEO | Needs fix | `<html lang="en">` should be `lang="tr"` for Turkish market; title is in English |
| OG/Meta | Partial | OG image uses a Lovable preview screenshot, needs branded image |
| Mobile | Good | Responsive hamburger menu, mobile nav |
| i18n | Good | Full Turkish translations present |
| Accessibility | Acceptable | Semantic HTML, buttons with text |
| Performance | Good | Lazy loading, code splitting, framer-motion for animations |

**Changes needed:**

7. **Fix dead footer links** -- Either create placeholder pages for `/careers`, `/press`, `/contact` or remove those links and replace with existing pages (e.g., `/help`, `/about`).

8. **Fix HTML lang attribute** -- Change `<html lang="en">` to `<html lang="tr">` in `index.html`.

9. **Update page title and meta** -- Change English title/description to Turkish for the primary market.

10. **Add favicon** -- The `public/favicon.ico` exists but should be verified it's a proper KampusAbla branded icon, not a default.

---

### Technical Details

**Files to modify:**
- `src/App.tsx` -- Rename admin routes
- `src/components/auth/AdminRoute.tsx` -- Update redirect path
- `src/pages/admin/AdminLogin.tsx` -- Update navigation path, add rate limiting
- `src/pages/admin/AdminDashboard.tsx` -- Update logout redirect
- `public/robots.txt` -- Add disallow rules
- `index.html` -- Fix lang, title, meta description
- `src/components/layout/Footer.tsx` -- Fix or remove dead links

**No database changes required.**

