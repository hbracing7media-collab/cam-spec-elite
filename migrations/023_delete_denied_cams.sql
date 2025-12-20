-- Delete all cams with status 'denied'
DELETE FROM cse_cam_submissions_table WHERE status = 'denied';

-- Optional: Create a trigger to automatically delete cams when status changes to 'denied'
CREATE OR REPLACE FUNCTION delete_denied_cam()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'denied' THEN
    DELETE FROM cse_cam_submissions_table WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_delete_denied_cam ON cse_cam_submissions_table;

-- Create trigger to delete denied cams
CREATE TRIGGER trigger_delete_denied_cam
BEFORE UPDATE ON cse_cam_submissions_table
FOR EACH ROW
EXECUTE FUNCTION delete_denied_cam();
