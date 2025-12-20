-- Migration: Make lsa nullable in cse_generic_cams
-- Most camshaft specs don't include Lobe Separation Angle data from Summit Racing
-- Allow NULL values for this optional field

ALTER TABLE public.cse_generic_cams
ALTER COLUMN lsa DROP NOT NULL;
