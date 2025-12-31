-- Add time slip columns for grudge matches
-- Each player's full drag strip time slip data

-- Challenger time slip data
ALTER TABLE public.grudge_matches
ADD COLUMN IF NOT EXISTS challenger_sixty_ft numeric,
ADD COLUMN IF NOT EXISTS challenger_eighth_et numeric,
ADD COLUMN IF NOT EXISTS challenger_eighth_mph numeric,
ADD COLUMN IF NOT EXISTS challenger_quarter_et numeric,
ADD COLUMN IF NOT EXISTS challenger_quarter_mph numeric;

-- Opponent time slip data  
ALTER TABLE public.grudge_matches
ADD COLUMN IF NOT EXISTS opponent_sixty_ft numeric,
ADD COLUMN IF NOT EXISTS opponent_eighth_et numeric,
ADD COLUMN IF NOT EXISTS opponent_eighth_mph numeric,
ADD COLUMN IF NOT EXISTS opponent_quarter_et numeric,
ADD COLUMN IF NOT EXISTS opponent_quarter_mph numeric;

-- Update status check to include 'waiting_opponent' state
ALTER TABLE public.grudge_matches
DROP CONSTRAINT IF EXISTS grudge_matches_status_check;

ALTER TABLE public.grudge_matches
ADD CONSTRAINT grudge_matches_status_check 
CHECK (status IN ('pending', 'accepted', 'in_progress', 'waiting_opponent', 'completed'));
