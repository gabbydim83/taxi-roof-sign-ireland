-- Taxi Roof Sign Ireland V1 | Supabase SQL Editor
-- Run once in a NEW or reviewed Supabase project.
-- The public can READ product settings; only a explicitly authorized owner can UPDATE them.
-- Never put a Supabase service-role key in public JavaScript.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.product_settings (
  product_id text primary key check (product_id in ('refurbished','gs900','northern','suction','roofsign1','roofsign2')),
  price_eur numeric(10,2) check (price_eur is null or price_eur >= 0),
  collect_info text not null default '',
  delivery_info text not null default '',
  led_enabled boolean not null default false,
  cable_enabled boolean not null default false,
  cable_length_m int not null default 3 check (cable_length_m in (2,3,4,5)),
  plug_type text not null default '' check (plug_type in ('','USB-C','Car power socket')),
  text_english boolean not null default false,
  text_irish boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.product_settings (product_id) values
 ('refurbished'),('gs900'),('northern'),('suction'),('roofsign1'),('roofsign2')
on conflict (product_id) do nothing;

alter table public.admin_users enable row level security;
alter table public.product_settings enable row level security;

-- Select access to the admin_users list is restricted to the currently signed-in user's own row.
drop policy if exists "owner read own authorization" on public.admin_users;
create policy "owner read own authorization" on public.admin_users
for select to authenticated using (user_id = (select auth.uid()));

-- Price / collect / delivery are public catalogue fields; NO secret data should be stored here.
drop policy if exists "everyone can read products" on public.product_settings;
create policy "everyone can read products" on public.product_settings
for select to anon, authenticated using (true);

-- Only members of admin_users may modify existing product records.
drop policy if exists "owners can update products" on public.product_settings;
create policy "owners can update products" on public.product_settings
for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id=(select auth.uid())));

-- No insert/delete policies are provided to the public or signed-in non-owners.
revoke all on public.admin_users from anon;
grant select on public.admin_users to authenticated;
grant select on public.product_settings to anon, authenticated;
grant update on public.product_settings to authenticated;

-- ADMIN SETUP (do NOT run with placeholder):
-- 1. Use Supabase Dashboard > Authentication > Users to add an account for the owner.
-- 2. Copy that account's UUID.
-- 3. Run manually in SQL Editor (using a trusted administrative session):
-- insert into public.admin_users(user_id) values ('OWNER_AUTH_USER_UUID_HERE');
-- 4. Test unauthenticated reads, unauthorized writes, and owner writes before going live.
