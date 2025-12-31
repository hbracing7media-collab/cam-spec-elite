-- Add thread_id to grudge_matches to track where challenge originated
ALTER TABLE public.grudge_matches
ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.forum_threads(id) ON DELETE SET NULL;

-- Add index for thread lookups
CREATE INDEX IF NOT EXISTS idx_grudge_matches_thread ON public.grudge_matches (thread_id);
