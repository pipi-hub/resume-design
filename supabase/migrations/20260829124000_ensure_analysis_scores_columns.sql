-- Migration to ensure consistent score columns on resume_analyses and analyses tables
ALTER TABLE IF EXISTS public.resume_analyses 
  ADD COLUMN IF NOT EXISTS match_score INTEGER,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER;

ALTER TABLE IF EXISTS public.analyses 
  ADD COLUMN IF NOT EXISTS match_score INTEGER,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER;
