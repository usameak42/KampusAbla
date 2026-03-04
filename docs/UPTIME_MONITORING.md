# Uptime Monitoring

## Objective

Provide continuous uptime checks for:

1. Frontend availability
2. Supabase Auth API availability
3. Database connectivity via health check query

## Endpoints

1. Frontend ping endpoint:
   - `GET /health`
   - Implemented as `public/health.json` and exposed by rewrite in `vercel.json`

2. Supabase API availability:
   - `GET https://<project-ref>.supabase.co/auth/v1/health`

3. Database connectivity:
   - `GET https://<project-ref>.supabase.co/functions/v1/health-check`
   - Function file: `supabase/functions/health-check/index.ts`
   - Performs a live query against `users` table

## External Monitoring Service Setup (UptimeRobot)

Create 3 monitors:

1. Monitor name: `frontend-health`
   - URL: `https://<your-domain>/health`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Expected status: 200

2. Monitor name: `supabase-auth-health`
   - URL: `https://<project-ref>.supabase.co/auth/v1/health`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Expected status: 200

3. Monitor name: `database-health-check`
   - URL: `https://<project-ref>.supabase.co/functions/v1/health-check`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Expected status: 200
   - Failure status from function: 503

## Alert Policy

Configure alerting in UptimeRobot:

1. Trigger alert when endpoint is down for more than 2 minutes
2. Alert channels:
   - Email (required)
   - SMS (required for production)
3. Escalation:
   - First alert immediately after 2-minute threshold
   - Re-alert every 10 minutes until recovery

## Status Page

Public status page is available at:

- `/status`

Source file:

- `public/status.html`

## Verification Checklist

1. Open `/health` and confirm HTTP 200 response
2. Open `/status` and confirm page renders
3. Open Supabase health-check function endpoint and confirm database status is `healthy`
4. Confirm all 3 monitors are active in UptimeRobot
5. Trigger a test alert and confirm email/SMS delivery
