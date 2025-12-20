-- Move 3 user-submitted cams from generic_cams back to submissions_table
-- These were accidentally placed in generic_cams during the seed import
-- NOTE: user_id, cam_card_path, dyno_paths were lost during data corruption - marked as recovered
INSERT INTO public.cse_cam_submissions_table (
  id,
  cam_name, brand, part_number, engine_make, engine_family,
  duration_int_050, duration_exh_050, lift_int, lift_exh,
  status, created_at,
  user_id, cam_card_path, dyno_paths, spec
)
SELECT 
  id,
  cam_name, brand, pn, make, family,
  dur_int_050, dur_exh_050, lift_int, lift_exh,
  'pending', created_at,
  NULL, '', NULL, '{"source": "recovered_from_generic_cams", "note": "Original user_id and attachments lost during seed import data corruption"}'::jsonb
FROM public.cse_generic_cams
WHERE id IN ('6d6815af-3317-467f-96e8-64de3865a3b2', 'e345e519-55f0-43a5-939b-80181b903fbb', 'd7c7767f-a0ac-4f23-aaed-8e6d6ebe04e9');

-- Delete those 3 user cams from generic_cams since they don't belong there
DELETE FROM public.cse_generic_cams
WHERE id IN ('6d6815af-3317-467f-96e8-64de3865a3b2', 'e345e519-55f0-43a5-939b-80181b903fbb', 'd7c7767f-a0ac-4f23-aaed-8e6d6ebe04e9');

-- Delete remaining seed imports from submissions table
DELETE FROM public.cse_cam_submissions_table 
WHERE notes LIKE 'Seed import: Summit Ford SBF Windsor page 2%';

-- Verify the counts
SELECT COUNT(*) as submissions_count FROM public.cse_cam_submissions_table;
SELECT COUNT(*) as generic_cams_count FROM public.cse_generic_cams;
