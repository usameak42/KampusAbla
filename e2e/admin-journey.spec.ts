import { test, expect } from '@playwright/test';
import { firebaseMock } from './setup/firebase-mock';

test.describe('Admin Journey E2E Tests', () => {

    // Setup function to mock all necessary APIs
    const setupAdminMocks = async (page: any, context: any) => {
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
                        id: 'test-admin-123',
                        email: 'admin@test.com',
                        user_metadata: {
                            role: 'admin',
                            verification_status: 'verified'
                        }
                    },
                    session: {
                        access_token: 'mock-admin-token',
                        refresh_token: 'mock-refresh-token'
                    }
                })
            });
        });

        // Mock REST API calls
        await context.route('**/rest/v1/**', async (route: any) => {
            const url = route.request().url();

            // Mock verification queue data
            if (url.includes('/sitter_verifications') && url.includes('status=eq.pending')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'verif-123',
                            sitter_id: 'sitter-123',
                            user_id: 'user-123',
                            document_type: 'student_id',
                            status: 'pending',
                            document_url: 'https://example.com/student-id.pdf',
                            created_at: new Date().toISOString(),
                            users: {
                                full_name: 'Test Sitter',
                                email: 'sitter@test.com',
                                university: 'Boğaziçi Üniversitesi'
                            }
                        },
                        {
                            id: 'verif-456',
                            sitter_id: 'sitter-456',
                            user_id: 'user-456',
                            document_type: 'background_check',
                            status: 'pending',
                            document_url: 'https://example.com/background-check.pdf',
                            created_at: new Date().toISOString(),
                            users: {
                                full_name: 'Another Sitter',
                                email: 'another@test.com',
                                university: 'İstanbul Üniversitesi'
                            }
                        }
                    ])
                });
                return;
            }

            // Mock analytics data
            if (url.includes('/rpc/get_admin_analytics_summary')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            metric: 'total_users',
                            value: 1250,
                            change: '+5.2%'
                        },
                        {
                            metric: 'active_sessions',
                            value: 42,
                            change: '+12.3%'
                        },
                        {
                            metric: 'pending_verifications',
                            value: 8,
                            change: '-2.1%'
                        },
                        {
                            metric: 'monthly_revenue',
                            value: 125000,
                            change: '+18.7%'
                        }
                    ])
                });
                return;
            }

            // Mock user management data
            if (url.includes('/users') && !url.includes('select=')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'user-123',
                            email: 'parent@test.com',
                            full_name: 'Test Parent',
                            role: 'parent',
                            created_at: '2024-01-15T10:00:00Z',
                            last_login: '2024-03-01T15:30:00Z'
                        },
                        {
                            id: 'user-456',
                            email: 'sitter@test.com',
                            full_name: 'Test Sitter',
                            role: 'sitter',
                            created_at: '2024-01-20T14:00:00Z',
                            last_login: '2024-03-01T16:45:00Z'
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

    test('Admin login → verification queue → approve sitter', async ({ page, context }) => {
        console.log('Starting admin journey test...');

        await setupAdminMocks(page, context);

        // Step 1: Navigate to admin login
        await page.goto('http://localhost:8080/admin/login');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Step 2: Fill login form
        await page.getByLabel(/Email/i).fill('admin@test.com');
        await page.getByLabel(/Şifre/i).fill('adminpassword');
        await page.getByRole('button', { name: /Giriş Yap/i }).click();
        await page.waitForTimeout(2000);

        // Step 3: Navigate to admin dashboard
        await page.goto('http://localhost:8080/admin/dashboard');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify admin dashboard elements
        await expect(page.getByText('Yönetici Paneli')).toBeVisible();
        await expect(page.getByText('Bekleyen Doğrulamalar')).toBeVisible();
        await expect(page.getByText('8')).toBeVisible(); // Pending count

        // Step 4: Navigate to verification queue
        await page.getByText('Doğrulama Sırası').click();
        await page.waitForTimeout(2000);

        // Verify verification queue items
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await page.getByText('Boğaziçi Üniversitesi').toBeVisible();
        await expect(page.getByText('Öğrenci Belgesi')).toBeVisible();

        // Step 5: Review verification documents
        await page.getByRole('button', { name: /İncele/i }).first().click();
        await page.waitForTimeout(2000);

        // Verify document viewer
        await expect(page.getByText('Belge İncelemesi')).toBeVisible();
        await expect(page.getByText('Öğrenci Kimliği')).toBeVisible();

        // Step 6: Approve verification
        await page.getByRole('button', { name: /Onayla/i }).click();
        await page.waitForTimeout(1000);

        // Add approval notes
        await page.getByLabel(/Onay Notları/i).fill('Student ID verified - document is clear and valid');
        await page.getByRole('button', { name: /Onayı Kaydet/i }).click();
        await page.waitForTimeout(2000);

        // Verify approval success
        await expect(page.getByText(/Doğrulama onaylandı/i)).toBeVisible();

        // Step 7: Return to verification queue
        await page.goto('http://localhost:8080/admin/verifications');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify updated queue
        await expect(page.getByText('7')).toBeVisible(); // One less pending

        // Step 8: Approve background check
        await page.getByText('Another Sitter').click();
        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: /İncele/i }).click();
        await page.waitForTimeout(2000);

        await page.getByRole('button', { name: /Onayla/i }).click();
        await page.waitForTimeout(1000);
        await page.getByLabel(/Onay Notları/i).fill('Background check clear - no criminal records found');
        await page.getByRole('button', { name: /Onayı Kaydet/i }).click();
        await page.waitForTimeout(2000);

        // Step 9: Navigate to approved verifications
        await page.getByText('Onaylananlar').click();
        await page.waitForTimeout(2000);

        // Verify approved verifications
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('Onaylandı')).toBeVisible();

        console.log('✓ Admin journey test completed successfully');
    });

    test('Admin can view analytics dashboard', async ({ page, context }) => {
        console.log('Starting admin analytics test...');

        await setupAdminMocks(page, context);

        // Navigate to admin dashboard
        await page.goto('http://localhost:8080/admin/dashboard');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Navigate to analytics
        await page.getByText('Analitik').click();
        await page.waitForTimeout(2000);

        // Verify analytics metrics
        await expect(page.getByText('Toplam Kullanıcı')).toBeVisible();
        await expect(page.getByText('1.250')).toBeVisible();
        await expect(page.getByText('+5.2%')).toBeVisible();

        await expect(page.getByText('Aktif Oturum')).toBeVisible();
        await expect(page.getByText('42')).toBeVisible();
        await expect(page.getByText('+12.3%')).toBeVisible();

        await expect(page.getByText('Aylık Gelir')).toBeVisible();
        await expect(page.getByText('₺125.000')).toBeVisible();
        await expect(page.getByText('+18.7%')).toBeVisible();

        console.log('✓ Admin analytics test completed');
    });

    test('Admin can manage users', async ({ page, context }) => {
        console.log('Starting user management test...');

        await setupAdminMocks(page, context);

        // Navigate to user management
        await page.goto('http://localhost:8080/admin/users');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify user list
        await expect(page.getByText('Kullanıcı Yönetimi')).toBeVisible();
        await expect(page.getByText('Test Parent')).toBeVisible();
        await expect(page.getByText('parent@test.com')).toBeVisible();
        await expect(page.getByText('Veli')).toBeVisible();

        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('sitter@test.com')).toBeVisible();
        await expect(page.getByText('Bakıcı')).toBeVisible();

        // Search for user
        await page.getByPlaceholder(/Kullanıcı ara/i).fill('parent@test.com');
        await page.getByRole('button', { name: /Ara/i }).click();
        await page.waitForTimeout(2000);

        // Verify search results
        await expect(page.getByText('Test Parent')).toBeVisible();
        await expect(page.getByText('Test Sitter')).not.toBeVisible();

        // Clear search
        await page.getByPlaceholder(/Kullanıcı ara/i).fill('');
        await page.getByRole('button', { name: /Temizle/i }).click();
        await page.waitForTimeout(2000);

        // Verify all users are shown again
        await expect(page.getByText('Test Parent')).toBeVisible();
        await expect(page.getByText('Test Sitter')).toBeVisible();

        console.log('✓ User management test completed');
    });

    test('Admin can handle disputes', async ({ page, context }) => {
        console.log('Starting dispute management test...');

        // Mock disputes data
        await context.route('**/rest/v1/disputes*', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'dispute-123',
                        booking_id: 'booking-123',
                        reporter_id: 'parent-123',
                        reported_user_id: 'sitter-123',
                        reason: 'late_arrival',
                        description: 'Sitter arrived 30 minutes late',
                        status: 'open',
                        created_at: new Date().toISOString()
                    }
                ])
            });
        });

        await setupAdminMocks(page, context);

        // Navigate to disputes
        await page.goto('http://localhost:8080/admin/disputes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify disputes list
        await expect(page.getByText('Anlaşmazlık Yönetimi')).toBeVisible();
        await expect(page.getByText('Geç Kalkış')).toBeVisible();
        await expect(page.getByText('Bakıcı 30 dakika geç geldi')).toBeVisible();

        // Review dispute
        await page.getByRole('button', { name: /İncele/i }).click();
        await page.waitForTimeout(2000);

        // Verify dispute details
        await expect(page.getByText('Anlaşmazlık Detayları')).toBeVisible();
        await expect(page.getByText('Randevu ID: booking-123')).toBeVisible();

        // Resolve dispute
        await page.getByRole('button', { name: /Çöz/i }).click();
        await page.waitForTimeout(1000);

        // Select resolution
        await page.getByLabel(/Karar/i).selectOption('partial_refund');
        await page.getByLabel(/Çözüm Notları/i).fill('Partial refund approved - 50% refund to parent');
        await page.getByRole('button', { name: /Kaydet/i }).click();
        await page.waitForTimeout(2000);

        // Verify resolution
        await expect(page.getByText(/Anlaşmazlık çözüldü/i)).toBeVisible();

        console.log('✓ Dispute management test completed');
    });
});