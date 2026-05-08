ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS creation_type TEXT NOT NULL DEFAULT 'template'
CHECK (creation_type IN ('document', 'presentation', 'image', 'template'));

CREATE INDEX IF NOT EXISTS templates_creation_type_idx
ON public.templates(creation_type, updated_at DESC);

ALTER TABLE public.ai_logs
ADD COLUMN IF NOT EXISTS classified_type TEXT,
ADD COLUMN IF NOT EXISTS charged_credits INTEGER,
ADD COLUMN IF NOT EXISTS generation_type TEXT;
