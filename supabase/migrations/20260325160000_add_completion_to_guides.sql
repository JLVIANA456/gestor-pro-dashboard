
-- Migration: Add completion fields to accounting_guides
-- Date: 2026-03-25

ALTER TABLE accounting_guides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE accounting_guides ADD COLUMN IF NOT EXISTS completed_by TEXT;
ALTER TABLE accounting_guides ADD COLUMN IF NOT EXISTS justification TEXT;

-- Update check constraint for status
ALTER TABLE accounting_guides DROP CONSTRAINT IF EXISTS accounting_guides_status_check;
ALTER TABLE accounting_guides ADD CONSTRAINT accounting_guides_status_check CHECK (status IN ('pending', 'sent', 'scheduled', 'expired', 'completed'));

-- Add comments for the new columns
COMMENT ON COLUMN accounting_guides.completed_at IS 'Timestamp when the task was manually completed/checked off.';
COMMENT ON COLUMN accounting_guides.completed_by IS 'Name or ID of the collaborator who completed the task.';
COMMENT ON COLUMN accounting_guides.justification IS 'Mandatory justification provided when completing the task.';
