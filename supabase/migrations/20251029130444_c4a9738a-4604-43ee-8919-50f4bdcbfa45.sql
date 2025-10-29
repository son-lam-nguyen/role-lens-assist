-- Add analysis_notes column to clients table for storing audio analysis results
ALTER TABLE public.clients ADD COLUMN analysis_notes TEXT;