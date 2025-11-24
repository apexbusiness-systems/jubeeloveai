-- Fix CRITICAL: Conversation logs can be injected for any user
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own conversation logs" ON public.conversation_logs;

-- Create secure policy that validates BOTH user_id AND child_profile_id ownership
CREATE POLICY "Users can insert conversation logs for their children"
ON public.conversation_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    child_profile_id IS NULL 
    OR child_profile_id IN (
      SELECT id FROM public.children_profiles WHERE parent_user_id = auth.uid()
    )
  )
);

-- Fix CRITICAL: Screen time requests allow spam to any child
-- Drop the dangerous "System can insert requests" policy
DROP POLICY IF EXISTS "System can insert requests" ON public.screen_time_requests;

-- Create secure policy requiring ownership validation
CREATE POLICY "Users can create requests for their own children"
ON public.screen_time_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND child_profile_id IN (
    SELECT id FROM public.children_profiles WHERE parent_user_id = auth.uid()
  )
);

-- Fix WARNING: Add DELETE policies for data privacy compliance
CREATE POLICY "Users can delete their own conversation logs"
ON public.conversation_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own usage sessions"
ON public.usage_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Parents can delete their children's screen time requests"
ON public.screen_time_requests
FOR DELETE
TO authenticated
USING (
  child_profile_id IN (
    SELECT id FROM public.children_profiles WHERE parent_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their story completions"
ON public.story_completions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their story completions"
ON public.story_completions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);