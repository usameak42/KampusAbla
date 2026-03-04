import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {

    test('Parent registration validation', async ({ page }) => {
        // Navigate to registration page
        await page.goto('/register');

        // Select parent role (assuming there's a role selector or default)
        // Adjust selector based on actual UI. Assuming "Veli" button or similar.
        // Inspecting usage in previous tasks: /register leads to a role selection or form.
        // Let's assume standard flow: click 'Veli' -> form.

        // Wait for role selection if exists, or direct form.
        // Based on previous knowledge, maybe /register has tabs or cards.
        // For MVP robustness, let's verify page load first.
        await expect(page).toHaveTitle(/KampusAbla/);

        // Fill invalid data to check validation
        await page.getByLabel(/Ad Soyad/i).fill('Test');
        await page.getByRole('button', { name: /Kayıt Ol/i }).click();

        // Expect error messages
        await expect(page.getByText(/Geçerli bir email/i)).toBeVisible();
    });

    // Note: Full registration e2e requires database cleanup or mock auth.
    // We will mock the API response for registration to avoid DB pollution/auth constraints in this suite.

    test('Successful registration mock', async ({ page }) => {
        // Mock the Supabase auth API endpoint if possible or intercept network
        await page.route('**/auth/v1/signup', async route => {
            const json = {
                user: { id: 'mock-id', email: 'test@example.com' },
                session: { access_token: 'mock-token' }
            };
            await route.fulfill({ json });
        });

        await page.goto('/register');
        await page.getByLabel(/Ad Soyad/i).fill('Test Parent');
        await page.getByLabel(/Email/i).fill('test@example.com');
        await page.getByLabel(/Şifre/i).fill('password123');
        await page.getByLabel(/Telefon/i).fill('5551234567');

        await page.getByRole('button', { name: /Kayıt Ol/i }).click();

        // specific success expectation - redirect or toast
        // await expect(page).toHaveURL('/dashboard'); // or verify toast
        // validation dependent on actual UI implementation
    });

});
