-- Taxi Roof Sign Ireland V1.4: catalogue display order
-- IMPORTANT: run after migration_v1_3.sql. Preserves product names, prices and publication status.
-- Can be rerun safely.
begin;

alter table public.product_settings
  add column if not exists display_order integer;

-- Initialise only records without a position, preserving any later owner-made ordering.
with ranked as (
  select product_id,
    row_number() over (order by case product_id
      when 'refurbished' then 1
      when 'gs900' then 2
      when 'northern' then 3
      when 'suction' then 4
      when 'roofsign1' then 5
      when 'roofsign2' then 6
      when 'new01' then 7
      when 'new02' then 8
      when 'new03' then 9
      when 'new04' then 10
      when 'new05' then 11
      when 'new06' then 12
      else 999 end, product_id) as position
  from public.product_settings
)
update public.product_settings as p
set display_order = ranked.position::integer
from ranked
where p.product_id = ranked.product_id and p.display_order is null;

alter table public.product_settings
  alter column display_order set not null;

alter table public.product_settings
  drop constraint if exists product_settings_display_order_check;
alter table public.product_settings
  add constraint product_settings_display_order_check check (display_order > 0);

-- Clients may read positions. Editing individual positions is NOT granted directly;
-- only the secured function below may reorder published products atomically.
revoke update (display_order) on public.product_settings from authenticated;

create or replace function public.set_product_display_position(
  p_product_id text,
  p_new_position integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining text[];
  reordered text[];
  total integer;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_users as a where a.user_id = (select auth.uid())
  ) then
    raise exception 'Not authorized to manage the catalogue';
  end if;

  -- Serialize concurrent order changes to avoid interleaving positions.
  perform pg_catalog.pg_advisory_xact_lock(784357126351::bigint);

  if not exists (
    select 1 from public.product_settings as p
    where p.product_id = p_product_id and p.is_published = true
  ) then
    raise exception 'The product must be published before it can be positioned';
  end if;

  select coalesce(pg_catalog.array_agg(p.product_id order by p.display_order, p.product_id), array[]::text[])
    into remaining
  from public.product_settings as p
  where p.is_published = true and p.product_id <> p_product_id;

  total := coalesce(pg_catalog.array_length(remaining, 1), 0) + 1;
  if p_new_position is null or p_new_position < 1 or p_new_position > total then
    raise exception 'Position must be between 1 and %', total;
  end if;

  reordered := coalesce(remaining[1:p_new_position-1], array[]::text[])
               || array[p_product_id]
               || coalesce(remaining[p_new_position:total-1], array[]::text[]);

  update public.product_settings as p
  set display_order = ordered.position::integer
  from pg_catalog.unnest(reordered) with ordinality as ordered(product_id, position)
  where p.product_id = ordered.product_id;
end;
$$;

revoke all on function public.set_product_display_position(text, integer) from public;
revoke all on function public.set_product_display_position(text, integer) from anon;
grant execute on function public.set_product_display_position(text, integer) to authenticated;

commit;

-- Tell PostgREST to discover the new column and RPC immediately.
select pg_catalog.pg_notify('pgrst', 'reload schema');

select product_id, product_name, is_published, display_order
from public.product_settings
order by is_published desc, display_order, product_id;
