-- Add head gasket fields to user_short_blocks table
ALTER TABLE public.user_short_blocks
ADD COLUMN head_gasket_bore text,
ADD COLUMN head_gasket_compressed_thickness text;
