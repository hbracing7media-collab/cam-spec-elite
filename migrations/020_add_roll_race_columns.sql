-- Migration: Add roll race columns to grudge_matches table
-- This adds support for 60-130 roll race challenges

-- First, update the match_type check constraint to allow 'roll-60-130'
ALTER TABLE grudge_matches DROP CONSTRAINT IF EXISTS grudge_matches_match_type_check;
ALTER TABLE grudge_matches ADD CONSTRAINT grudge_matches_match_type_check 
  CHECK (match_type IN ('simple', 'pro', 'roll-60-130'));

-- Roll race specific columns for challenger
ALTER TABLE grudge_matches ADD COLUMN IF NOT EXISTS challenger_roll_sixty_to_hundred NUMERIC(6,3);
ALTER TABLE grudge_matches ADD COLUMN IF NOT EXISTS challenger_roll_hundred_to_one_twenty NUMERIC(6,3);
ALTER TABLE grudge_matches ADD COLUMN IF NOT EXISTS challenger_roll_one_twenty_to_one_thirty NUMERIC(6,3);
ALTER TABLE grudge_matches ADD COLUMN IF NOT EXISTS challenger_roll_total NUMERIC(6,3);

-- Roll race specific columns for opponent
ALTER TABLE grudge_matches ADD COLUMN IF NOT EXISTS opponent_roll_sixty_to_hundred NUMERIC(6,3);
ALTER TABLE grudge_matches ADD COLUMN IF NOT EXISTS opponent_roll_hundred_to_one_twenty NUMERIC(6,3);
ALTER TABLE grudge_matches ADD COLUMN IF NOT EXISTS opponent_roll_one_twenty_to_one_thirty NUMERIC(6,3);
ALTER TABLE grudge_matches ADD COLUMN IF NOT EXISTS opponent_roll_total NUMERIC(6,3);

-- Add comment to clarify usage
COMMENT ON COLUMN grudge_matches.challenger_roll_total IS '60-130 total time in seconds for roll race';
COMMENT ON COLUMN grudge_matches.opponent_roll_total IS '60-130 total time in seconds for roll race';
