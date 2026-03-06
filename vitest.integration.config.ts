import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Integration test configuration.
 * Targets files in src/test/integration/ and any *.integration.{test,spec} files.
 * These tests may use real Supabase credentials from .env.test.local.
 */
export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        include: [
            "src/test/integration/**/*.{test,spec}.{ts,tsx}",
            "src/**/*.integration.{test,spec}.{ts,tsx}",
        ],
        // Integration tests are slower — allow more time
        testTimeout: 30_000,
        // Don't fail if no integration test files exist yet
        passWithNoTests: true,
    },
    resolve: {
        alias: { "@": path.resolve(__dirname, "./src") },
    },
});
