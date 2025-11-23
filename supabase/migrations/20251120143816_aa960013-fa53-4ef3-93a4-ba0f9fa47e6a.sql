-- Create screen time requests table
CREATE TABLE IF NOT EXISTS public.screen_time_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  child_profile_id UUID REFERENCES public.children_profiles(id) ON DELETE CASCADE NOT NULL,
  requested_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, denied
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID
);

-- Enable RLS
ALTER TABLE public.screen_time_requests ENABLE ROW LEVEL SECURITY;

-- Parents can view requests for their children
CREATE POLICY "Parents can view their children's requests"
ON public.screen_time_requests
FOR SELECT
USING (
  user_id = auth.uid() OR 
  child_profile_id IN (
    SELECT id FROM public.children_profiles WHERE parent_user_id = auth.uid()
  )
);

-- System can insert requests
CREATE POLICY "System can insert requests"
ON public.screen_time_requests
FOR INSERT
WITH CHECK (true);

-- Parents can update requests for their children
CREATE POLICY "Parents can update their children's requests"
ON public.screen_time_requests
FOR UPDATE
USING (
  child_profile_id IN (
    SELECT id FROM public.children_profiles WHERE parent_user_id = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_screen_time_requests_child_profile_id 
ON public.screen_time_requests(child_profile_id);

CREATE INDEX IF NOT EXISTS idx_screen_time_requests_status 
ON public.screen_time_requests(status);