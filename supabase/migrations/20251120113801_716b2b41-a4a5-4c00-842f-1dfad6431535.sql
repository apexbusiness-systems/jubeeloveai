-- Create usage_sessions table to track screen time
CREATE TABLE IF NOT EXISTS public.usage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  child_profile_id UUID REFERENCES public.children_profiles(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.usage_sessions ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's usage sessions
CREATE POLICY "Parents can view their children's usage sessions"
ON public.usage_sessions
FOR SELECT
USING (
  user_id = auth.uid() OR 
  child_profile_id IN (
    SELECT id FROM public.children_profiles WHERE parent_user_id = auth.uid()
  )
);

-- System can insert usage sessions
CREATE POLICY "Users can insert their own usage sessions"
ON public.usage_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own usage sessions
CREATE POLICY "Users can update their own usage sessions"
ON public.usage_sessions
FOR UPDATE
USING (user_id = auth.uid());

-- Admins can view all usage sessions
CREATE POLICY "Admins can view all usage sessions"
ON public.usage_sessions
FOR SELECT
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_usage_sessions_child_profile ON public.usage_sessions(child_profile_id);
CREATE INDEX idx_usage_sessions_date ON public.usage_sessions(session_start);

-- Add trigger to update updated_at
CREATE TRIGGER update_usage_sessions_updated_at
BEFORE UPDATE ON public.usage_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update children_profiles to add schedule settings
-- The settings JSONB column will store:
-- {
--   "schedules": [
--     { "day": 0-6 (Sun-Sat), "startTime": "09:00", "endTime": "12:00" },
--     { "day": 0-6, "startTime": "14:00", "endTime": "17:00" }
--   ],
--   "enforceSchedule": true
-- }