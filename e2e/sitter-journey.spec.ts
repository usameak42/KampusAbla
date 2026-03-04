import { test, expect } from '@playwright/test';
import { firebaseMock } from './setup/firebase-mock';

test.describe('Sitter Journey E2E Tests', () => {

    // Setup function to mock all necessary APIs
    const setupSitterMocks = async (page: any, context: any) => {
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
                        id: 'test-sitter-123',
                        email: 'sitter@test.com',
                        user_metadata: {
                            role: 'sitter',
                            verification_status: 'verified'
                        }
                    },
                    session: {
                        access_token: 'mock-sitter-token',
                        refresh_token: 'mock-refresh-token'
                    }
                })
            });
        });

        // Mock REST API calls
        await context.route('**/rest/v1/**', async (route: any) => {
            const url = route.request().url();

            // Mock sitter profile data
            if (url.includes('/sitters') && url.includes('select=') && !url.includes('rpc=')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{
                        id: 'test-sitter-123',
                        user_id: 'test-sitter-123',
                        full_name: 'Test Sitter',
                        university: 'Boğaziçi Üniversitesi',
                        department: 'Computer Engineering',
                        graduation_year: 2022,
                        bio: 'Experienced babysitter with 3+ years',
                        hourly_rate: 500,
                        languages: ['Turkish', 'English'],
                        verification_status: 'verified',
                        available_areas: ['Beşiktaş', 'Levent', 'Şişli'],
                        availability_monday: true,
                        availability_tuesday: true,
                        availability_wednesday: true,
                        availability_thursday: true,
                        availability_friday: true,
                        availability_saturday: false,
                        availability_sunday: false
                    }])
                });
                return;
            }

            // Mock bookings data
            if (url.includes('/bookings') && url.includes('sitter_id=')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'booking-123',
                            parent_id: 'parent-123',
                            sitter_id: 'test-sitter-123',
                            child_id: 'child-123',
                            status: 'pending',
                            booking_date: '2024-03-01',
                            start_time: '15:00',
                            end_time: '17:00',
                            pickup_location: 'Okul Önü',
                            notes: 'Test booking notes',
                            created_at: new Date().toISOString()
                        }
                    ])
                });
                return;
            }

            // Mock sessions data
            if (url.includes('/sessions') && url.includes('sitter_id=')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'session-123',
                            booking_id: 'booking-123',
                            status: 'confirmed',
                            start_time: '2024-03-01T15:00:00Z',
                            end_time: '2024-03-01T17:00:00Z'
                        }
                    ])
                });
                return;
            }

            // Mock verification documents
            if (url.includes('/sitter_verifications') && url.includes('sitter_id=')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'verif-123',
                            sitter_id: 'test-sitter-123',
                            document_type: 'student_id',
                            status: 'approved',
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 'verif-456',
                            sitter_id: 'test-sitter-123',
                            document_type: 'background_check',
                            status: 'approved',
                            created_at: new Date().toISOString()
                        }
                    ])
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

    test('Sitter registration → verification upload → accept booking → complete session', async ({ page, context }) => {
        console.log('Starting sitter journey test...');

        await setupSitterMocks(page, context);

        // Step 1: Navigate to registration
        await page.goto('http://localhost:8080/register');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Step 2: Select sitter role
        await expect(page.getByText('Bakıcı Ol')).toBeVisible();
        await page.getByText('Bakıcı Ol').click();
        await page.waitForTimeout(1000);

        // Step 3: Fill registration form
        await page.getByLabel(/Ad Soyad/i).fill('Test Sitter');
        await page.getByLabel(/Email/i).fill('sitter@test.com');
        await page.getByLabel(/Şifre/i).fill('password123');
        await page.getByLabel(/Telefon/i).fill('5559876543');

        // Step 4: Submit registration
        await page.getByRole('button', { name: /Kayıt Ol/i }).click();
        await page.waitForTimeout(2000);

        // Step 5: Navigate to sitter registration steps
        await page.goto('http://localhost:8080/register/sitter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Step 6: Complete registration steps
        // Step 1: Personal Info
        await page.getByLabel(/Üniversite/i).fill('Boğaziçi Üniversitesi');
        await page.getByLabel(/Bölüm/i).fill('Computer Engineering');
        await page.getByLabel(/Mezuniyet Yılı/i).fill('2022');
        await page.getByRole('button', { name: /Devam/i }).click();
        await page.waitForTimeout(1000);

        // Step 2: Service Details
        await page.getByLabel(/Saatlik Ücret/i).fill('500');
        await page.getByLabel(/Hakkımda/i).fill('Experienced babysitter with 3+ years');
        await page.getByLabel(/Diller/i).selectOption(['Turkish', 'English']);
        await page.getByRole('button', { name: /Devam/i }).click();
        await page.waitForTimeout(1000);

        // Step 3: Availability
        await page.getByLabel(/Pazartesi/i).check();
        await page.getByLabel(/Salı/i).check();
        await page.getByLabel(/Çarşamba/i).check();
        await page.getByLabel(/Perşembe/i).check();
        await page.getByLabel(/Cuma/i).check();
        await page.getByLabel(/Hizmet Alanları/i).selectOption(['Beşiktaş', 'Levent', 'Şişli']);
        await page.getByRole('button', { name: /Devam/i }).click();
        await page.waitForTimeout(1000);

        // Step 4: Verification Documents
        await expect(page.getByText('Kimlik Doğrulama')).toBeVisible();
        await page.getByLabel(/Öğrenci Belgesi/i).setInputFiles('test-student-id.pdf');
        await page.getByLabel(/Adli Sicil Kaydı/i).setInputFiles('test-background-check.pdf');
        await page.getByRole('button', { name: /Gönder/i }).click();
        await page.waitForTimeout(2000);

        // Step 7: Navigate to dashboard (simulating approved verification)
        await page.goto('http://localhost:8080/dashboard/sitter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify dashboard shows verification status
        await expect(page.getByText('Doğrulanmış')).toBeVisible();

        // Step 8: View booking requests
        await page.goto('http://localhost:8080/bookings');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify booking request is displayed
        await expect(page.getByText('Yeni Randevu İsteği')).toBeVisible();
        await expect(page.getByText('Test Parent')).toBeVisible();
        await expect(page.getByText('Test Child')).toBeVisible();

        // Step 9: Accept booking
        await page.getByRole('button', { name: /Kabul Et/i }).click();
        await page.waitForTimeout(1000);

        // Confirm acceptance
        await page.getByRole('button', { name: /Onayla/i }).click();
        await page.waitForTimeout(2000);

        // Verify booking is accepted
        await expect(page.getByText('Randevu Kabul Edildi')).toBeVisible();
        await expect(page.getByText('Onaylandı')).toBeVisible();

        // Step 10: Navigate to active session
        await page.goto('http://localhost:8080/session');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify session details
        await expect(page.getByText('Aktif Oturum')).toBeVisible();
        await expect(page.getByText('Test Parent')).toBeVisible();
        await expect(page.getByText('Test Child')).toBeVisible();

        // Step 11: Update session status - On my way
        await page.getByRole('button', { name: /Yoldayım/i }).click();
        await page.waitForTimeout(1000);
        await expect(page.getByText('Yoldayım')).toBeVisible();

        // Step 12: Update session status - Picked up
        await page.getByRole('button', { name: /Alındı/i }).click();
        await page.waitForTimeout(1000);
        await expect(page.getByText('Çocuk Alındı')).toBeVisible();

        // Step 13: Update session status - Arrived
        await page.getByRole('button', { name: /Ulaştı/i }).click();
        await page.waitForTimeout(1000);
        await expect(page.getByText('Buluşma Noktasına Ulaşıldı')).toBeVisible();

        // Step 14: Complete session
        await page.getByRole('button', { name: /Oturumu Bitir/i }).click();
        await page.waitForTimeout(1000);

        // Add session notes
        await page.getByLabel(/Oturum Notları/i).fill('Child was well-behaved, completed homework on time');
        await page.getByRole('button', { name: /Bitir/i }).click();
        await page.waitForTimeout(2000);

        // Verify session completion
        await expect(page.getByText('Oturum Tamamlandı')).toBeVisible();

        // Step 15: Leave review
        await page.getByRole('button', { name: /Değerlendirme Yap/i }).click();
        await page.waitForTimeout(1000);

        // Fill review form
        await page.getByLabel(/Puan/i).selectOption('5'); // 5 stars
        await page.getByLabel(/Yorum/i).fill('Excellent babysitter, very professional and caring');
        await page.getByRole('button', { name: /Gönder/i }).click();
        await page.waitForTimeout(2000);

        // Verify review submitted
        await expect(page.getByText('Değerlendirme Gönderildi')).toBeVisible();

        console.log('✓ Sitter journey test completed successfully');
    });

    test('Sitter can edit profile and availability', async ({ page, context }) => {
        console.log('Starting sitter profile edit test...');

        await setupSitterMocks(page, context);

        // Navigate to sitter profile
        await page.goto('http://localhost:8080/profile/sitter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Edit profile
        await page.getByRole('button', { name: /Profili Düzenle/i }).click();
        await page.waitForTimeout(1000);

        // Update hourly rate
        await page.getByLabel(/Saatlik Ücret/i).fill('550');

        // Update bio
        await page.getByLabel(/Hakkımda/i).fill('Updated bio with more experience details');

        // Save changes
        await page.getByRole('button', { name: /Kaydet/i }).click();
        await page.waitForTimeout(2000);

        // Verify success message
        await expect(page.getByText(/Profil güncellendi/i)).toBeVisible();

        console.log('✓ Sitter profile edit test completed');
    });

    test('Sitter can view earnings history', async ({ page, context }) => {
        console.log('Starting earnings history test...');

        await setupSitterMocks(page, context);

        // Mock earnings data
        await context.route('**/rest/v1/earnings*', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'earning-1',
                        session_id: 'session-123',
                        amount: 1000,
                        platform_fee: 100,
                        net_amount: 900,
                        date: '2024-03-01',
                        status: 'paid'
                    },
                    {
                        id: 'earning-2',
                        session_id: 'session-456',
                        amount: 1500,
                        platform_fee: 150,
                        net_amount: 1350,
                        date: '2024-03-05',
                        status: 'pending'
                    }
                ])
            });
        });

        // Navigate to earnings page
        await page.goto('http://localhost:8080/earnings');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify earnings are displayed
        await expect(page.getByText('Kazanç Geçmişi')).toBeVisible();
        await expect(page.getByText('₺1.000')).toBeVisible();
        await expect(page.getByText('₺1.500')).toBeVisible();
        await expect(page.getByText('Ödendi')).toBeVisible();
        await expect(page.getByText('Beklemede')).toBeVisible();

        // Verify total earnings
        await expect(page.getByText('Toplam Kazanç: ₺2.250')).toBeVisible();

        console.log('✓ Earnings history test completed');
    });
});