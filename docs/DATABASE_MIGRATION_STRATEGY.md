# Database Migration Strategy (Lovable-First)

## Overview
Because this project utilizes **Lovable** for automatic database migrations and schema management, traditional manual Supabase CLI migration flows (`_down.sql` scripts, strict local-to-prod CLI pushes) are superseded by Lovable's automated synchronization.

Our strategy is to embrace Lovable's workflow while safeguarding custom database logic (like RPCs, RLS policies, and triggers).

## 1. Migration Process (Lovable Workflow)
- **Development:** Schema changes (tables, columns) are made and automatically synced via Lovable.
- **Staging/Testing:** Tested within the Lovable preview environment or a dedicated staging Supabase project connected to Lovable.
- **Production:** Applied to the production database by configuring Lovable to deploy to the production Supabase instance OR by exporting the schema from staging and applying it to prod.

## 2. Rollback Strategy (Roll-Forward)
- **No Down Migrations:** We do not maintain `_down.sql` files for automated schema changes.
- **Roll-Forward:** If a schema change causes an issue in staging/production, deploy a *new* correction via Lovable (e.g., re-adding a column or adjusting a data type) rather than attempting a manual downgrade.

## 3. Zero-Downtime Principles (Expand/Contract)
To prevent downtimes when changing schema via Lovable:
- **Never rename/drop columns directly.**
- Instead:
  1. Add the new column (Expand).
  2. Implement code to read/write to both columns.
  3. Backfill data.
  4. Once stable, remove the old column via Lovable (Contract).

## 4. Manual Custom SQL (RPCs, Triggers, RLS)
Lovable primarily handles tables and columns. Custom backend logic must be tracked:
- Keep all RPCs, Database Triggers, and RLS policies in the `supabase/migrations/` folder within the git repository.
- **Applying Manual Changes:** Whenever you connect a new environment (like Staging to Prod), you must manually run these custom `.sql` migration files via the Supabase Dashboard SQL Editor or Supabase CLI.

## 5. Version Tracking
- Lovable syncs will be tracked in the GitHub repository as codebase commits (if Lovable pushes to GitHub).
- The `supabase/migrations/` folder acts as our version control for manual/custom SQL scripts.
