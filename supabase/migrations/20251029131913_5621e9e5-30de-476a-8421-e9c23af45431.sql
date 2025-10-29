-- Change analysis_notes from TEXT to JSONB to store structured analysis data
ALTER TABLE public.clients 
ALTER COLUMN analysis_notes TYPE jsonb USING 
  CASE 
    WHEN analysis_notes IS NULL OR analysis_notes = '' THEN '[]'::jsonb
    ELSE '[]'::jsonb
  END;

-- Set default value to empty array
ALTER TABLE public.clients 
ALTER COLUMN analysis_notes SET DEFAULT '[]'::jsonb;