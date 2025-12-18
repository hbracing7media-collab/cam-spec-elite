-- Migration: create cse_cam_submissions_table
-- Intended for Supabase (Postgres)

CREATE TABLE IF NOT EXISTS public.cse_cam_submissions_table (
  id uuid PRIMARY KEY,
  user_id text,
  cam_name text NOT NULL,
  brand text NOT NULL,
  part_number text NOT NULL,
  engine_make text NOT NULL,
  engine_family text NOT NULL,
  lsa numeric,
  icl numeric,
  rocker_ratio numeric,
  duration_int_050 numeric,
  duration_exh_050 numeric,
  lift_int numeric,
  lift_exh numeric,
  advertised_int numeric,
  advertised_exh numeric,
  lash_int numeric,
  lash_exh numeric,
  notes text,
  cam_card_path text NOT NULL,
  dyno_paths jsonb,
  spec jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes commonly useful for queries
CREATE INDEX IF NOT EXISTS idx_cse_cam_submissions_user ON public.cse_cam_submissions_table (user_id);
CREATE INDEX IF NOT EXISTS idx_cse_cam_submissions_status ON public.cse_cam_submissions_table (status);
