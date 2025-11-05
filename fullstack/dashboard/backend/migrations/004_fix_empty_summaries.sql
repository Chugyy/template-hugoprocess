-- Fix empty summary fields in communication_history
-- This migration ensures all exchanges have a non-empty summary

-- Update empty summaries with a default value
UPDATE communication_history
SET summary = 'No summary provided'
WHERE summary IS NULL OR summary = '';

-- Add constraint to prevent empty summaries in the future
ALTER TABLE communication_history
ALTER COLUMN summary SET NOT NULL,
ALTER COLUMN summary SET DEFAULT 'No summary provided';

-- Add check constraint
ALTER TABLE communication_history
ADD CONSTRAINT check_summary_not_empty CHECK (length(trim(summary)) > 0);
