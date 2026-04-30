-- YEO initial schema + RLS

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  language TEXT DEFAULT 'ko',
  theme TEXT DEFAULT 'system',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  ai_generations_used INTEGER DEFAULT 0,
  ai_generations_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  icon TEXT DEFAULT '📄',
  cover TEXT,
  content JSONB NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  is_favorited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  likes_count INTEGER DEFAULT 0,
  duplicates_count INTEGER DEFAULT 0,
  original_template_id UUID REFERENCES public.templates(id),
  ai_prompt TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.template_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lemon_squeezy_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'team')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'paused', 'past_due', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.template_likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

CREATE TABLE public.ai_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4o',
  tokens_used INTEGER,
  template_id UUID REFERENCES public.templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX templates_user_id_idx ON public.templates(user_id);
CREATE INDEX templates_is_public_idx ON public.templates(is_public) WHERE is_public = true AND is_deleted = false;
CREATE INDEX templates_is_deleted_idx ON public.templates(user_id, is_deleted);
CREATE INDEX template_versions_template_id_idx ON public.template_versions(template_id);
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Templates: own rows
CREATE POLICY "templates_select_own" ON public.templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "templates_insert_own" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "templates_update_own" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "templates_delete_own" ON public.templates FOR DELETE USING (auth.uid() = user_id);
-- Public read
CREATE POLICY "templates_select_public" ON public.templates FOR SELECT USING (is_public = true AND is_deleted = false);

-- Template versions: owner of template
CREATE POLICY "template_versions_select" ON public.template_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.user_id = auth.uid()));
CREATE POLICY "template_versions_insert" ON public.template_versions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.user_id = auth.uid()));

-- Subscriptions: own
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_all_own" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "likes_select" ON public.template_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert_own" ON public.template_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.template_likes FOR DELETE USING (auth.uid() = user_id);

-- AI logs: own
CREATE POLICY "ai_logs_select_own" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_insert_own" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- New user -> profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
