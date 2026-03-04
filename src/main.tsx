import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./i18n/config";
import "./index.css";
import App from "./App.tsx";
import { initWebVitalsTracking } from "@/lib/performance";
import { installProductionConsoleGuards } from "@/lib/logger";
import { validateEnv } from "@/lib/env";

// 1. Validate environment configuration explicitly
validateEnv();

// Initialize Sentry for error tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION || 'development', // Git SHA from CI
  enabled: import.meta.env.PROD, // Only enable in production

  tracePropagationTargets: [
    'localhost',
    /^https:\/\/.*\.supabase\.co/,
    /^https:\/\/kampusabla\.com/,
  ],

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true, // KVKK compliance - mask sensitive data
      blockAllMedia: true,
      maskAllInputs: true, // Mask all input fields
    }),
  ],

  // Performance Monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Session Replay
  replaysSessionSampleRate: 0.01, // 1% of sessions (privacy-friendly)
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Privacy & Security
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    // Remove sensitive query params
    if (event.request?.url) {
      const url = new URL(event.request.url);
      url.searchParams.delete('token');
      url.searchParams.delete('key');
      event.request.url = url.toString();
    }

    return event;
  },

  // Initial context
  initialScope: {
    tags: {
      'app.version': import.meta.env.VITE_APP_VERSION || 'development',
    },
  },
});

initWebVitalsTracking();
installProductionConsoleGuards();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
