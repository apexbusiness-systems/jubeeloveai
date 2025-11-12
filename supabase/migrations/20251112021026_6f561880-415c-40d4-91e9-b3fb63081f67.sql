-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age INTEGER CHECK (age >= 3 AND age <= 7),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create children_profiles table for parental controls
CREATE TABLE IF NOT EXISTS public.children_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 3 AND age <= 7),
  gender TEXT CHECK (gender IN ('boy', 'girl', 'other')),
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create game_progress table
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES public.children_profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  activities_completed INTEGER DEFAULT 0,
  current_theme TEXT DEFAULT 'morning',
  last_activity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, child_profile_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES public.children_profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, child_profile_id, achievement_id)
);

-- Create drawings table
CREATE TABLE IF NOT EXISTS public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES public.children_profiles(id) ON DELETE CASCADE,
  title TEXT,
  image_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stickers table
CREATE TABLE IF NOT EXISTS public.stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES public.children_profiles(id) ON DELETE CASCADE,
  sticker_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, child_profile_id, sticker_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for children_profiles
CREATE POLICY "Parents can view their children profiles"
  ON public.children_profiles FOR SELECT
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents can create children profiles"
  ON public.children_profiles FOR INSERT
  WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parents can update their children profiles"
  ON public.children_profiles FOR UPDATE
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents can delete their children profiles"
  ON public.children_profiles FOR DELETE
  USING (auth.uid() = parent_user_id);

-- RLS Policies for game_progress
CREATE POLICY "Users can view their own progress"
  ON public.game_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.game_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Users can view their own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for drawings
CREATE POLICY "Users can view their own drawings"
  ON public.drawings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drawings"
  ON public.drawings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drawings"
  ON public.drawings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drawings"
  ON public.drawings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for stickers
CREATE POLICY "Users can view their own stickers"
  ON public.stickers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stickers"
  ON public.stickers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_profiles_updated_at
  BEFORE UPDATE ON public.children_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_progress_updated_at
  BEFORE UPDATE ON public.game_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drawings_updated_at
  BEFORE UPDATE ON public.drawings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();