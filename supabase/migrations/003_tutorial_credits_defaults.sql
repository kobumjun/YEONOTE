-- Tutorial credits for new signups (default balance + ceiling for UI)
ALTER TABLE public.profiles ALTER COLUMN ai_credits SET DEFAULT 3;
ALTER TABLE public.profiles ALTER COLUMN ai_credits_ceiling SET DEFAULT 3;

COMMENT ON COLUMN public.profiles.ai_credits IS 'Remaining AI generation credits (includes tutorial credits for new users).';
COMMENT ON COLUMN public.profiles.ai_credits_ceiling IS 'Running total of granted pack + tutorial credits for display (e.g. 5/103).';

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
    3,
    3
  );
  RETURN NEW;
END;
$$;
