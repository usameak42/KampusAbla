import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ?
        [['html'], ['json', { outputFile: path.join('playwright-report', 'results.json') }], ['github']] :
        [['html'], ['json', { outputFile: path.join('playwright-report', 'results.json') }]],
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:8080',
        trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
        screenshot: process.env.CI ? 'only-on-failure' : 'only-on-failure',
        video: process.env.CI ? 'retain-on-failure' : 'off',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
    webServer: {
        command: process.env.CI ? 'npm run preview' : 'npm run dev',
        url: process.env.BASE_URL || 'http://localhost:8080',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
    outputDir: 'playwright-report',
});
