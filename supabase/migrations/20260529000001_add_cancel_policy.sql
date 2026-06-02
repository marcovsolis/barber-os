-- Cancellation policy: minimum hours before appointment to allow client self-cancellation
-- 0 = always allowed, 2 = must cancel at least 2h before, 24 = at least 1 day before
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cancel_hours_before INTEGER NOT NULL DEFAULT 2;
