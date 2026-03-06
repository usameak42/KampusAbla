import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflight, createCorsResponse } from '../_shared/cors.ts';

interface NotificationRequest {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
  notification_type:
    | 'booking_requests'
    | 'booking_confirmations'
    | 'booking_cancellations'
    | 'messages'
    | 'session_updates'
    | 'reviews'
    | 'marketing';
}

interface UserTokenRow {
  token: string;
  user_id: string;
}

interface NotificationPreferenceRow {
  user_id: string;
  booking_requests?: boolean | null;
  booking_confirmations?: boolean | null;
  booking_cancellations?: boolean | null;
  messages?: boolean | null;
  session_updates?: boolean | null;
  reviews?: boolean | null;
  marketing?: boolean | null;
}

interface ServiceAccount {
  project_id: string;
  private_key: string;
  client_email: string;
}

interface DeliveryResult {
  token: string;
  userId: string;
  success: boolean;
  errorMessage?: string;
}

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function generateFirebaseJwt(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (char) => char.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput));
  const signatureEncoded = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${signingInput}.${signatureEncoded}`;
}

async function getFirebaseAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const assertion = await generateFirebaseJwt(serviceAccount);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to get Firebase access token: ${errorBody}`);
  }

  const tokenResponse = (await response.json()) as { access_token?: string };
  if (!tokenResponse.access_token) {
    throw new Error('Firebase access token missing in OAuth response');
  }

  return tokenResponse.access_token;
}

function normalizeData(data?: Record<string, string | number | boolean>): Record<string, string> {
  if (!data) return {};

  return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
}

function isInvalidTokenError(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes('registration token is not a valid') ||
    normalized.includes('registration token is not registered') ||
    normalized.includes('requested entity was not found') ||
    normalized.includes('invalid argument')
  );
}

serve(async (req: Request) => {
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('origin') ?? undefined;

  try {
    const payload = (await req.json()) as NotificationRequest;
    const { user_ids, title, body, data, notification_type } = payload;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return createCorsResponse({ error: 'user_ids is required and must not be empty' }, 400, {}, origin);
    }

    if (!title?.trim() || !body?.trim()) {
      return createCorsResponse({ error: 'title and body are required' }, 400, {}, origin);
    }

    if (!notification_type) {
      return createCorsResponse({ error: 'notification_type is required' }, 400, {}, origin);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: tokensData, error: tokensError } = await supabaseAdmin
      .from('user_fcm_tokens')
      .select('token, user_id')
      .in('user_id', user_ids);

    if (tokensError) {
      throw tokensError;
    }

    const tokens = (tokensData ?? []) as UserTokenRow[];

    if (tokens.length === 0) {
      return createCorsResponse(
        {
          message: 'No FCM tokens found',
          success: 0,
          failures: 0,
        },
        200,
        {},
        origin
      );
    }

    const { data: preferencesData, error: preferencesError } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .in('user_id', user_ids);

    if (preferencesError) {
      console.error('Error fetching notification preferences:', preferencesError);
    }

    const preferences = (preferencesData ?? []) as NotificationPreferenceRow[];

    const allowedTokens = tokens.filter((tokenRow) => {
      const userPreference = preferences.find((pref) => pref.user_id === tokenRow.user_id);
      if (!userPreference) return true;

      const preferenceValue = userPreference[notification_type];
      return preferenceValue !== false;
    });

    if (allowedTokens.length === 0) {
      return createCorsResponse(
        {
          message: 'All users have disabled this notification type',
          success: 0,
          failures: 0,
        },
        200,
        {},
        origin
      );
    }

    const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountRaw) {
      return createCorsResponse(
        {
          message: 'Firebase service account is not configured',
          success: 0,
          failures: 0,
        },
        200,
        {},
        origin
      );
    }

    const serviceAccount = JSON.parse(serviceAccountRaw) as ServiceAccount;
    const accessToken = await getFirebaseAccessToken(serviceAccount);
    const normalizedData = normalizeData(data);

    const results = await Promise.all(
      allowedTokens.map(async (tokenRow): Promise<DeliveryResult> => {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                token: tokenRow.token,
                notification: {
                  title,
                  body,
                },
                data: normalizedData,
                android: {
                  priority: 'high',
                },
                apns: {
                  headers: {
                    'apns-priority': '10',
                  },
                },
              },
            }),
          }
        );

        if (response.ok) {
          return {
            token: tokenRow.token,
            userId: tokenRow.user_id,
            success: true,
          };
        }

        let errorMessage = 'Unknown FCM error';
        try {
          const errorJson = (await response.json()) as { error?: { message?: string } };
          errorMessage = errorJson.error?.message ?? `${response.status} ${response.statusText}`;
        } catch {
          errorMessage = `${response.status} ${response.statusText}`;
        }

        return {
          token: tokenRow.token,
          userId: tokenRow.user_id,
          success: false,
          errorMessage,
        };
      })
    );

    const successfulTokens = results.filter((result) => result.success).map((result) => result.token);
    const failures = results.filter((result) => !result.success);

    const invalidTokens = failures
      .filter((failure) => isInvalidTokenError(failure.errorMessage ?? ''))
      .map((failure) => failure.token);

    if (invalidTokens.length > 0) {
      await supabaseAdmin.from('user_fcm_tokens').delete().in('token', invalidTokens);
    }

    if (successfulTokens.length > 0) {
      await supabaseAdmin
        .from('user_fcm_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .in('token', successfulTokens);
    }

    return createCorsResponse(
      {
        success: successfulTokens.length,
        failures: failures.length,
        details: failures.map((failure) => ({ token: failure.token, error: failure.errorMessage })),
      },
      200,
      {},
      origin
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    return createCorsResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500,
      {},
      origin
    );
  }
});
