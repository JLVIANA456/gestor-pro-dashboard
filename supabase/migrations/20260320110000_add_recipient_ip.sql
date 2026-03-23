
-- Migration: Add recipient_ip to tracking tables
-- Date: 2026-03-20

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS recipient_ip TEXT;
ALTER TABLE accounting_guides ADD COLUMN IF NOT EXISTS recipient_ip TEXT;
ALTER TABLE obligation_alerts_sent ADD COLUMN IF NOT EXISTS recipient_ip TEXT;

COMMENT ON COLUMN announcements.recipient_ip IS 'The IP address of the client that opened/accessed the announcement.';
COMMENT ON COLUMN accounting_guides.recipient_ip IS 'The IP address of the client that opened/accessed the guide.';
COMMENT ON COLUMN obligation_alerts_sent.recipient_ip IS 'The IP address of the client that opened/accessed the alert.';
