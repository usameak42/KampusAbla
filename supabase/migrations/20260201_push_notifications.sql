-- Migration: Create user_fcm_tokens table
-- Description: Stores FCM tokens for push notifications mapped to users

CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own FCM tokens" ON public.user_fcm_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_fcm_tokens_updated_at 
    BEFORE UPDATE ON public.user_fcm_tokens 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_user_fcm_tokens_user_id ON public.user_fcm_tokens(user_id);
CREATE INDEX idx_user_fcm_tokens_token ON public.user_fcm_tokens(token);
