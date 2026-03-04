-- Migration: Subscription Backend Integration
-- Description: Adds external provider fields for iyzico/Stripe integration

-- 1. Update subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS external_plan_id TEXT;

-- 2. Update users table for external customer reference
-- Using users table as it's the base for both parents and sitters
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS external_customer_id TEXT;

-- 3. Update subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 4. Create billing_history table if it doesn't exist
-- Based on the BillingHistoryEntry type used in frontend
CREATE TABLE IF NOT EXISTS public.billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY',
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    invoice_url TEXT,
    external_transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Add RLS for billing_history
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing history"
ON public.billing_history
FOR SELECT
USING (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_id ON public.subscriptions(external_id);
CREATE INDEX IF NOT EXISTS idx_users_external_customer_id ON public.users(external_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON public.billing_history(user_id);

-- 7. Seed sample external plan IDs for local testing (Optional)
UPDATE public.subscription_plans SET external_plan_id = 'P_PREMIUM' WHERE tier = 'premium' AND type = 'parent';
UPDATE public.subscription_plans SET external_plan_id = 'P_FAMILY' WHERE tier = 'family' AND type = 'parent';
UPDATE public.subscription_plans SET external_plan_id = 'S_PRO' WHERE tier = 'pro' AND type = 'sitter';
UPDATE public.subscription_plans SET external_plan_id = 'S_ELITE' WHERE tier = 'elite' AND type = 'sitter';
