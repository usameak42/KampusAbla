import { test, expect } from '@playwright/test';
import { firebaseMock } from './setup/firebase-mock';

/**
 * Session Tracking E2E Tests
 * 
 * These tests verify the session page loads correctly and handles edge cases.
 * 
 * NOTE: Firebase is mocked to prevent configuration errors in E2E environment.
 * See implementation_plan.md Phase 20 for TODO about real Firebase setup.
 * 
 * FUTURE ENHANCEMENTS:
 * To test full session tracking flow (status transitions, handover PIN, timer, etc.),
 * the tests would need to:
 * - Mock authenticated user context with proper session ID
 * - Provide mock session data via API that the useSession hook can fetch
 * - Replace Firebase mock with real configuration
 * 
 * Currently, these tests verify:
 * - Session page infrastructure is working (loads, HTTP success)
 * - React application mounts successfully
 * - Page handles requests correctly
 */

test.describe('Session Page E2E Tests', () => {

    // Setup function to inject Firebase mock
    const setupMocks = async (page: any, context: any) => {
        // Block external domains
        await context.route('**supabase.co/**', (route: any) => route.abort());

        // Mock Firebase to prevent initialization errors
        await page.addInitScript(firebaseMock);

        // Mock auth endpoints
        await context.route('**/auth/v1/**', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ user: null, session: null })
            });
        });

        // Mock REST API calls
        await context.route('**/rest/v1/**', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });
    };

    test('session page HTTP request succeeds', async ({ page, context }) => {
        await setupMocks(page, context);

        const response = await page.goto('http://localhost:8080/session');

        expect(response).not.toBeNull();
        expect(response!.status()).toBe(200);
    });

    test('React app mounts on session page', async ({ page, context }) => {
        await setupMocks(page, context);

        await page.goto('http://localhost:8080/session');

        // Wait for React root element
        const rootElement = await page.waitForSelector('#root', { timeout: 10000 });
        expect(rootElement).not.toBeNull();

        // Verify it has content
        const content = await page.textContent('#root');
        expect(content).toBeTruthy();
        expect(content!.trim().length).toBeGreaterThan(0);
    });

    test('session page loads and renders', async ({ page, context }) => {
        await setupMocks(page, context);

        await page.goto('http://localhost:8080/session');
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);

        // Verify page has meaningful content
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(50);
    });

});
