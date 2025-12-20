-- Migration: Make user_id nullable in cse_cam_submissions_table
-- This allows recovery of submissions where user_id was lost during data corruption

ALTER TABLE public.cse_cam_submissions_table
ALTER COLUMN user_id DROP NOT NULL;
