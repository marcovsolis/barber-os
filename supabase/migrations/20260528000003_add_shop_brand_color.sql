-- Brand color for the public booking portal
ALTER TABLE shops ADD COLUMN IF NOT EXISTS brand_color TEXT NOT NULL DEFAULT '#e94560';
