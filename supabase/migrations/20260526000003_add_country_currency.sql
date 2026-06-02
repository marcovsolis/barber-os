-- ============================================================
--  BarberOS — Add country and currency to shops
-- ============================================================

alter table shops
  add column if not exists country  text,
  add column if not exists currency text not null default 'MXN';
