import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import * as Sentry from '@sentry/react';

/**
 * Performance monitoring utility for tracking Web Vitals
 * 
 * This module implements:
 * 1. Web Vitals tracking (LCP, INP, CLS, FCP, TTFB)
 * 2. Custom spans for critical flows
 * 3. Performance budget monitoring
 * 4. Sentry integration for performance data
 */

// Performance budgets based on industry standards
export const PERFORMANCE_BUDGETS = {
    // Core Web Vitals
    LCP: 2500, // Largest Contentful Paint (ms) - Good: <2.5s
    INP: 200,  // Interaction to Next Paint (ms) - Good: <200ms (replaced FID)
    CLS: 0.1,  // Cumulative Layout Shift - Good: <0.1
    FCP: 1800, // First Contentful Paint (ms) - Good: <1.8s
    TTFB: 800, // Time to First Byte (ms) - Good: <800ms

    // Custom metrics
    API_RESPONSE_TIME: 500, // API calls (ms)
    PAGE_LOAD_TIME: 3000,  // Total page load (ms)
} as const;

// Custom performance tracking for critical flows
export function trackCustomPerformance<T>(
    name: string,
    operation: () => Promise<T> | T,
    tags?: Record<string, string>
): Promise<T> {
    return Sentry.startSpan(
        {
            name,
            op: 'custom',
            attributes: tags,
        },
        async (span) => {
            const start = performance.now();

            try {
                const result = await operation();
                const duration = performance.now() - start;

                // Check against performance budget
                const budget = PERFORMANCE_BUDGETS[name as keyof typeof PERFORMANCE_BUDGETS];
                if (budget && duration > budget) {
                    Sentry.captureMessage(
                        `Performance budget exceeded for ${name}: ${duration.toFixed(2)}ms (budget: ${budget}ms)`,
                        'warning'
                    );
                }

                // Add measurement as an attribute
                span.setAttribute('duration', duration.toString());

                return result;
            } catch (error) {
                const duration = performance.now() - start;
                span.setAttribute('duration', duration.toString());
                throw error;
            }
        }
    );
}

// Track API call performance
export function trackApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>,
    tags?: Record<string, string>
): Promise<T> {
    return Sentry.startSpan(
        {
            name: `api.${apiName}`,
            op: 'http.client',
            attributes: {
                ...tags,
                'api.name': apiName,
            },
        },
        async (span) => {
            const start = performance.now();

            try {
                const result = await apiCall();
                const duration = performance.now() - start;

                // Check API response time budget
                if (duration > PERFORMANCE_BUDGETS.API_RESPONSE_TIME) {
                    Sentry.captureMessage(
                        `API response time exceeded for ${apiName}: ${duration.toFixed(2)}ms`,
                        'warning'
                    );
                }

                // Add measurement as an attribute
                span.setAttribute('response_time', duration.toString());

                return result;
            } catch (error) {
                const duration = performance.now() - start;
                span.setAttribute('response_time', duration.toString());
                throw error;
            }
        }
    );
}

