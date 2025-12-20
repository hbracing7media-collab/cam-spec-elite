-- Split bore_stroke into separate bore and stroke columns
ALTER TABLE public.user_short_blocks
DROP COLUMN IF EXISTS bore_stroke,
ADD COLUMN bore text,
ADD COLUMN stroke text;
