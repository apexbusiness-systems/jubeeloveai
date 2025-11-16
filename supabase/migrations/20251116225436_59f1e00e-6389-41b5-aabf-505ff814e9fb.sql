-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS Policies for user_roles table
-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update existing table policies to allow admin access
-- Game Progress: Admins can access all
CREATE POLICY "Admins can view all game progress"
ON public.game_progress
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all game progress"
ON public.game_progress
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all game progress"
ON public.game_progress
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert game progress"
ON public.game_progress
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Drawings: Admins can access all
CREATE POLICY "Admins can view all drawings"
ON public.drawings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all drawings"
ON public.drawings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all drawings"
ON public.drawings
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert drawings"
ON public.drawings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Children Profiles: Admins can access all
CREATE POLICY "Admins can view all children profiles"
ON public.children_profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all children profiles"
ON public.children_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all children profiles"
ON public.children_profiles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert children profiles"
ON public.children_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Stickers: Admins can access all
CREATE POLICY "Admins can view all stickers"
ON public.stickers
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all stickers"
ON public.stickers
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert stickers"
ON public.stickers
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update stickers"
ON public.stickers
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Achievements: Admins can access all
CREATE POLICY "Admins can view all achievements"
ON public.achievements
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all achievements"
ON public.achievements
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert achievements"
ON public.achievements
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update achievements"
ON public.achievements
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Profiles: Admins can access all
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));