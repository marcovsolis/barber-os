-- Super admin features
-- Shop blocking: use existing is_active column
-- Add suspension reason for admin notes
ALTER TABLE shops ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS suspended_at     TIMESTAMPTZ;

-- Per-shop WhatsApp configuration
ALTER TABLE shops ADD COLUMN IF NOT EXISTS whatsapp_api_key  TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS whatsapp_phone_id TEXT;
