-- Taxi Roof Sign Ireland: V1.3 migration (run ONCE after the initial six products exist)
-- Adds editable names, descriptions, catalogue visibility and six additional products.
-- Does NOT modify user accounts, owner passwords or existing prices.
begin;

alter table public.product_settings
  add column if not exists product_name text not null default '',
  add column if not exists product_description text not null default '',
  add column if not exists is_published boolean not null default true;

-- The original table limited IDs to the six launch products.
alter table public.product_settings drop constraint if exists product_settings_product_id_check;
alter table public.product_settings
  add constraint product_settings_product_id_check check (product_id in (
    'refurbished','gs900','northern','suction','roofsign1','roofsign2',
    'new01','new02','new03','new04','new05','new06'
  ));

-- Preserve existing edits; only backfill names which are still blank.
update public.product_settings set product_name=case product_id
  when 'refurbished' then 'Refurbished Taxi Roofsign'
  when 'gs900' then 'Taxi Roofsign G&S 900'
  when 'northern' then 'Taxi Roofsign Northern Ireland'
  when 'suction' then 'Taxi Roofsign With Suction Cups G&S 900'
  when 'roofsign1' then 'Taxi Roofsign 1'
  when 'roofsign2' then 'Taxi Roofsign 2'
  else product_name end
where product_name='';

-- The one confirmed new product: title and EUR185 price.
insert into public.product_settings (product_id,product_name,product_description,price_eur,is_published) values
  ('new01','Complete Taxi Roof Sign with Magnets','Complete taxi roof sign with magnets.',185,true)
on conflict (product_id) do nothing;

-- Other photos are available, but product names and prices are not confirmed.
-- Keep them as DRAFTS (hidden from the public catalogue) for the owner to finish.
insert into public.product_settings (product_id,product_name,product_description,price_eur,is_published) values
  ('new02','','',null,false),
  ('new03','','',null,false),
  ('new04','','',null,false),
  ('new05','','',null,false),
  ('new06','','',null,false)
on conflict (product_id) do nothing;

-- Maintain strict field-level UPDATE access for owner accounts only.
revoke all on table public.product_settings from anon,authenticated;
grant select on table public.product_settings to anon,authenticated;
grant update (
 product_name,product_description,is_published,price_eur,collect_info,delivery_info,
 led_enabled,cable_enabled,cable_length_m,plug_type,text_english,text_irish,updated_at
) on table public.product_settings to authenticated;

-- Anonymous users may read only published products. Authenticated owners can also see drafts.
drop policy if exists "public reads products" on public.product_settings;
drop policy if exists "public reads published products" on public.product_settings;
create policy "public reads published products" on public.product_settings
  for select to anon,authenticated using (is_published=true);
drop policy if exists "approved owner reads all products" on public.product_settings;
create policy "approved owner reads all products" on public.product_settings
  for select to authenticated using (exists (
    select 1 from public.admin_users a where a.user_id=(select auth.uid())
  ));

-- Retain the existing approved-owner UPDATE RLS policy.
commit;
select product_id,product_name,price_eur,is_published from public.product_settings order by product_id;
