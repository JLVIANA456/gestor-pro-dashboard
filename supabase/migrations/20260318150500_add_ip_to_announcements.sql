
-- Migration: Add sender_ip to announcements table
-- Date: 2026-03-18

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS sender_ip TEXT;
ALTER TABLE accounting_guides ADD COLUMN IF NOT EXISTS sender_ip TEXT;
ALTER TABLE obligation_alerts_sent ADD COLUMN IF NOT EXISTS sender_ip TEXT;

-- Create a function to get the current request IP
CREATE OR REPLACE FUNCTION get_current_request_ip() 
RETURNS TEXT AS $$
DECLARE
  headers JSON;
  ip TEXT;
BEGIN
  -- Get request headers from Supabase environment
  headers := current_setting('request.headers', true)::json;
  -- Try to get x-real-ip or cf-connecting-ip
  ip := headers->>'x-real-ip';
  IF ip IS NULL THEN
    ip := headers->>'cf-connecting-ip';
  END IF;
  RETURN ip;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Set default values for the columns to automatically capture IP on insert
ALTER TABLE announcements ALTER COLUMN sender_ip SET DEFAULT get_current_request_ip();
ALTER TABLE accounting_guides ALTER COLUMN sender_ip SET DEFAULT get_current_request_ip();
ALTER TABLE obligation_alerts_sent ALTER COLUMN sender_ip SET DEFAULT get_current_request_ip();

-- Update comments
COMMENT ON COLUMN announcements.sender_ip IS 'The IP address of the client that triggered the announcement.';
COMMENT ON COLUMN accounting_guides.sender_ip IS 'The IP address of the client that triggered the guide creation/delivery.';
COMMENT ON COLUMN obligation_alerts_sent.sender_ip IS 'The IP address of the client that triggered the alert.';
