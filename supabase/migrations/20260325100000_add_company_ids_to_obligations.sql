-- Add company_ids to obligations table
ALTER TABLE obligations ADD COLUMN company_ids UUID[] DEFAULT '{}';
