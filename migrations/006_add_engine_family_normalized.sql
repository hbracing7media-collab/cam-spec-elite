-- Add normalized engine family column to cylinder_heads
ALTER TABLE cylinder_heads 
ADD COLUMN engine_family_normalized TEXT;

-- Create function to normalize engine family names
CREATE OR REPLACE FUNCTION normalize_engine_family(family TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Normalize by extracting the main family name (before the parentheses)
  RETURN TRIM(SPLIT_PART(family, '(', 1));
END;
$$ LANGUAGE plpgsql;

-- Update existing records with normalized values
UPDATE cylinder_heads 
SET engine_family_normalized = normalize_engine_family(engine_family);

-- Create index for faster queries
CREATE INDEX idx_cylinder_heads_family_normalized ON cylinder_heads(engine_family_normalized);

-- Make it NOT NULL for future records
ALTER TABLE cylinder_heads 
ALTER COLUMN engine_family_normalized SET NOT NULL;

-- Create trigger to auto-populate on insert/update
CREATE OR REPLACE FUNCTION set_engine_family_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.engine_family_normalized := normalize_engine_family(NEW.engine_family);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_engine_family_normalized
BEFORE INSERT OR UPDATE ON cylinder_heads
FOR EACH ROW
EXECUTE FUNCTION set_engine_family_normalized();
