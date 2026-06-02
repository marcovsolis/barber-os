-- ── Security fixes (audit 2026-06-01) ────────────────────────

-- #6: Prevent double booking using a unique constraint.
-- The pg_trgm/btree_gist extension is needed for EXCLUDE USING gist.
-- Simpler alternative: a unique partial index on (barber_id, starts_at)
-- combined with the application-level conflict check already in place.
-- This handles the race condition when two requests arrive simultaneously.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
  ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    barber_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'no_show'));

-- #7: Only allow creating a shop if the user's profile has no shop yet.
-- Prevents any authenticated user from creating unlimited shops.

DROP POLICY IF EXISTS "owners can insert shop" ON shops;

CREATE POLICY "users can create one shop"
  ON shops FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND shop_id IS NOT NULL
    )
  );
