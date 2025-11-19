-- Create stories table with category support
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'free', -- 'free' or 'premium'
  pages JSONB NOT NULL, -- Array of story pages with text, illustration, narration
  illustration_style TEXT DEFAULT 'emoji',
  age_range TEXT DEFAULT '2-5',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create story completions tracking table
CREATE TABLE IF NOT EXISTS public.story_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES public.children_profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(child_profile_id, story_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_completions ENABLE ROW LEVEL SECURITY;

-- Stories are publicly readable (all users can view free stories)
CREATE POLICY "Anyone can view stories"
  ON public.stories
  FOR SELECT
  USING (true);

-- Only admins can manage stories
CREATE POLICY "Admins can insert stories"
  ON public.stories
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update stories"
  ON public.stories
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete stories"
  ON public.stories
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Story completions policies
CREATE POLICY "Users can view their own completions"
  ON public.story_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.story_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all completions"
  ON public.story_completions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();