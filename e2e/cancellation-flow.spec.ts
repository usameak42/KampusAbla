import { test, expect } from '@playwright/test';
import { firebaseMock } from './setup/firebase-mock';

test.describe('Cancellation Flow E2E Tests', () => {

    // Setup function to mock all necessary APIs
    const setupCancellationMocks = async (page: any, context: any) => {
        // Block external domains
        await context.route('**supabase.co/**', (route: any) => route.abort());
        await context.route('**fcm.googleapis.com/**', (route: any) => route.abort());
        await context.route('**iyzico.com/**', (route: any) => route.abort());

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
            const method = route.request().method();

            // Mock existing bookings
            if (url.includes('/bookings') && url.includes('parent_id=')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'booking-123',
                            parent_id: 'test-parent-123',
                            sitter_id: 'sitter-123',
                            child_id: 'child-123',
                            status: 'confirmed',
                            booking_date: '2024-03-01',
                            start_time: '15:00',
                            end_time: '17:00',
                            pickup_location: 'Okul Önü',
                            notes: 'Test booking notes',
                            created_at: new Date().toISOString(),
                            sitter: {
                                full_name: 'Test Sitter',
                                hourly_rate: 500
                            },
                            children: {
                                name: 'Test Child'
                            }
                        },
                        {
                            id: 'booking-456',
                            parent_id: 'test-parent-123',
                            sitter_id: 'sitter-456',
                            child_id: 'child-123',
                            status: 'confirmed',
                            booking_date: '2024-03-05',
                            start_time: '14:00',
                            end_time: '16:00',
                            pickup_location: 'Ev',
                            notes: 'Another booking',
                            created_at: new Date().toISOString(),
                            sitter: {
                                full_name: 'Another Sitter',
                                hourly_rate: 600
                            },
                            children: {
                                name: 'Test Child'
                            }
                        }
                    ])
                });
                return;
            }

            // Mock cancellation with refund
            if (url.includes('/rpc/cancel_booking') && method === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        refund_amount: 1000,
                        refund_status: 'processing',
                        cancellation_policy: '50% refund (cancelled 2-12 hours before)'
                    })
                });
                return;
            }

            // Mock refund processing
            if (url.includes('/transactions') && method === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'refund-123',
                        booking_id: 'booking-123',
                        amount: -1000,
                        type: 'refund',
                        status: 'completed',
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

    test('Parent can cancel booking with refund', async ({ page, context }) => {
        console.log('Starting cancellation flow test...');

        await setupCancellationMocks(page, context);

        // Step 1: Navigate to bookings
        await page.goto('http://localhost:8080/bookings');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify bookings list
        await expect(page.getByText('Randevularım')).toBeVisible();
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('Onaylandı')).toBeVisible();

        // Step 2: Cancel first booking
        await page.getByRole('button', { name: /İptal Et/i }).first().click();
        await page.waitForTimeout(1000);

        // Step 3: Select cancellation reason
        await expect(page.getByText('İptal Nedeni')).toBeVisible();
        await page.getByLabel(/Neden/i).selectOption('schedule_change');
        await page.getByLabel(/Açıklama/i).fill('Need to reschedule due to conflicting appointment');

        // Step 4: Confirm cancellation
        await page.getByRole('button', { name: /İptali Onayla/i }).click();
        await page.waitForTimeout(1000);

        // Step 5: Review refund policy
        await expect(page.getByText('İade Politikası')).toBeVisible();
        await expect(page.getByText('50% iade')).toBeVisible();
        await expect(page.getByText('₺500')).toBeVisible(); // 50% of ₺1000

        // Step 6: Confirm cancellation with refund
        await page.getByRole('button', { name: /İptali Tamamla/i }).click();
        await page.waitForTimeout(2000);

        // Verify cancellation success
        await expect(page.getByText(/Randevu iptal edildi/i)).toBeVisible();
        await expect(page.getByText(/İade işleniyor/i)).toBeVisible();

        // Step 7: Navigate to refund status
        await page.goto('http://localhost:8080/refunds');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify refund details
        await expect(page.getByText('İade Durumu')).toBeVisible();
        await expect(page.getByText('İşleniyor')).toBeVisible();
        await expect(page.getByText('₺500')).toBeVisible();

        console.log('✓ Cancellation flow test completed successfully');
    });

    test('Parent cannot cancel booking less than 2 hours before (full charge)', async ({ page, context }) => {
        console.log('Starting late cancellation test...');

        await setupCancellationMocks(page, context);

        // Mock booking less than 2 hours away
        await context.route('**/rest/v1/bookings*parent_id=*', async (route: any) => {
            const bookingTime = new Date();
            bookingTime.setHours(bookingTime.getHours() + 1); // 1 hour from now

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'booking-last-minute',
                        parent_id: 'test-parent-123',
                        sitter_id: 'sitter-123',
                        child_id: 'child-123',
                        status: 'confirmed',
                        booking_date: bookingTime.toISOString().split('T')[0],
                        start_time: bookingTime.toTimeString().split(' ')[0].substring(0, 5),
                        end_time: '17:00',
                        pickup_location: 'Okul Önü',
                        created_at: new Date().toISOString()
                    }
                ])
            });
        });

        // Navigate to bookings
        await page.goto('http://localhost:8080/bookings');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Try to cancel last-minute booking
        await page.getByRole('button', { name: /İptal Et/i }).first().click();
        await page.waitForTimeout(1000);

        // Verify late cancellation warning
        await expect(page.getByText('İptal Uyarısı')).toBeVisible();
        await expect(page.getByText('2 saatten az kala iptal')).toBeVisible();
        await expect(page.getByText('%100 iade')).toBeVisible();
        await expect(page.getByText('İptal ederseniz tam ücret ödemeniz gerekecektir')).toBeVisible();

        // Proceed with cancellation
        await page.getByLabel(/Neden/i).selectOption('emergency');
        await page.getByRole('button', { name: /İptali Onayla/i }).click();
        await page.waitForTimeout(1000);

        // Verify no refund
        await expect(page.getByText('İade Yok')).toBeVisible();
        await expect(page.getByText('Tam Ücret İptali')).toBeVisible();

        console.log('✓ Late cancellation test completed');
    });

    test('Parent can cancel booking more than 12 hours before (full refund)', async ({ page, context }) => {
        console.log('Starting early cancellation test...');

        await setupCancellationMocks(page, context);

        // Mock booking more than 12 hours away
        await context.route('**/rest/v1/bookings*parent_id=*', async (route: any) => {
            const bookingTime = new Date();
            bookingTime.setDate(bookingTime.getDate() + 2); // 2 days from now

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'booking-early',
                        parent_id: 'test-parent-123',
                        sitter_id: 'sitter-123',
                        child_id: 'child-123',
                        status: 'confirmed',
                        booking_date: bookingTime.toISOString().split('T')[0],
                        start_time: '15:00',
                        end_time: '17:00',
                        pickup_location: 'Okul Önü',
                        created_at: new Date().toISOString()
                    }
                ])
            });
        });

        // Navigate to bookings
        await page.goto('http://localhost:8080/bookings');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Cancel early booking
        await page.getByRole('button', { name: /İptal Et/i }).first().click();
        await page.waitForTimeout(1000);

        // Verify full refund message
        await expect(page.getByText('Tam İade')).toBeVisible();
        await expect(page.getByText('12 saatten önce iptal')).toBeVisible();
        await expect(page.getByText('%100 iade')).toBeVisible();

        // Proceed with cancellation
        await page.getByLabel(/Neden/i).selectOption('schedule_change');
        await page.getByRole('button', { name: /İptali Onayla/i }).click();
        await page.waitForTimeout(1000);

        // Verify full refund
        await expect(page.getByText('Tam İade İşleniyor')).toBeVisible();
        await expect(page.getByText('₺1000')).toBeVisible(); // Full amount

        console.log('✓ Early cancellation test completed');
    });

    test('Sitter receives cancellation notification', async ({ page, context }) => {
        console.log('Starting sitter cancellation notification test...');

        // Mock sitter auth
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

        await setupCancellationMocks(page, context);

        // Navigate to sitter dashboard
        await page.goto('http://localhost:8080/dashboard/sitter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify cancellation notification
        await expect(page.getByText('Randevu İptali')).toBeVisible();
        await expect(page.getByText('Test Parent')).toBeVisible();
        await expect(page.getByText('Test Child')).toBeVisible();
        await expect(page.getByText('İptal Edildi')).toBeVisible();

        // View cancellation details
        await page.getByRole('button', { name: /Detayları Gör/i }).click();
        await page.waitForTimeout(1000);

        // Verify cancellation details
        await expect(page.getByText('İptal Nedeni')).toBeVisible();
        await expect(page.getByText('Program Değişikliği')).toBeVisible();
        await expect(page.getByText('İade Durumu')).toBeVisible();

        console.log('✓ Sitter notification test completed');
    });
});