-- Barber commission percentage (0–100, stored as integer)
-- Default 50 means the barber earns 50% of each service revenue
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS commission_pct INTEGER NOT NULL DEFAULT 50
  CONSTRAINT barbers_commission_pct_check CHECK (commission_pct >= 0 AND commission_pct <= 100);
