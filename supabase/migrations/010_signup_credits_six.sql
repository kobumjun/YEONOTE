-- Signup tutorial credits: 6 credits (2 free generations at 3 credits each).

ALTER TABLE public.profiles
  ALTER COLUMN ai_credits SET DEFAULT 6,
  ALTER COLUMN ai_credits_ceiling SET DEFAULT 6;

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
    6,
    6
  );
  RETURN NEW;
END;
$$;
