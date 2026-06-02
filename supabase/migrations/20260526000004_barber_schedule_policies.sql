-- ============================================================
--  BarberOS — RLS policies for barber_schedules writes
-- ============================================================

-- Owners can insert / update / delete schedules for barbers in their shop
create policy "owners can manage schedules"
  on barber_schedules for all
  using (
    barber_id in (
      select id from barbers where shop_id = auth_shop_id()
    )
    and auth_role() = 'owner'
  )
  with check (
    barber_id in (
      select id from barbers where shop_id = auth_shop_id()
    )
    and auth_role() = 'owner'
  );
