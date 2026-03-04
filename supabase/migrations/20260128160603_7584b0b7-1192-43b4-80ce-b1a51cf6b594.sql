-- Create parents table
CREATE TABLE public.parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sitters table
CREATE TABLE public.sitters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  university TEXT,
  department TEXT,
  student_year INTEGER,
  bio TEXT,
  hourly_rate NUMERIC(10,2) DEFAULT 150,
  profile_photo_url TEXT,
  city TEXT,
  district TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'approved', 'rejected')),
  badge_level TEXT DEFAULT 'bronze' CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum')),
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sitter_verifications table
CREATE TABLE public.sitter_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
  student_id_url TEXT,
  government_id_url TEXT,
  selfie_url TEXT,
  background_check_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kvkk_consents table (Turkish GDPR equivalent)
CREATE TABLE public.kvkk_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create children table
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT,
  special_needs TEXT,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitter_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kvkk_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Parents policies
CREATE POLICY "Users can view their own parent profile" ON public.parents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own parent profile" ON public.parents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own parent profile" ON public.parents FOR UPDATE USING (auth.uid() = user_id);

-- Sitters policies  
CREATE POLICY "Anyone can view approved sitters" ON public.sitters FOR SELECT USING (verification_status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Users can insert their own sitter profile" ON public.sitters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sitter profile" ON public.sitters FOR UPDATE USING (auth.uid() = user_id);

-- Sitter verifications policies
CREATE POLICY "Sitters can view their own verification" ON public.sitter_verifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sitters WHERE sitters.id = sitter_verifications.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Sitters can insert their own verification" ON public.sitter_verifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.sitters WHERE sitters.id = sitter_verifications.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Sitters can update their own verification" ON public.sitter_verifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.sitters WHERE sitters.id = sitter_verifications.sitter_id AND sitters.user_id = auth.uid())
);

-- KVKK consents policies
CREATE POLICY "Users can view their own consents" ON public.kvkk_consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consents" ON public.kvkk_consents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Children policies
CREATE POLICY "Parents can view their own children" ON public.children FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.parents WHERE parents.id = children.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Parents can insert their own children" ON public.children FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.parents WHERE parents.id = children.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Parents can update their own children" ON public.children FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.parents WHERE parents.id = children.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Parents can delete their own children" ON public.children FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.parents WHERE parents.id = children.parent_id AND parents.user_id = auth.uid())
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON public.parents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sitters_updated_at BEFORE UPDATE ON public.sitters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sitter_verifications_updated_at BEFORE UPDATE ON public.sitter_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();