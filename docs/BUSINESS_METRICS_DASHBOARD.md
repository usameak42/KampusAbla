# Business Metrics Dashboard

## Implemented Metrics

The admin dashboard at `/admin/monitoring` now tracks:

1. Time-to-match: `bookings.created_at` -> `bookings.confirmed_at`
2. Completion rate: `completed / accepted` bookings
3. Repeat booking rate: parent-sitter repeat booking within 30 days
4. Safety incident rate: reports per 1,000 sessions
5. Student earnings/week: sitter payout totals grouped by week

## Database Views

Defined in:

- `supabase/migrations/20260220_business_metrics_dashboard.sql`

Views:

1. `analytics_time_to_match`
2. `analytics_completion_rate`
3. `analytics_repeat_booking_rate`
4. `analytics_student_earnings_weekly`
5. `analytics_safety_stats` (existing)
6. `analytics_financial_weekly` (existing)

## CSV Export

The dashboard export button now downloads:

1. `time_to_match.csv`
2. `completion_rate.csv`
3. `financial_report.csv`
4. `safety_incidents.csv`
5. `repeat_booking_rate.csv`
6. `student_earnings_weekly.csv`

## Weekly Stakeholder Email Reports

### Function

- Edge function: `supabase/functions/weekly-analytics-report/index.ts`

### Scheduler

- GitHub Actions workflow:
  - `.github/workflows/weekly-analytics-report.yml`
  - Schedule: Monday 06:00 UTC
  - Manual trigger: `workflow_dispatch`

### Required Secrets

Set in GitHub repository secrets:

1. `SUPABASE_FUNCTIONS_BASE_URL` (example: `https://<project-ref>.supabase.co/functions/v1`)
2. `REPORT_WEBHOOK_SECRET`

Set in Supabase Edge Function environment variables:

1. `REPORT_WEBHOOK_SECRET`
2. `RESEND_API_KEY`
3. `STAKEHOLDER_REPORT_EMAILS` (comma-separated emails)

