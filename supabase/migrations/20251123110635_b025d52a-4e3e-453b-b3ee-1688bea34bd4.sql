-- Fix CRITICAL security issue: conversation_logs INSERT policy allows unauthorized inserts
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert conversation logs" ON public.conversation_logs;

-- Create secure policy requiring authenticated user and matching user_id
CREATE POLICY "Users can insert their own conversation logs"
ON public.conversation_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Document intentional public access to stories table
-- This is by design: all stories are free and ungated per user requirement
COMMENT ON TABLE public.stories IS 'Stories are intentionally publicly readable (no authentication required). All content is free and ungated for toddlers to access without friction. Only admins can modify stories.';

COMMENT ON POLICY "Anyone can view stories" ON public.stories IS 'Intentional public access - stories are free content for all users without authentication barriers.';