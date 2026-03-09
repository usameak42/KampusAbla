

## Localization Readiness Audit

### Current Status: **~75% Ready**

---

### ✅ What's Working Well

| Area | Status | Notes |
|------|--------|-------|
| i18n Setup | ✅ Complete | `i18next` + `react-i18next` properly configured |
| Language Files | ✅ Complete | TR, EN, AR all have matching keys for landing, nav, auth, footer |
| Language Switcher | ✅ Working | Header has dropdown for TR/EN/AR |
| RTL Support | ✅ Basic | Arabic auto-sets `dir="rtl"` on language change |
| Persistence | ✅ Working | Language stored in localStorage |
| Fallback | ✅ Turkish | Default fallback to TR (primary market) |
| Interpolation | ✅ Working | `{{count}}` and `{{year}}` work in all locales |

---

### ⚠️ Issues Found

| Issue | Severity | Files Affected |
|-------|----------|----------------|
| **Hardcoded Turkish text** | High | ~62 files with inline Turkish strings (not using `t()`) |
| **Login page not using i18n** | Medium | `Login.tsx` - all labels hardcoded |
| **Dashboard button hardcoded** | Low | `Header.tsx` line 166: `"Dashboard"` instead of `t("nav.dashboard")` |
| **Missing translation keys** | Medium | Bookings, Children, Reviews, Settings, Disputes sections lack translations |
| **Minimal RTL CSS** | Low | Only `text-align: right` — no flex-direction/margin-inline fixes |

---

### What Needs Work

**1. Hardcoded Text in Critical Pages**
- `Login.tsx` — 12+ hardcoded strings
- `AdminLogin.tsx` — All text hardcoded
- `ForgotPassword.tsx` — All text hardcoded
- Registration steps — Partially hardcoded

**2. Missing Translation Keys**
Current locale files only cover: `common`, `nav`, `landing`, `auth`, `footer`, `languages`

Missing namespaces:
- `bookings.*` — Booking cards, modals, status labels
- `children.*` — Child forms, age display
- `reviews.*` — Review forms, rating labels
- `settings.*` — All settings sections
- `disputes.*` — Dispute forms and status
- `errors.*` — Validation and API error messages
- `dashboard.*` — Parent/sitter dashboard labels

**3. RTL Enhancement Needed**
Current RTL CSS is minimal. Missing:
- Flex direction reversal for horizontal layouts
- Margin/padding logical properties
- Icon positioning fixes

---

### Recommended Fix Plan

**Phase 1 (High Priority):** Add translation keys for all pages and replace hardcoded strings in:
- Login/Register flows
- Dashboard pages
- Settings pages

**Phase 2 (Medium Priority):** Add namespaces for:
- `bookings`, `children`, `reviews`, `disputes`, `errors`

**Phase 3 (Low Priority):** Enhanced RTL support:
- Add `.rtl:` variants for flex layouts
- Use logical properties (`margin-inline-start` etc.)

---

### Files to Modify

| File | Change |
|------|--------|
| `src/i18n/locales/tr.json` | Add ~150 new keys |
| `src/i18n/locales/en.json` | Add ~150 new keys |
| `src/i18n/locales/ar.json` | Add ~150 new keys |
| `src/pages/Login.tsx` | Replace hardcoded text with `t()` |
| `src/pages/admin/AdminLogin.tsx` | Replace hardcoded text with `t()` |
| `src/components/layout/Header.tsx` | Fix "Dashboard" hardcode |
| `src/index.css` | Add RTL utilities |
| ~30 other component files | Replace inline Turkish with `t()` |

---

### Summary

The i18n foundation is solid — language switching, RTL direction, and persistence all work. The gap is **content coverage**: ~25% of user-facing text is translated via i18n, while ~75% remains hardcoded in Turkish. For full localization readiness, all hardcoded strings need migration to the translation files.

