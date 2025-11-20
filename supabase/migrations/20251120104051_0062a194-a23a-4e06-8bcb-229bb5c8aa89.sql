-- Create conversation_logs table for analytics
CREATE TABLE IF NOT EXISTS public.conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  child_profile_id uuid REFERENCES public.children_profiles(id) ON DELETE CASCADE,
  message_preview text, -- Sanitized preview, not full message for privacy
  sentiment text NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral', 'anxious', 'excited', 'frustrated')),
  mood text NOT NULL CHECK (mood IN ('happy', 'excited', 'frustrated', 'curious', 'tired')),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  keywords jsonb DEFAULT '[]'::jsonb,
  interaction_type text DEFAULT 'chat',
  response_length integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_conversation_logs_user_id ON public.conversation_logs(user_id);
CREATE INDEX idx_conversation_logs_child_profile_id ON public.conversation_logs(child_profile_id);
CREATE INDEX idx_conversation_logs_created_at ON public.conversation_logs(created_at DESC);
CREATE INDEX idx_conversation_logs_sentiment ON public.conversation_logs(sentiment);
CREATE INDEX idx_conversation_logs_mood ON public.conversation_logs(mood);

-- Enable RLS
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view their children's conversation logs"
  ON public.conversation_logs
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    child_profile_id IN (
      SELECT id FROM public.children_profiles WHERE parent_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert conversation logs"
  ON public.conversation_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all conversation logs"
  ON public.conversation_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete conversation logs"
  ON public.conversation_logs
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create analytics aggregation function
CREATE OR REPLACE FUNCTION public.get_conversation_analytics(
  _user_id uuid,
  _start_date timestamp with time zone DEFAULT now() - interval '30 days',
  _end_date timestamp with time zone DEFAULT now()
)
RETURNS TABLE (
  date date,
  total_conversations bigint,
  avg_confidence numeric,
  sentiment_distribution jsonb,
  mood_distribution jsonb,
  most_common_keywords jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH daily_logs AS (
    SELECT 
      DATE(created_at) as log_date,
      sentiment,
      mood,
      confidence,
      keywords
    FROM public.conversation_logs
    WHERE 
      (user_id = _user_id OR 
       child_profile_id IN (
         SELECT id FROM public.children_profiles WHERE parent_user_id = _user_id
       ))
      AND created_at >= _start_date
      AND created_at <= _end_date
  ),
  aggregated AS (
    SELECT
      log_date,
      COUNT(*) as conversation_count,
      AVG(confidence) as avg_conf,
      jsonb_object_agg(
        sentiment,
        sentiment_count
      ) as sentiment_dist,
      jsonb_object_agg(
        mood,
        mood_count
      ) as mood_dist
    FROM (
      SELECT
        log_date,
        sentiment,
        mood,
        confidence,
        COUNT(*) OVER (PARTITION BY log_date, sentiment) as sentiment_count,
        COUNT(*) OVER (PARTITION BY log_date, mood) as mood_count,
        ROW_NUMBER() OVER (PARTITION BY log_date ORDER BY created_at) as rn
      FROM daily_logs
    ) sub
    WHERE rn = 1
    GROUP BY log_date
  ),
  keyword_agg AS (
    SELECT
      log_date,
      jsonb_agg(DISTINCT kw) as common_keywords
    FROM daily_logs,
    jsonb_array_elements_text(keywords) as kw
    GROUP BY log_date
  )
  SELECT
    a.log_date::date,
    a.conversation_count,
    ROUND(a.avg_conf::numeric, 2),
    a.sentiment_dist,
    a.mood_dist,
    COALESCE(k.common_keywords, '[]'::jsonb)
  FROM aggregated a
  LEFT JOIN keyword_agg k ON a.log_date = k.log_date
  ORDER BY a.log_date DESC;
END;
$$;