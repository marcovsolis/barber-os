-- Migration: add break_after to services
-- Run this in the Supabase SQL editor before deploying the updated code.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS break_after INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN services.break_after IS
  'Minutes blocked after the service ends (cleanup/prep time). Slot generator uses duration + break_after as effective blocked window.';
