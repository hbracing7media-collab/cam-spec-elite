-- Update user_short_blocks table schema
-- Remove compression_ratio and material, add deck_height and piston_dome_dish

ALTER TABLE public.user_short_blocks
DROP COLUMN IF EXISTS compression_ratio,
DROP COLUMN IF EXISTS material,
ADD COLUMN deck_height text,
ADD COLUMN piston_dome_dish text;
