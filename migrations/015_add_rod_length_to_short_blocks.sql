-- Add rod_length field to user_short_blocks table
ALTER TABLE public.user_short_blocks
ADD COLUMN rod_length text;
