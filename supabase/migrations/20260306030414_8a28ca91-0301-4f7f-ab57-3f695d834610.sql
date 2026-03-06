
-- Create app_role enum and user_roles table for proper admin RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles table
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Insert admin role for the admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('5e116431-4842-4633-b860-794842ca73b2', 'admin');

-- Allow admins to read sitter_verifications
CREATE POLICY "Admins can view all verifications" ON public.sitter_verifications
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update sitter_verifications
CREATE POLICY "Admins can update verifications" ON public.sitter_verifications
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all reports
CREATE POLICY "Admins can view all reports" ON public.reports
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update reports
CREATE POLICY "Admins can update reports" ON public.reports
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage user_suspensions
CREATE POLICY "Admins can manage suspensions" ON public.user_suspensions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all sessions
CREATE POLICY "Admins can view all sessions" ON public.sessions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all support tickets
CREATE POLICY "Admins can view all support tickets" ON public.support_tickets
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update support tickets
CREATE POLICY "Admins can update support tickets" ON public.support_tickets
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update sitters (for verification status changes)
CREATE POLICY "Admins can update sitters" ON public.sitters
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
