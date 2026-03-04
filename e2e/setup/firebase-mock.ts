/**
 * Firebase Mock for E2E Tests
 * 
 * This mock prevents Firebase initialization errors in Playwright tests.
 * 
 * TODO: Replace with real Firebase configuration once Firebase is properly set up for E2E environment
 * See implementation_plan.md Phase 20 for Firebase configuration tasks
 */

export const firebaseMock = `
window.firebase = {
    initializeApp: () => ({}),
    auth: () => ({
        onAuthStateChanged: () => {},
        signInWithEmailAndPassword: () => Promise.resolve({}),
        signOut: () => Promise.resolve(),
    }),
    analytics: () => ({}),
};
`;
