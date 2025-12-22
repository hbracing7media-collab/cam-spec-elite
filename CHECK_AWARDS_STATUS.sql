-- Check if award_types table has the required entries

SELECT 
  id,
  slug,
  name,
  icon_emoji,
  grant_mode,
  award_type,
  created_at
FROM public.award_types
ORDER BY created_at;

-- Expected result: Should see at least these 2 rows:
-- - camshaft_contributor (🏎️)
-- - cylinder_head_contributor (🔧)

-- If empty or missing these rows, run this INSERT:
/*
INSERT INTO public.award_types (slug, name, description, icon_emoji, icon_path, badge_color, rarity, grant_mode, award_type)
VALUES 
  ('camshaft_contributor', 'Cam Contributor', 'Earned for submitting a camshaft specification', '🏎️', '/tokens/cam_contributor.png', '#FF6B6B', 'common', 'automatic', 'submission'),
  ('cylinder_head_contributor', 'Head Contributor', 'Earned for submitting a cylinder head specification', '🔧', '/tokens/head_contributor.png', '#4ECDC4', 'common', 'automatic', 'submission')
ON CONFLICT (slug) DO NOTHING;
*/

-- Also check if any user_awards exist for these types
SELECT 
  ua.id,
  ua.user_id,
  at.slug,
  at.icon_emoji,
  ua.earned_at,
  ua.submission_type
FROM public.user_awards ua
JOIN public.award_types at ON ua.award_type_id = at.id
WHERE at.slug IN ('camshaft_contributor', 'cylinder_head_contributor')
ORDER BY ua.earned_at DESC
LIMIT 20;

-- Summary: Count of awards by type
SELECT 
  at.slug,
  at.icon_emoji,
  COUNT(ua.id) as award_count
FROM public.award_types at
LEFT JOIN public.user_awards ua ON at.id = ua.award_type_id
WHERE at.slug IN ('camshaft_contributor', 'cylinder_head_contributor', 'dyno_king')
GROUP BY at.id, at.slug, at.icon_emoji
ORDER BY award_count DESC;
