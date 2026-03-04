import { test, expect } from '@playwright/test';
import { firebaseMock } from './setup/firebase-mock';

test.describe('Parent Journey E2E Tests', () => {

    // Setup function to mock all necessary APIs
    const setupParentMocks = async (page: any, context: any) => {
        // Block external domains
        await context.route('**supabase.co/**', (route: any) => route.abort());
        await context.route('**fcm.googleapis.com/**', (route: any) => route.abort());

        // Inject Firebase mock
        await page.addInitScript(firebaseMock);

        // Mock auth endpoints
        await context.route('**/auth/v1/**', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-parent-123',
                        email: 'parent@test.com',
                        user_metadata: {
                            role: 'parent',
                            verification_status: 'verified'
                        }
                    },
                    session: {
                        access_token: 'mock-parent-token',
                        refresh_token: 'mock-refresh-token'
                    }
                })
            });
        });

        // Mock REST API calls
        await context.route('**/rest/v1/**', async (route: any) => {
            const url = route.request().url();

            // Mock children data
            if (url.includes('/children') && !url.includes('select=')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([])
                });
                return;
            }

            // Mock sitters data for search
            if (url.includes('/sitters') && url.includes('rpc=search_sitters')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'sitter-1',
                            full_name: 'Test Sitter',
                            university: 'Boğaziçi Üniversitesi',
                            verification_status: 'verified',
                            hourly_rate: 500,
                            rating: 4.5,
                            bio: 'Experienced babysitter',
                            languages: ['Turkish', 'English']
                        },
                        {
                            id: 'sitter-2',
                            full_name: 'Another Sitter',
                            university: 'İstanbul Üniversitesi',
                            verification_status: 'verified',
                            hourly_rate: 600,
                            rating: 4.8,
                            bio: 'Certified teacher',
                            languages: ['Turkish', 'Arabic']
                        }
                    ])
                });
                return;
            }

            // Mock booking creation
            if (url.includes('/bookings') && route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'booking-123',
                        status: 'pending',
                        created_at: new Date().toISOString()
                    })
                });
                return;
            }

            // Default mock response
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });
    };

    test('Parent registration → child creation → sitter search → booking request', async ({ page, context }) => {
        console.log('Starting parent journey test...');

        await setupParentMocks(page, context);

        // Step 1: Navigate to registration
        await page.goto('http://localhost:8080/register');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Step 2: Select parent role
        await expect(page.getByText('Veli Ol')).toBeVisible();
        await page.getByText('Veli Ol').click();
        await page.waitForTimeout(1000);

        // Step 3: Fill registration form
        await page.getByLabel(/Ad Soyad/i).fill('Test Parent');
        await page.getByLabel(/Email/i).fill('parent@test.com');
        await page.getByLabel(/Şifre/i).fill('password123');
        await page.getByLabel(/Telefon/i).fill('5551234567');

        // Step 4: Submit registration
        await page.getByRole('button', { name: /Kayıt Ol/i }).click();
        await page.waitForTimeout(2000);

        // Step 5: Navigate to dashboard (simulating successful registration)
        await page.goto('http://localhost:8080/dashboard/parent');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Step 6: Add a child
        await expect(page.getByText('Çocuk Ekle')).toBeVisible();
        await page.getByText('Çocuk Ekle').click();
        await page.waitForTimeout(1000);

        // Fill child form
        await page.getByLabel(/Çocuk Adı/i).fill('Test Child');
        await page.getByLabel(/Doğum Tarihi/i).fill('2015-05-15');
        await page.getByLabel(/Okul/i).fill('Test Okulu');
        await page.getByLabel(/Alerjiler/i).fill('None');
        await page.getByLabel(/Notlar/i).fill('Test notes for child');

        // Submit child form
        await page.getByRole('button', { name: /Kaydet/i }).click();
        await page.waitForTimeout(2000);

        // Step 7: Navigate to sitter search
        await page.goto('http://localhost:8080/find-sitters');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify search page loads
        await expect(page.getByText('Bakıcı Ara')).toBeVisible();
        await expect(page.getByPlaceholder('Konum, Okul, veya İsim')).toBeVisible();

        // Step 8: Search for sitters
        await page.getByPlaceholder('Konum, Okul, veya İsim').fill('Beşiktaş');
        await page.getByRole('button', { name: /Ara/i }).click();
        await page.waitForTimeout(2000);

        // Verify search results
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('Boğaziçi Üniversitesi')).toBeVisible();
        await expect(page.getByText('₺500/saat')).toBeVisible();

        // Step 9: View sitter profile
        await page.getByText('Test Sitter').first().click();
        await page.waitForTimeout(2000);

        // Verify profile details
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('Experienced babysitter')).toBeVisible();
        await expect(page.getByText('4.5')).toBeVisible(); // Rating

        // Step 10: Book the sitter
        await page.getByRole('button', { name: /Randevu Al/i }).click();
        await page.waitForTimeout(2000);

        // Fill booking form
        await page.getByLabel(/Tarih/i).fill('2024-03-01');
        await page.getByLabel(/Başlangıç Saati/i).fill('15:00');
        await page.getByLabel(/Bitiş Saati/i).fill('17:00');
        await page.getByLabel(/Toplanma Yeri/i).fill('Okul Önü');
        await page.getByLabel(/Notlar/i).fill('Test booking notes');

        // Select child for booking
        await page.getByLabel(/Çocuk Seç/i).selectOption({ label: 'Test Child' });

        // Submit booking request
        await page.getByRole('button', { name: /Randevu Gönder/i }).click();
        await page.waitForTimeout(3000);

        // Verify booking was created
        await expect(page.getByText(/Randevu isteği gönderildi/i)).toBeVisible();

        // Step 11: Navigate to my bookings to verify
        await page.goto('http://localhost:8080/bookings');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify booking appears in list
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('Beklemede')).toBeVisible(); // Pending status

        console.log('✓ Parent journey test completed successfully');
    });

    test('Parent can view and edit child profile', async ({ page, context }) => {
        console.log('Starting child profile management test...');

        await setupParentMocks(page, context);

        // Navigate to dashboard
        await page.goto('http://localhost:8080/dashboard/parent');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Navigate to children page
        await page.goto('http://localhost:8080/children');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Mock existing child
        await context.route('**/rest/v1/children*select=*', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'child-123',
                        name: 'Test Child',
                        birth_date: '2015-05-15',
                        school: 'Test Okulu',
                        allergies: 'None',
                        notes: 'Test notes',
                        parent_id: 'test-parent-123'
                    }
                ])
            });
        });

        // Reload page to get mocked data
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify child is displayed
        await expect(page.getByText('Test Child')).toBeVisible();
        await expect(page.getByText('Test Okulu')).toBeVisible();

        // Edit child
        await page.getByRole('button', { name: /Düzenle/i }).first().click();
        await page.waitForTimeout(1000);

        // Update child information
        await page.getByLabel(/Notlar/i).fill('Updated notes for child');

        // Save changes
        await page.getByRole('button', { name: /Kaydet/i }).click();
        await page.waitForTimeout(2000);

        // Verify success message
        await expect(page.getByText(/Çocuk profili güncellendi/i)).toBeVisible();

        console.log('✓ Child profile management test completed');
    });

    test('Parent can filter sitters by language and price', async ({ page, context }) => {
        console.log('Starting sitter filter test...');

        await setupParentMocks(page, context);

        // Navigate to sitter search
        await page.goto('http://localhost:8080/find-sitters');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Apply language filter
        await page.getByLabel(/Dil/i).selectOption('English');
        await page.waitForTimeout(1000);

        // Apply price filter
        await page.getByLabel(/Max Fiyat/i).fill('550');
        await page.getByRole('button', { name: /Filtrele/i }).click();
        await page.waitForTimeout(2000);

        // Verify filtered results
        await expect(page.getByText('Test Sitter')).toBeVisible(); // Has English, ₺500
        // Should not show the more expensive sitter
        await expect(page.getByText('Another Sitter')).not.toBeVisible();

        console.log('✓ Sitter filtering test completed');
    });
});