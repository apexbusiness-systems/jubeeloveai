
-- Add explicit deny-anonymous policies for sensitive tables to harden defense-in-depth.
-- Existing PERMISSIVE owner-scoped policies already restrict access; these add an
-- explicit denial layer for the anon role to make the security model self-evident.

-- drawings
CREATE POLICY "Deny anonymous access to drawings"
  ON public.drawings FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous insert to drawings"
  ON public.drawings FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anonymous update to drawings"
  ON public.drawings FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anonymous delete to drawings"
  ON public.drawings FOR DELETE TO anon USING (false);

-- usage_sessions
CREATE POLICY "Deny anonymous access to usage sessions"
  ON public.usage_sessions FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous insert to usage sessions"
  ON public.usage_sessions FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anonymous update to usage sessions"
  ON public.usage_sessions FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anonymous delete to usage sessions"
  ON public.usage_sessions FOR DELETE TO anon USING (false);

-- achievements
CREATE POLICY "Deny anonymous access to achievements"
  ON public.achievements FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous insert to achievements"
  ON public.achievements FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anonymous update to achievements"
  ON public.achievements FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anonymous delete to achievements"
  ON public.achievements FOR DELETE TO anon USING (false);

-- stickers
CREATE POLICY "Deny anonymous access to stickers"
  ON public.stickers FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous insert to stickers"
  ON public.stickers FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anonymous update to stickers"
  ON public.stickers FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anonymous delete to stickers"
  ON public.stickers FOR DELETE TO anon USING (false);

-- game_progress
CREATE POLICY "Deny anonymous access to game progress"
  ON public.game_progress FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous insert to game progress"
  ON public.game_progress FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anonymous update to game progress"
  ON public.game_progress FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anonymous delete to game progress"
  ON public.game_progress FOR DELETE TO anon USING (false);

-- conversation_logs
CREATE POLICY "Deny anonymous access to conversation logs"
  ON public.conversation_logs FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous insert to conversation logs"
  ON public.conversation_logs FOR INSERT TO anon WITH CHECK (false);

-- story_completions
CREATE POLICY "Deny anonymous access to story completions"
  ON public.story_completions FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous insert to story completions"
  ON public.story_completions FOR INSERT TO anon WITH CHECK (false);

-- screen_time_requests
CREATE POLICY "Deny anonymous access to screen time requests"
  ON public.screen_time_requests FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous insert to screen time requests"
  ON public.screen_time_requests FOR INSERT TO anon WITH CHECK (false);
