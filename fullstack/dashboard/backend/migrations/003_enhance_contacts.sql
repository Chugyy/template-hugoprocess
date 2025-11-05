-- Migration: Add social media fields to contacts and optimize polymorphic relations
-- Generated: 2025-11-04

-- Add social media columns to contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255),
  ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
  ADD COLUMN IF NOT EXISTS twitter VARCHAR(100),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Migrate existing custom_fields data if any
UPDATE public.contacts
SET
  linkedin = custom_fields->>'linkedin',
  instagram = custom_fields->>'instagram',
  twitter = custom_fields->>'twitter',
  website = custom_fields->>'website'
WHERE custom_fields IS NOT NULL
  AND (
    custom_fields ? 'linkedin' OR
    custom_fields ? 'instagram' OR
    custom_fields ? 'twitter' OR
    custom_fields ? 'website'
  );

-- Optimize polymorphic relations with partial indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_contact ON public.notes(entity_id) WHERE entity_type = 'contact';
CREATE INDEX IF NOT EXISTS idx_notes_project ON public.notes(entity_id) WHERE entity_type = 'project';
CREATE INDEX IF NOT EXISTS idx_notes_task ON public.notes(entity_id) WHERE entity_type = 'task';
CREATE INDEX IF NOT EXISTS idx_notes_exchange ON public.notes(entity_id) WHERE entity_type = 'exchange';

-- Optimize polymorphic relations with partial indexes for resources
CREATE INDEX IF NOT EXISTS idx_resources_contact ON public.resources(entity_id) WHERE entity_type = 'contact';
CREATE INDEX IF NOT EXISTS idx_resources_project ON public.resources(entity_id) WHERE entity_type = 'project';
CREATE INDEX IF NOT EXISTS idx_resources_task ON public.resources(entity_id) WHERE entity_type = 'task';
