-- ============================================================
--  BarberOS — Auth trigger & missing policies
-- ============================================================

-- ── 1. Auto-create profile when a user signs up ──────────────
--
-- Supabase fires this after every INSERT on auth.users.
-- We store the full_name from the signup metadata so the
-- profile row exists before the onboarding wizard runs.
-- shop_id and role are filled in during onboarding.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;   -- idempotent

  return new;
end;
$$;

-- Drop old trigger if it exists (safe to re-run)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ── 2. Policies missing from initial schema ──────────────────

-- Profiles: anyone can insert their own row
--   (needed for the trigger above; also as a fallback for
--    environments where the trigger doesn't fire)
drop policy if exists "users can insert own profile" on profiles;
create policy "users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Shops: owners can insert a new shop
drop policy if exists "owners can insert shop" on shops;
create policy "owners can insert shop"
  on shops for insert
  with check (true);   -- shop_id on profiles is set right after

-- Barbers: shop members can insert barbers
drop policy if exists "owners can insert barbers" on barbers;
create policy "owners can insert barbers"
  on barbers for insert
  with check (shop_id = auth_shop_id() and auth_role() = 'owner');

-- Services: owners can insert services
drop policy if exists "owners can insert services" on services;
create policy "owners can insert services"
  on services for insert
  with check (shop_id = auth_shop_id() and auth_role() = 'owner');

-- ── 3. Helper: is onboarding complete? ───────────────────────
--
-- Returns true if the current user has a shop_id set.
-- Used by the middleware redirect logic.

create or replace function public.has_completed_onboarding()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select shop_id is not null from public.profiles where id = auth.uid()),
    false
  );
$$;
