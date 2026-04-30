-- Ensure templates are private by default
ALTER TABLE public.templates
  ALTER COLUMN is_public SET DEFAULT false;

UPDATE public.templates
SET is_public = false
WHERE is_public IS NULL;