// Initialize Web Vitals tracking
export function initWebVitalsTracking() {
    // Cumulative Layout Shift (CLS)
    onCLS((metric) => {
        const { value, rating } = metric;

        Sentry.addBreadcrumb({
            message: 'Web Vital: CLS',
            category: 'performance',
            level: rating === 'good' ? 'info' : 'warning',
            data: {
                name: metric.name,
                value,
                rating,
                id: metric.id,
            },
        });

        // Use setMeasurement on the global scope
        Sentry.setMeasurement('CLS', value, 'unitless');

        if (rating !== 'good') {
            Sentry.captureMessage(
                `CLS performance issue: ${value.toFixed(4)} (rating: ${rating})`,
                'warning'
            );
        }
    });

    // Interaction to Next Paint (INP) - replaced FID in web-vitals v5
    onINP((metric) => {
        const { value, rating } = metric;

        Sentry.addBreadcrumb({
            message: 'Web Vital: INP',
            category: 'performance',
            level: rating === 'good' ? 'info' : 'warning',
            data: {
                name: metric.name,
                value,
                rating,
                id: metric.id,
            },
        });

        Sentry.setMeasurement('INP', value, 'millisecond');

        if (rating !== 'good') {
            Sentry.captureMessage(
                `INP performance issue: ${value.toFixed(2)}ms (rating: ${rating})`,
                'warning'
            );
        }
    });

    // First Contentful Paint (FCP)
    onFCP((metric) => {
        const { value, rating } = metric;

        Sentry.addBreadcrumb({
            message: 'Web Vital: FCP',
            category: 'performance',
            level: rating === 'good' ? 'info' : 'warning',
            data: {
                name: metric.name,
                value,
                rating,
                id: metric.id,
            },
        });

        Sentry.setMeasurement('FCP', value, 'millisecond');

        if (rating !== 'good') {
            Sentry.captureMessage(
                `FCP performance issue: ${value.toFixed(2)}ms (rating: ${rating})`,
                'warning'
            );
        }
    });

    // Largest Contentful Paint (LCP)
    onLCP((metric) => {
        const { value, rating } = metric;

        Sentry.addBreadcrumb({
            message: 'Web Vital: LCP',
            category: 'performance',
            level: rating === 'good' ? 'info' : 'warning',
            data: {
                name: metric.name,
                value,
                rating,
                id: metric.id,
            },
        });

        Sentry.setMeasurement('LCP', value, 'millisecond');

        if (rating !== 'good') {
            Sentry.captureMessage(
                `LCP performance issue: ${value.toFixed(2)}ms (rating: ${rating})`,
                'warning'
            );
        }
    });

    // Time to First Byte (TTFB)
    onTTFB((metric) => {
        const { value, rating } = metric;

        Sentry.addBreadcrumb({
            message: 'Web Vital: TTFB',
            category: 'performance',
            level: rating === 'good' ? 'info' : 'warning',
            data: {
                name: metric.name,
                value,
                rating,
                id: metric.id,
            },
        });

        Sentry.setMeasurement('TTFB', value, 'millisecond');

        if (rating !== 'good') {
            Sentry.captureMessage(
                `TTFB performance issue: ${value.toFixed(2)}ms (rating: ${rating})`,
                'warning'
            );
        }
    });
}

// Track page load performance
export function trackPageLoad(pageName: string) {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigationEntry) {
        const loadTime = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
        const domContentLoaded = navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart;

        Sentry.addBreadcrumb({
            message: 'Page Load Metrics',
            category: 'performance',
            level: 'info',
            data: {
                page: pageName,
                loadTime,
                domContentLoaded,
                domInteractive: navigationEntry.domInteractive - navigationEntry.fetchStart,
                firstPaint: navigationEntry.responseStart - navigationEntry.fetchStart,
            },
        });

        Sentry.setMeasurement('page_load_time', loadTime, 'millisecond');

        // Check page load budget
        if (loadTime > PERFORMANCE_BUDGETS.PAGE_LOAD_TIME) {
            Sentry.captureMessage(
                `Page load time exceeded for ${pageName}: ${loadTime.toFixed(2)}ms`,
                'warning'
            );
        }
    }
}

// Track React Query slow queries
export function trackSlowQuery(queryKey: string[], queryTime: number) {
    const SLOW_QUERY_THRESHOLD = 1000; // 1 second

    if (queryTime > SLOW_QUERY_THRESHOLD) {
        Sentry.addBreadcrumb({
            message: 'Slow React Query detected',
            category: 'performance',
            level: 'warning',
            data: {
                queryKey,
                queryTime,
            },
        });

        Sentry.setMeasurement('slow_query', queryTime, 'millisecond');
        Sentry.setTag('query.key', queryKey.join('.'));

        Sentry.captureMessage(
            `Slow React Query: ${queryKey.join('.')} took ${queryTime.toFixed(2)}ms`,
            'warning'
        );
    }
}

// Performance monitoring utilities for critical flows
export const CriticalFlows = {
    trackBookingCreation: <T>(
        operation: () => Promise<T> | T,
        tags?: Record<string, string>
    ) =>
        trackCustomPerformance(
            'booking_creation',
            operation,
            { flow: 'booking', ...tags }
        ),

    trackPaymentProcessing: <T>(
        operation: () => Promise<T> | T,
        tags?: Record<string, string>
    ) =>
        trackCustomPerformance(
            'payment_processing',
            operation,
            { flow: 'payment', ...tags }
        ),

    trackSitterSearch: <T>(
        operation: () => Promise<T> | T,
        tags?: Record<string, string>
    ) =>
        trackCustomPerformance(
            'sitter_search',
            operation,
            { flow: 'search', ...tags }
        ),
} as const;
