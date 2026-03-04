import { initializeApp, FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is available
const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
    } catch (error) {
        console.warn("Firebase initialization failed:", error);
    }
}

/**
 * Lazily initialize messaging only when explicitly requested.
 * getMessaging() throws "WebSocket not available" in environments
 * that don't support it (e.g., sandboxed iframes), so we defer
 * initialization and catch errors.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
    if (messaging) return messaging;
    if (!app) return null;
    if (typeof window === "undefined") return null;

    try {
        const { getMessaging } = await import("firebase/messaging");
        messaging = getMessaging(app);
        return messaging;
    } catch (e) {
        console.warn("Firebase Messaging not available:", e);
        return null;
    }
}

export { messaging };
export default app;
