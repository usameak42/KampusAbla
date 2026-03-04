
-- Create sitter_posts table
CREATE TABLE public.sitter_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC NOT NULL DEFAULT 2,
    hourly_rate NUMERIC NOT NULL DEFAULT 450,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sitter_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view open sitter posts
CREATE POLICY "Anyone can view open sitter posts"
ON public.sitter_posts FOR SELECT
USING (status = 'open' OR EXISTS (
    SELECT 1 FROM sitters WHERE sitters.id = sitter_posts.sitter_id AND sitters.user_id = auth.uid()
));

-- Sitters can create their own posts
CREATE POLICY "Sitters can create their own posts"
ON public.sitter_posts FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM sitters WHERE sitters.id = sitter_posts.sitter_id AND sitters.user_id = auth.uid()
));

-- Sitters can update their own posts
CREATE POLICY "Sitters can update their own posts"
ON public.sitter_posts FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM sitters WHERE sitters.id = sitter_posts.sitter_id AND sitters.user_id = auth.uid()
));

-- Sitters can delete their own posts
CREATE POLICY "Sitters can delete their own posts"
ON public.sitter_posts FOR DELETE
USING (EXISTS (
    SELECT 1 FROM sitters WHERE sitters.id = sitter_posts.sitter_id AND sitters.user_id = auth.uid()
));

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
