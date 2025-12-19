-- Migration: add rpm range columns to cam submissions
ALTER TABLE public.cse_cam_submissions_table
  ADD COLUMN IF NOT EXISTS rpm_start integer,
  ADD COLUMN IF NOT EXISTS rpm_end integer;
