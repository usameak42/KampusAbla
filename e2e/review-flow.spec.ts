import { test, expect } from '@playwright/test';
import { firebaseMock } from './setup/firebase-mock';

test.describe('Review Flow E2E Tests', () => {

    // Setup function to mock all necessary APIs
    const setupReviewMocks = async (page: any, context: any) => {
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
            const method = route.request().method();

            // Mock completed sessions
            if (url.includes('/sessions') && url.includes('status=eq.completed')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'session-123',
                            booking_id: 'booking-123',
                            status: 'completed',
                            end_time: '2024-03-01T17:00:00Z',
                            booking: {
                                sitter: {
                                    full_name: 'Test Sitter',
                                    id: 'sitter-123'
                                },
                                parent: {
                                    full_name: 'Test Parent',
                                    id: 'parent-123'
                                },
                                children: {
                                    name: 'Test Child',
                                    id: 'child-123'
                                }
                            }
                        }
                    ])
                });
                return;
            }

            // Mock existing reviews
            if (url.includes('/reviews') && url.includes('reviewer_id=')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'review-456',
                            session_id: 'session-456',
                            reviewer_id: 'test-parent-123',
                            reviewed_user_id: 'sitter-456',
                            rating: 4,
                            comment: 'Good sitter',
                            created_at: '2024-02-15T10:00:00Z'
                        }
                    ])
                });
                return;
            }

            // Mock review submission
            if (url.includes('/reviews') && method === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'review-123',
                        session_id: 'session-123',
                        reviewer_id: 'test-parent-123',
                        reviewed_user_id: 'sitter-123',
                        rating: 5,
                        comment: 'Excellent babysitter!',
                        created_at: new Date().toISOString()
                    })
                });
                return;
            }

            // Mock sitter profile update
            if (url.includes('/sitters') && method === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'sitter-123',
                        rating: 4.8, // Updated average rating
                        review_count: 25 // Updated review count
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

    test('Parent can leave review after completed session', async ({ page, context }) => {
        console.log('Starting parent review flow test...');

        await setupReviewMocks(page, context);

        // Step 1: Navigate to completed sessions
        await page.goto('http://localhost:8080/sessions/completed');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify completed sessions list
        await expect(page.getByText('Tamamlanan Oturumlar')).toBeVisible();
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('Test Child')).toBeVisible();
        await expect(page.getByText('1 Mart 2024')).toBeVisible();

        // Step 2: Start review process
        await page.getByRole('button', { name: /Değerlendir/i }).first().click();
        await page.waitForTimeout(1000);

        // Step 3: Verify review form
        await expect(page.getByText('Değerlendirme Formu')).toBeVisible();
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('1 Mart 2024 Oturumu')).toBeVisible();

        // Step 4: Fill review form
        // Select rating (5 stars)
        await page.locator('input[name="rating"][value="5"]').check();

        // Add review comment
        await page.getByLabel(/Yorumunuz/i).fill('Excellent babysitter! Very professional and caring with my child. Always on time and sends updates during the session.');

        // Select specific aspects
        await page.getByLabel(/Zamanlama/i).selectOption('5'); // Excellent
        await page.getByLabel(/İletişim/i).selectOption('5'); // Excellent
        await page.getByLabel(/Güvenlik/i).selectOption('5'); // Excellent

        // Add additional notes
        await page.getByLabel(/Ek Notlar/i).fill('Would definitely book again!');

        // Step 5: Submit review
        await page.getByRole('button', { name: /Değerlendirmeyi Gönder/i }).click();
        await page.waitForTimeout(2000);

        // Verify review submission success
        await expect(page.getByText(/Değerlendirme gönderildi/i)).toBeVisible();
        await expect(page.getByText('Teşekkürler!')).toBeVisible();

        // Step 6: Verify review appears in history
        await page.goto('http://localhost:8080/reviews/my-reviews');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify review in history
        await expect(page.getByText('Değerlendirmelerim')).toBeVisible();
        await expect(page.getByText('Test Sitter')).toBeVisible();
        await expect(page.getByText('5')).toBeVisible(); // 5 stars
        await expect(page.getByText('Excellent babysitter!')).toBeVisible();

        console.log('✓ Parent review flow test completed successfully');
    });

    test('Sitter can view and respond to reviews', async ({ page, context }) => {
        console.log('Starting sitter review view test...');

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

        await setupReviewMocks(page, context);

        // Navigate to sitter reviews
        await page.goto('http://localhost:8080/reviews/sitter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify reviews list
        await expect(page.getByText('Alınan Değerlendirmeler')).toBeVisible();
        await expect(page.getByText('4.8')).toBeVisible(); // Average rating
        await expect(page.getByText('25 Değerlendirme')).toBeVisible(); // Review count

        // View specific review
        await page.getByText('Good sitter').click();
        await page.waitForTimeout(1000);

        // Verify review details
        await expect(page.getByText('Değerlendirme Detayları')).toBeVisible();
        await expect(page.getByText('Test Parent')).toBeVisible();
        await expect(page.getByText('15 Şubat 2024')).toBeVisible();

        // Respond to review (if applicable)
        await page.getByRole('button', { name: /Yanıtla/i }).click();
        await page.waitForTimeout(1000);

        // Write response
        await page.getByLabel(/Yanıtınız/i).fill('Teşekkür ederim! Çocuğunuzla çalışmak benim için bir zevkti.');
        await page.getByRole('button', { name: /Yanıtı Gönder/i }).click();
        await page.waitForTimeout(2000);

        // Verify response posted
        await expect(page.getByText(/Yanıt gönderildi/i)).toBeVisible();

        console.log('✓ Sitter review view test completed');
    });

    test('Review system prevents duplicate reviews', async ({ page, context }) => {
        console.log('Starting duplicate review prevention test...');

        await setupReviewMocks(page, context);

        // Mock that review already exists
        await context.route('**/rest/v1/reviews*session_id=session-123*', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'review-existing',
                        session_id: 'session-123',
                        reviewer_id: 'test-parent-123',
                        reviewed_user_id: 'sitter-123',
                        rating: 5,
                        comment: 'Already reviewed',
                        created_at: new Date().toISOString()
                    }
                ])
            });
        });

        // Navigate to completed sessions
        await page.goto('http://localhost:8080/sessions/completed');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Try to review already reviewed session
        await page.getByRole('button', { name: /Değerlendir/i }).first().click();
        await page.waitForTimeout(1000);

        // Verify duplicate review warning
        await expect(page.getByText('Daha Önce Değerlendirdiniz')).toBeVisible();
        await expect(page.getByText('Bu oturum için zaten bir değerlendirme yapmışsınız')).toBeVisible();
        await expect(page.getByRole('button', { name: /Değerlendirmeyi Gönder/i })).toBeDisabled();

        console.log('✓ Duplicate review prevention test completed');
    });

    test('Review system updates sitter average rating', async ({ page, context }) => {
        console.log('Starting rating update test...');

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

        await setupReviewMocks(page, context);

        // Navigate to sitter profile
        await page.goto('http://localhost:8080/profile/sitter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify current rating
        await expect(page.getByText('4.8')).toBeVisible(); // Average rating
        await expect(page.getByText('25 Değerlendirme')).toBeVisible(); // Review count

        // Submit a new review (this would trigger rating recalculation)
        await page.goto('http://localhost:8080/sessions/completed');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.getByRole('button', { name: /Değerlendir/i }).first().click();
        await page.waitForTimeout(1000);

        await page.locator('input[name="rating"][value="4"]').check();
        await page.getByLabel(/Yorumunuz/i).fill('Good experience overall');
        await page.getByRole('button', { name: /Değerlendirmeyi Gönder/i }).click();
        await page.waitForTimeout(2000);

        // Verify rating update notification
        await expect(page.getByText(/Puanınız güncellendi/i)).toBeVisible();

        // Check updated profile
        await page.goto('http://localhost:8080/profile/sitter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify updated rating (would be recalculated based on all reviews)
        await expect(page.getByText('4.7')).toBeVisible(); // Slightly lower due to new 4-star review
        await expect(page.getByText('26 Değerlendirme')).toBeVisible(); // One more review

        console.log('✓ Rating update test completed');
    });
});