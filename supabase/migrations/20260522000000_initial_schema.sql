-- ============================================================
--  BarberOS — Initial Database Schema
--  PostgreSQL / Supabase
-- ============================================================

-- Enable required extensions (optional, gen_random_uuid is used instead)
create extension if not exists "uuid-ossp" schema extensions;
create extension if not exists "pgcrypto" schema extensions;

-- ── ENUMS ────────────────────────────────────────────────────

create type appointment_status as enum (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create type payment_method as enum (
  'cash',
  'card',
  'transfer',
  'other'
);

create type payment_status as enum (
  'pending',
  'paid',
  'debt'
);

create type user_role as enum (
  'owner',
  'barber'
);

create type expense_category as enum (
  'rent',
  'utilities',
  'supplies',
  'salary',
  'marketing',
  'equipment',
  'other'
);

-- ── SHOPS ────────────────────────────────────────────────────

create table shops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,              -- used in public booking URL
  phone       text,
  address     text,
  city        text,
  timezone    text not null default 'America/Mexico_City',
  logo_url    text,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table shops is 'Barbershop tenants registered on the platform';

-- ── PROFILES (extends Supabase Auth users) ───────────────────

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  shop_id    uuid references shops(id) on delete cascade,
  role       user_role not null default 'barber',
  full_name  text not null,
  avatar_url text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Extended user profiles with role and shop association';

-- ── BARBERS ──────────────────────────────────────────────────

create table barbers (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  profile_id     uuid references profiles(id) on delete set null,
  name           text not null,
  bio            text,
  avatar_url     text,
  color          text not null default '#4f6ef7',  -- calendar display color
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── BARBER SCHEDULES ─────────────────────────────────────────

create table barber_schedules (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid not null references barbers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sun, 6=Sat
  start_time  time not null,
  end_time    time not null,
  is_active   boolean not null default true,

  unique(barber_id, day_of_week)
);

-- ── SERVICES ─────────────────────────────────────────────────

create table services (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops(id) on delete cascade,
  name        text not null,
  description text,
  duration    integer not null default 30,  -- minutes
  price       numeric(10, 2) not null,
  color       text not null default '#e94560',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── CLIENTS ──────────────────────────────────────────────────

create table clients (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  email         text,
  notes         text,                        -- private barber notes
  loyalty_points integer not null default 0,
  last_visit_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique(shop_id, phone)
);

-- ── APPOINTMENTS ─────────────────────────────────────────────

create table appointments (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  barber_id      uuid not null references barbers(id),
  client_id      uuid references clients(id) on delete set null,
  service_id     uuid not null references services(id),

  -- Denormalized for quick access without joins
  client_name    text not null,
  client_phone   text not null,
  service_name   text not null,
  service_price  numeric(10, 2) not null,
  duration       integer not null,           -- minutes

  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  status         appointment_status not null default 'pending',
  notes          text,
  created_via    text not null default 'dashboard',  -- 'dashboard' | 'whatsapp' | 'booking_page'
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index appointments_shop_id_starts_at_idx on appointments(shop_id, starts_at);
create index appointments_barber_id_starts_at_idx on appointments(barber_id, starts_at);
create index appointments_client_id_idx on appointments(client_id);

-- ── PAYMENTS ─────────────────────────────────────────────────

create table payments (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references shops(id) on delete cascade,
  appointment_id   uuid not null references appointments(id) on delete cascade,
  barber_id        uuid not null references barbers(id),
  amount           numeric(10, 2) not null,
  method           payment_method not null default 'cash',
  status           payment_status not null default 'paid',
  discount_amount  numeric(10, 2) not null default 0,
  commission_rate  numeric(5, 2) not null default 0,  -- barber commission %
  notes            text,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index payments_shop_id_created_at_idx on payments(shop_id, created_at);

-- ── INVENTORY ITEMS ──────────────────────────────────────────

create table inventory_items (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  name           text not null,
  brand          text,
  unit           text not null default 'unit',    -- unit, ml, g, etc.
  stock          numeric(10, 2) not null default 0,
  min_stock      numeric(10, 2) not null default 0,  -- alert threshold
  cost_per_unit  numeric(10, 2),
  supplier       text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── INVENTORY MOVEMENTS ──────────────────────────────────────

create table inventory_movements (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references shops(id) on delete cascade,
  item_id      uuid not null references inventory_items(id) on delete cascade,
  quantity     numeric(10, 2) not null,   -- positive = in, negative = out
  reason       text not null,             -- 'purchase', 'usage', 'adjustment', 'loss'
  total_cost   numeric(10, 2),
  notes        text,
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);

-- ── EXPENSES ─────────────────────────────────────────────────

create table expenses (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops(id) on delete cascade,
  category    expense_category not null default 'other',
  description text not null,
  amount      numeric(10, 2) not null,
  date        date not null,
  receipt_url text,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create index expenses_shop_id_date_idx on expenses(shop_id, date);

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────

create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on shops
  for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on profiles
  for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on barbers
  for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on clients
  for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on appointments
  for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on inventory_items
  for each row execute function trigger_set_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

alter table shops             enable row level security;
alter table profiles          enable row level security;
alter table barbers            enable row level security;
alter table barber_schedules  enable row level security;
alter table services          enable row level security;
alter table clients           enable row level security;
alter table appointments      enable row level security;
alter table payments          enable row level security;
alter table inventory_items   enable row level security;
alter table inventory_movements enable row level security;
alter table expenses          enable row level security;

-- Helper: get the current user's shop_id
create or replace function auth_shop_id()
returns uuid as $$
  select shop_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: get the current user's role
create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Shops: members can read their own shop; owners can update
create policy "members can view own shop"
  on shops for select using (id = auth_shop_id());

create policy "owners can update own shop"
  on shops for update using (id = auth_shop_id() and auth_role() = 'owner');

-- Profiles: users can view profiles in same shop
create policy "view profiles in own shop"
  on profiles for select using (shop_id = auth_shop_id());

create policy "users can update own profile"
  on profiles for update using (id = auth.uid());

-- Generic shop-scoped policies (applied to most tables)
create policy "shop members can view"
  on barbers for select using (shop_id = auth_shop_id());
create policy "owners can insert barbers"
  on barbers for insert with check (shop_id = auth_shop_id() and auth_role() = 'owner');
create policy "owners can update barbers"
  on barbers for update using (shop_id = auth_shop_id() and auth_role() = 'owner');

create policy "shop members can view schedules"
  on barber_schedules for select
  using (barber_id in (select id from barbers where shop_id = auth_shop_id()));

create policy "shop members can view services"
  on services for select using (shop_id = auth_shop_id());
create policy "owners can manage services"
  on services for all using (shop_id = auth_shop_id() and auth_role() = 'owner');

create policy "shop members can view clients"
  on clients for select using (shop_id = auth_shop_id());
create policy "shop members can manage clients"
  on clients for all using (shop_id = auth_shop_id());

create policy "shop members can view appointments"
  on appointments for select using (shop_id = auth_shop_id());
create policy "shop members can manage appointments"
  on appointments for all using (shop_id = auth_shop_id());

create policy "shop members can view payments"
  on payments for select using (shop_id = auth_shop_id());
create policy "shop members can manage payments"
  on payments for all using (shop_id = auth_shop_id());

create policy "shop members can view inventory"
  on inventory_items for select using (shop_id = auth_shop_id());
create policy "owners can manage inventory"
  on inventory_items for all using (shop_id = auth_shop_id() and auth_role() = 'owner');

create policy "shop members can view movements"
  on inventory_movements for select using (shop_id = auth_shop_id());
create policy "shop members can add movements"
  on inventory_movements for insert with check (shop_id = auth_shop_id());

create policy "owners can view expenses"
  on expenses for select using (shop_id = auth_shop_id() and auth_role() = 'owner');
create policy "owners can manage expenses"
  on expenses for all using (shop_id = auth_shop_id() and auth_role() = 'owner');
