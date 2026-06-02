-- ============================================================
--  BarberOS — Inventory stock update function
-- ============================================================

-- Atomically adds quantity to an inventory item's stock.
-- quantity is positive for purchases/additions, negative for usage/losses.

create or replace function public.update_inventory_stock(
  p_item_id  uuid,
  p_quantity numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update inventory_items
  set stock      = stock + p_quantity,
      updated_at = now()
  where id = p_item_id;

  if not found then
    raise exception 'Inventory item % not found', p_item_id;
  end if;
end;
$$;
