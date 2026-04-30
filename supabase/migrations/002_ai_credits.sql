-- One-time credit model
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_credits_ceiling INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.ai_credits IS 'Remaining AI generation credits.';
COMMENT ON COLUMN public.profiles.ai_credits_ceiling IS 'Sum of granted pack sizes for UI (e.g. 3/50).';

CREATE TABLE IF NOT EXISTS public.processed_lemon_orders (
  lemon_order_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.processed_lemon_orders IS 'Idempotent Lemon order_created handling (one-time credit packs).';
