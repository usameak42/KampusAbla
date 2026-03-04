import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflight, createCorsResponse } from '../_shared/cors.ts';

interface CspReportBody {
  'csp-report'?: Record<string, unknown>;
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('origin') ?? undefined;

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, 405, {}, origin);
  }

  try {
    const body = (await req.json()) as CspReportBody | Record<string, unknown>;
    const report = (body as CspReportBody)['csp-report'] ?? body;

    console.warn('CSP violation report:', {
      report,
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    // Respond with 204 to acknowledge report receipt.
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin ?? '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  } catch (error) {
    return createCorsResponse(
      { error: error instanceof Error ? error.message : 'Invalid report payload' },
      400,
      {},
      origin,
    );
  }
});