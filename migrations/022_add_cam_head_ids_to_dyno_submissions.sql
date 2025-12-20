-- Add selected cam and head ID columns to dyno_submissions table
ALTER TABLE dyno_submissions
ADD COLUMN selected_cam_id TEXT,
ADD COLUMN selected_head_id TEXT;

-- Add indexes for filtering by cam/head
CREATE INDEX IF NOT EXISTS idx_dyno_submissions_selected_cam_id ON dyno_submissions(selected_cam_id);
CREATE INDEX IF NOT EXISTS idx_dyno_submissions_selected_head_id ON dyno_submissions(selected_head_id);
