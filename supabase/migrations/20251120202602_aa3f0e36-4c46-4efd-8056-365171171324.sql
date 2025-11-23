-- Add indexes for usage_sessions table
CREATE INDEX IF NOT EXISTS idx_usage_sessions_user_id 
  ON public.usage_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_sessions_child_profile_id 
  ON public.usage_sessions(child_profile_id);

CREATE INDEX IF NOT EXISTS idx_usage_sessions_user_date 
  ON public.usage_sessions(user_id, session_start DESC);

CREATE INDEX IF NOT EXISTS idx_usage_sessions_child_date 
  ON public.usage_sessions(child_profile_id, session_start DESC);

-- Add indexes for conversation_logs table
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_id 
  ON public.conversation_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_child_profile_id 
  ON public.conversation_logs(child_profile_id);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_date 
  ON public.conversation_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_child_date 
  ON public.conversation_logs(child_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_sentiment 
  ON public.conversation_logs(sentiment);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_mood 
  ON public.conversation_logs(mood);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_created_at 
  ON public.conversation_logs(created_at DESC);

-- Add indexes for screen_time_requests table
CREATE INDEX IF NOT EXISTS idx_screen_time_requests_user_id 
  ON public.screen_time_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_screen_time_requests_child_profile_id 
  ON public.screen_time_requests(child_profile_id);

CREATE INDEX IF NOT EXISTS idx_screen_time_requests_status 
  ON public.screen_time_requests(status);

CREATE INDEX IF NOT EXISTS idx_screen_time_requests_child_status 
  ON public.screen_time_requests(child_profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_screen_time_requests_created_at 
  ON public.screen_time_requests(created_at DESC);