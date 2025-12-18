-- Update RLS policy to allow admins to see flow data for pending heads
-- This allows the approval workflow to work properly

DROP POLICY IF EXISTS "Public view flow data for approved heads" ON public.cylinder_heads_flow_data;

-- New policy: Public can see flow data for approved heads, admins can see all
CREATE POLICY "View flow data based on head status and user role" ON public.cylinder_heads_flow_data
  FOR SELECT USING (
    -- Public/Users see only approved heads' flow data
    (EXISTS (
      SELECT 1 FROM public.cylinder_heads 
      WHERE id = head_id AND status = 'approved'
    ))
    OR
    -- Admins (service role via API) can see all flow data
    -- This is bypassed at the API level using service_role key
    false  -- RLS can't check roles directly; admins use service_role which bypasses RLS
  );
