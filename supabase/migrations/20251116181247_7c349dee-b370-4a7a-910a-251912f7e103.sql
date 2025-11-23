-- SECURITY FIX: Set immutable search_path on database function
-- This prevents privilege escalation attacks via search_path manipulation
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- GDPR COMPLIANCE: Add missing DELETE policies
-- Users must be able to delete their own data per privacy regulations

-- Profiles table DELETE policy
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Game progress DELETE policy
CREATE POLICY "Users can delete their own progress"
ON public.game_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Achievements DELETE policy (allow users to reset achievements)
CREATE POLICY "Users can delete their own achievements"
ON public.achievements
FOR DELETE
USING (auth.uid() = user_id);

-- Stickers DELETE policy
CREATE POLICY "Users can delete their own stickers"
ON public.stickers
FOR DELETE
USING (auth.uid() = user_id);

-- Drawings DELETE policy (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'drawings' 
    AND policyname = 'Users can delete their own drawings'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own drawings" ON public.drawings FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;