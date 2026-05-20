-- YEO presentation editor pivot: subscription plans + AI usage tracking

-- Update plan enum: free | plus | pro
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%plan IN%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- Migrate legacy plan values to new tiers
UPDATE public.profiles
SET plan = CASE
  WHEN plan IN ('growth', 'bulk') THEN 'pro'
  WHEN plan = 'starter' THEN 'plus'
  ELSE 'free'
END
WHERE plan NOT IN ('free', 'plus', 'pro');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'plus', 'pro'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('inactive', 'active', 'cancelled', 'expired', 'past_due', 'paused')),
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Subscriptions table plan check (if exists)
DO $$
DECLARE
  c RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    FOR c IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.subscriptions'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%plan IN%'
    LOOP
      EXECUTE format('ALTER TABLE public.subscriptions DROP CONSTRAINT %I', c.conname);
    END LOOP;
    UPDATE public.subscriptions
    SET plan = CASE
      WHEN plan IN ('growth', 'bulk') THEN 'pro'
      WHEN plan = 'starter' THEN 'plus'
      ELSE 'free'
    END
    WHERE plan NOT IN ('free', 'plus', 'pro');
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_check
      CHECK (plan IN ('free', 'plus', 'pro'));
  END IF;
END $$;

-- AI usage tracking (replaces credit-based metering)
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  deck_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx
  ON public.ai_usage (user_id, created_at DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_usage_select_own ON public.ai_usage;
CREATE POLICY ai_usage_select_own ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_usage_insert_own ON public.ai_usage;
CREATE POLICY ai_usage_insert_own ON public.ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- New users: free plan, no signup credits
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
  INSERT INTO public.profiles (
    id, email, full_name, avatar_url, plan,
    ai_credits, ai_credits_ceiling,
    subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(trim(av), ''),
    'free',
    0,
    0,
    'inactive'
  );
  RETURN NEW;
END;
$$;
