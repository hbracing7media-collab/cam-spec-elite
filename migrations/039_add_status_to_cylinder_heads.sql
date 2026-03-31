-- Migration: Add status column to cylinder_heads table
-- The cylinder_heads table was created without a status column but
-- the admin review endpoints expect it for the approval workflow

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cylinder_heads' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.cylinder_heads 
        ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Update any existing records without a status to 'approved' 
-- (since they were in the approved heads table, they should already be approved)
UPDATE public.cylinder_heads 
SET status = 'approved' 
WHERE status IS NULL;

-- Add created_by column if missing (for tracking who submitted)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cylinder_heads' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.cylinder_heads 
        ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Ensure index exists for status queries
CREATE INDEX IF NOT EXISTS idx_cylinder_heads_status ON public.cylinder_heads (status);
