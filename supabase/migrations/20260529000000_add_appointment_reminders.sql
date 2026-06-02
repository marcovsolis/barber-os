-- Appointment reminders queue
-- Populated automatically by cron; sent via WhatsApp API or manually by admin

CREATE TABLE IF NOT EXISTS appointment_reminders (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID        NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  shop_id        UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type           TEXT        NOT NULL CHECK (type IN ('24h', '30min', 'review')),
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  scheduled_for  TIMESTAMPTZ NOT NULL,   -- when this reminder should fire
  sent_at        TIMESTAMPTZ,
  wa_link        TEXT,                   -- pre-built wa.me link for manual send
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (appointment_id, type)          -- one reminder per type per appointment
);

CREATE INDEX IF NOT EXISTS idx_reminders_pending
  ON appointment_reminders (shop_id, status, scheduled_for);

ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can manage reminders"
  ON appointment_reminders FOR ALL
  USING (
    shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );
