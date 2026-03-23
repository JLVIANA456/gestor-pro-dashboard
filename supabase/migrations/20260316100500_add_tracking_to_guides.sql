
-- Migration: Add email tracking columns to accounting_guides
-- Date: 2026-03-16

ALTER TABLE accounting_guides ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE accounting_guides ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

-- Update comments
COMMENT ON COLUMN accounting_guides.delivered_at IS 'When the email was confirmed as delivered by the provider.';
COMMENT ON COLUMN accounting_guides.opened_at IS 'When the email was first opened by the recipient.';
