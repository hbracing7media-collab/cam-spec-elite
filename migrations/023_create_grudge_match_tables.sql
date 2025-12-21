-- Grudge Match Tables for two-player drag simulator competitions

-- Table for grudge match sessions
CREATE TABLE IF NOT EXISTS public.grudge_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  match_type text NOT NULL CHECK (match_type IN ('simple', 'pro')),
  
  -- Simple mode: auto-generated vehicle stats
  challenger_weight_lbs int,
  challenger_hp int,
  opponent_weight_lbs int,
  opponent_hp int,
  
  -- Pro mode: dyno submissions
  challenger_dyno_id uuid,
  opponent_dyno_id uuid,
  
  -- Match state
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed')) DEFAULT 'pending',
  winner_id uuid,
  challenger_reaction_ms int,
  opponent_reaction_ms int,
  
  -- Race times (in milliseconds)
  challenger_time_ms numeric,
  opponent_time_ms numeric,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  
  CONSTRAINT fk_challenger FOREIGN KEY (challenger_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_opponent FOREIGN KEY (opponent_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_challenger_dyno FOREIGN KEY (challenger_dyno_id) REFERENCES public.cse_cam_submissions(id) ON DELETE SET NULL,
  CONSTRAINT fk_opponent_dyno FOREIGN KEY (opponent_dyno_id) REFERENCES public.cse_cam_submissions(id) ON DELETE SET NULL
);

-- Table for match history and leaderboard stats
CREATE TABLE IF NOT EXISTS public.grudge_match_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_matches int DEFAULT 0,
  wins int DEFAULT 0,
  losses int DEFAULT 0,
  avg_reaction_ms numeric,
  best_reaction_ms int,
  win_streak int DEFAULT 0,
  elo_rating int DEFAULT 1200,
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grudge_matches_challenger ON public.grudge_matches (challenger_id);
CREATE INDEX IF NOT EXISTS idx_grudge_matches_opponent ON public.grudge_matches (opponent_id);
CREATE INDEX IF NOT EXISTS idx_grudge_matches_status ON public.grudge_matches (status);
CREATE INDEX IF NOT EXISTS idx_grudge_matches_winner ON public.grudge_matches (winner_id);
CREATE INDEX IF NOT EXISTS idx_grudge_matches_created ON public.grudge_matches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grudge_match_stats_wins ON public.grudge_match_stats (wins DESC);
CREATE INDEX IF NOT EXISTS idx_grudge_match_stats_elo ON public.grudge_match_stats (elo_rating DESC);

-- Enable RLS
ALTER TABLE public.grudge_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grudge_match_stats ENABLE ROW LEVEL SECURITY;

-- Policies for grudge_matches
DROP POLICY IF EXISTS "Allow public read access to all grudge matches" ON public.grudge_matches;
CREATE POLICY "Allow public read access to all grudge matches"
  ON public.grudge_matches
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow users to create grudge match challenges" ON public.grudge_matches;
CREATE POLICY "Allow users to create grudge match challenges"
  ON public.grudge_matches
  FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

DROP POLICY IF EXISTS "Allow users to update their grudge matches" ON public.grudge_matches;
CREATE POLICY "Allow users to update their grudge matches"
  ON public.grudge_matches
  FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id)
  WITH CHECK (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Policies for grudge_match_stats
DROP POLICY IF EXISTS "Allow public read access to grudge match stats" ON public.grudge_match_stats;
CREATE POLICY "Allow public read access to grudge match stats"
  ON public.grudge_match_stats
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow service role to update stats" ON public.grudge_match_stats;
CREATE POLICY "Allow service role to update stats"
  ON public.grudge_match_stats
  FOR UPDATE
  USING (auth.uid() = user_id);
