-- Barber blocks: prevent bookings during specific times or full days
CREATE TABLE IF NOT EXISTS barber_blocks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  barber_id    UUID        REFERENCES barbers(id) ON DELETE CASCADE, -- NULL = all barbers in shop
  date         DATE        NOT NULL,
  start_time   TIME,                                                  -- NULL if is_full_day
  end_time     TIME,                                                  -- NULL if is_full_day
  is_full_day  BOOLEAN     NOT NULL DEFAULT false,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for slot generation queries (shop + barber + date)
CREATE INDEX IF NOT EXISTS idx_barber_blocks_lookup
  ON barber_blocks (shop_id, date, barber_id);

-- RLS
ALTER TABLE barber_blocks ENABLE ROW LEVEL SECURITY;

-- Shop owners can manage their blocks
CREATE POLICY "Shop members can manage blocks"
  ON barber_blocks FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid()
    )
  );
