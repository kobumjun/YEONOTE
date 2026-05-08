-- Idempotent fix: remote projects may still have handle_new_user() or column defaults at 3
-- if an older migration order was applied or the function was edited in the Dashboard.

ALTER TABLE public.profiles
  ALTER COLUMN ai_credits SET DEFAULT 5,
  ALTER COLUMN ai_credits_ceiling SET DEFAULT 5;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  av text;
BEGIN
  av := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture');
  INSERT INTO public.profiles (id, email, full_name, avatar_url, ai_credits, ai_credits_ceiling)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(trim(av), ''),
    5,
    5
  );
  RETURN NEW;
END;
$$;
