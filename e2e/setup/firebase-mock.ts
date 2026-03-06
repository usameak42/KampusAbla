/**
 * Firebase Mock for E2E Tests
 *
 * Firebase SDK (v9 modular) gracefully degrades when the VITE_FIREBASE_*
 * environment variables are absent — `src/lib/firebase.ts` guards every
 * initialization path with `isFirebaseConfigured` and returns `null` for
 * both `app` and `messaging`, so no module-level mocking is required.
 *
 * This script is injected via `page.addInitScript()` in Playwright tests to
 * prevent the browser from attempting to register the
 * `firebase-messaging-sw.js` service worker (which does not exist in
 * development / CI environments), avoiding hard-to-diagnose console errors.
 *
 * For real FCM in staging or production E2E runs, set the VITE_FIREBASE_*
 * variables in the CI environment (see `.env.example` for the full list) and
 * remove the `addInitScript(firebaseMock)` calls from the relevant spec files.
 */

export const firebaseMock = `
  // Prevent FCM service-worker registration errors in E2E/CI environments
  // where no firebase-messaging-sw.js exists.
  if ('serviceWorker' in navigator) {
    const _register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = function(scriptURL, options) {
      if (typeof scriptURL === 'string' && scriptURL.includes('firebase-messaging-sw')) {
        return Promise.reject(new Error('Firebase SW registration skipped in E2E tests'));
      }
      return _register(scriptURL, options);
    };
  }
`;
