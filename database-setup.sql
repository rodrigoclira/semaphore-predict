-- Semaphore State Tracker Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create the semaphores table
CREATE TABLE IF NOT EXISTS semaphores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  current_state TEXT NOT NULL CHECK (current_state IN ('open', 'closed')),
  timestamp TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  session_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If upgrading existing installation, add session_id column
-- (Safe to run - will only add if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'semaphores' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE semaphores ADD COLUMN session_id TEXT DEFAULT 'default';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_semaphores_name ON semaphores(name);
CREATE INDEX IF NOT EXISTS idx_semaphores_timestamp ON semaphores(timestamp);
CREATE INDEX IF NOT EXISTS idx_semaphores_name_timestamp ON semaphores(name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_semaphores_session_id ON semaphores(session_id);
CREATE INDEX IF NOT EXISTS idx_semaphores_name_session ON semaphores(name, session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE semaphores ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for anonymous users
-- Since this is a personal project, we allow full access
-- You can modify this later if you want to add authentication
CREATE POLICY "Allow all operations for anonymous users"
ON semaphores
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Optional: Create a policy for authenticated users (if you add auth later)
CREATE POLICY "Allow all operations for authenticated users"
ON semaphores
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a view for getting the latest state of each semaphore
CREATE OR REPLACE VIEW latest_semaphore_states AS
SELECT DISTINCT ON (name)
  name,
  current_state,
  timestamp,
  latitude,
  longitude
FROM semaphores
ORDER BY name, timestamp DESC;

-- Grant access to the view
GRANT SELECT ON latest_semaphore_states TO anon;
GRANT SELECT ON latest_semaphore_states TO authenticated;

-- Optional: Create a function to get semaphore statistics
CREATE OR REPLACE FUNCTION get_semaphore_stats(semaphore_name TEXT)
RETURNS TABLE (
  total_records BIGINT,
  first_record TIMESTAMPTZ,
  last_record TIMESTAMPTZ,
  total_open_records BIGINT,
  total_closed_records BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_records,
    MIN(timestamp) as first_record,
    MAX(timestamp) as last_record,
    COUNT(*) FILTER (WHERE current_state = 'open')::BIGINT as total_open_records,
    COUNT(*) FILTER (WHERE current_state = 'closed')::BIGINT as total_closed_records
  FROM semaphores
  WHERE name = semaphore_name;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_semaphore_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_semaphore_stats(TEXT) TO authenticated;
