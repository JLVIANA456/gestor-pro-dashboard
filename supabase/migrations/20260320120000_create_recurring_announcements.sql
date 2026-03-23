
-- Migration: Create recurring_announcements table
-- Date: 2026-03-20

CREATE TABLE IF NOT EXISTS recurring_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    department TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    send_day INTEGER NOT NULL CHECK (send_day >= 1 AND send_day <= 31),
    last_sent_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    folder_id UUID REFERENCES announcement_folders(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    sender_ip TEXT
);

-- RLS Policies
ALTER TABLE recurring_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON recurring_announcements
    FOR ALL USING (auth.role() = 'authenticated');

-- Comment
COMMENT ON TABLE recurring_announcements IS 'Table for storing monthly recurring announcements.';
