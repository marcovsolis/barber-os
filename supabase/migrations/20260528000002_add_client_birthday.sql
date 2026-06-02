-- Add birthday field to clients for CRM profile
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthday DATE;
