create table if not exists public.catch_log_species (
  id bigint generated always as identity primary key,
  catch_log_id bigint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  species_id integer references public.fish_species(id) on delete set null,
  species_name text not null,
  count integer not null,
  size_cm numeric(5, 1),
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catch_log_species_catch_log_user_fk
    foreign key (catch_log_id, user_id)
    references public.catch_logs(id, user_id)
    on delete cascade,
  constraint catch_log_species_species_name_not_blank check (
    char_length(btrim(species_name)) > 0
  ),
  constraint catch_log_species_count_positive check (count > 0),
  constraint catch_log_species_size_positive check (
    size_cm is null or size_cm > 0
  ),
  constraint catch_log_species_sort_order_range check (
    sort_order between 1 and 3
  )
);

alter table public.catch_log_species enable row level security;

drop trigger if exists set_catch_log_species_updated_at
on public.catch_log_species;
create trigger set_catch_log_species_updated_at
before update on public.catch_log_species
for each row
execute function public.set_updated_at();

create unique index if not exists catch_log_species_catch_log_sort_order_key
  on public.catch_log_species (catch_log_id, sort_order);

create unique index if not exists catch_log_species_catch_log_species_id_key
  on public.catch_log_species (catch_log_id, species_id)
  where species_id is not null;

create unique index if not exists catch_log_species_catch_log_manual_name_key
  on public.catch_log_species (catch_log_id, lower(btrim(species_name)))
  where species_id is null;

create index if not exists catch_log_species_user_id_idx
  on public.catch_log_species (user_id);

create index if not exists catch_log_species_catch_log_id_idx
  on public.catch_log_species (catch_log_id);

create index if not exists catch_log_species_user_species_id_idx
  on public.catch_log_species (user_id, species_id)
  where species_id is not null;

drop policy if exists "Users can manage own catch log species"
on public.catch_log_species;
create policy "Users can manage own catch log species"
on public.catch_log_species
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into public.catch_log_species (
  catch_log_id,
  user_id,
  species_id,
  species_name,
  count,
  size_cm,
  sort_order
)
select
  catch_log.id,
  catch_log.user_id,
  catch_log.species_id,
  catch_log.species_name,
  catch_log.count,
  catch_log.size_cm,
  1
from public.catch_logs as catch_log
where catch_log.count > 0
  and not exists (
    select 1
    from public.catch_log_species as species_item
    where species_item.catch_log_id = catch_log.id
  );

drop function if exists public.get_catch_log_list(smallint, text, text);
drop function if exists public.get_catch_log_species_sections(smallint, text);
drop function if exists public.get_catch_log_point_groups(smallint, text);

create or replace function public.get_catch_log_list(
  p_location_type_id smallint,
  p_sort_order text default 'latest',
  p_search_query text default ''
)
returns table (
  id bigint,
  fishing_date date,
  location_type_id smallint,
  species_id integer,
  species_name text,
  count integer,
  size_cm numeric,
  tide text,
  point_name text,
  latitude double precision,
  longitude double precision,
  species_items jsonb
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_location_type_id not in (1, 2) then
    raise exception 'Unsupported location type: %', p_location_type_id
      using errcode = '22023';
  end if;

  if p_sort_order not in ('latest', 'largest') then
    raise exception 'Unsupported catch log sort order: %', p_sort_order
      using errcode = '22023';
  end if;

  return query
  with species_summary as (
    select
      species_item.catch_log_id,
      jsonb_agg(
        jsonb_build_object(
          'species_id', species_item.species_id,
          'species_name', species_item.species_name,
          'count', species_item.count,
          'size_cm', species_item.size_cm,
          'sort_order', species_item.sort_order
        )
        order by species_item.sort_order
      ) as species_items,
      sum(species_item.count)::integer as total_count,
      max(species_item.size_cm) as max_size_cm,
      string_agg(species_item.species_name, ' ') as species_names
    from public.catch_log_species as species_item
    group by species_item.catch_log_id
  ),
  representative_species as (
    select distinct on (species_item.catch_log_id)
      species_item.catch_log_id,
      species_item.species_id,
      species_item.species_name,
      species_item.size_cm
    from public.catch_log_species as species_item
    order by species_item.catch_log_id, species_item.sort_order
  ),
  filtered_catch_logs as (
    select
      catch_log.*,
      coalesce(representative.species_id, catch_log.species_id) as representative_species_id,
      coalesce(representative.species_name, catch_log.species_name) as representative_species_name,
      coalesce(representative.size_cm, catch_log.size_cm) as representative_size_cm,
      coalesce(summary.total_count, catch_log.count) as total_count,
      coalesce(summary.max_size_cm, catch_log.size_cm) as max_size_cm,
      coalesce(summary.species_items, '[]'::jsonb) as species_items,
      coalesce(summary.species_names, catch_log.species_name) as search_species_names
    from public.catch_logs as catch_log
    left join species_summary as summary
      on summary.catch_log_id = catch_log.id
    left join representative_species as representative
      on representative.catch_log_id = catch_log.id
    where catch_log.user_id = (select auth.uid())
      and catch_log.location_type_id = p_location_type_id
      and (
        btrim(coalesce(p_search_query, '')) = ''
        or position(
          lower(btrim(p_search_query)) in lower(
            concat_ws(
              ' ',
              coalesce(summary.species_names, catch_log.species_name),
              coalesce(nullif(btrim(catch_log.point_name), ''), '포인트 미입력'),
              coalesce(
                nullif(btrim(catch_log.tide), ''),
                case
                  when catch_log.location_type_id = 1 then '해당없음'
                  else '물때 미입력'
                end
              ),
              catch_log.fishing_date::text
            )
          )
        ) > 0
      )
  )
  select
    catch_log.id,
    catch_log.fishing_date,
    catch_log.location_type_id,
    catch_log.representative_species_id,
    catch_log.representative_species_name,
    catch_log.total_count,
    catch_log.representative_size_cm,
    catch_log.tide,
    catch_log.point_name,
    catch_log.latitude,
    catch_log.longitude,
    catch_log.species_items
  from filtered_catch_logs as catch_log
  order by
    case when p_sort_order = 'largest' then catch_log.max_size_cm end desc nulls last,
    catch_log.fishing_date desc,
    catch_log.created_at desc,
    catch_log.id desc;
end;
$$;

create or replace function public.get_catch_log_species_sections(
  p_location_type_id smallint,
  p_search_query text default ''
)
returns table (
  species_name text,
  total_records bigint,
  catch_logs jsonb
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_location_type_id not in (1, 2) then
    raise exception 'Unsupported location type: %', p_location_type_id
      using errcode = '22023';
  end if;

  return query
  with species_summary as (
    select
      species_item.catch_log_id,
      jsonb_agg(
        jsonb_build_object(
          'species_id', species_item.species_id,
          'species_name', species_item.species_name,
          'count', species_item.count,
          'size_cm', species_item.size_cm,
          'sort_order', species_item.sort_order
        )
        order by species_item.sort_order
      ) as species_items,
      string_agg(species_item.species_name, ' ') as species_names
    from public.catch_log_species as species_item
    group by species_item.catch_log_id
  ),
  filtered_catch_logs as (
    select
      catch_log.*,
      coalesce(summary.species_items, '[]'::jsonb) as species_items,
      coalesce(summary.species_names, catch_log.species_name) as search_species_names
    from public.catch_logs as catch_log
    left join species_summary as summary
      on summary.catch_log_id = catch_log.id
    where catch_log.user_id = (select auth.uid())
      and catch_log.location_type_id = p_location_type_id
      and (
        btrim(coalesce(p_search_query, '')) = ''
        or position(
          lower(btrim(p_search_query)) in lower(
            concat_ws(
              ' ',
              coalesce(summary.species_names, catch_log.species_name),
              coalesce(nullif(btrim(catch_log.point_name), ''), '포인트 미입력'),
              coalesce(
                nullif(btrim(catch_log.tide), ''),
                case
                  when catch_log.location_type_id = 1 then '해당없음'
                  else '물때 미입력'
                end
              ),
              catch_log.fishing_date::text
            )
          )
        ) > 0
      )
  ),
  species_sections as (
    select
      species_item.species_name,
      count(*)::bigint as total_records,
      max(catch_log.fishing_date) as latest_fishing_date,
      jsonb_agg(
        jsonb_build_object(
          'id', catch_log.id,
          'fishing_date', catch_log.fishing_date,
          'location_type_id', catch_log.location_type_id,
          'species_id', species_item.species_id,
          'species_name', species_item.species_name,
          'count', species_item.count,
          'size_cm', species_item.size_cm,
          'tide', catch_log.tide,
          'point_name', catch_log.point_name,
          'latitude', catch_log.latitude,
          'longitude', catch_log.longitude,
          'species_items', catch_log.species_items
        )
        order by catch_log.fishing_date desc, catch_log.created_at desc, catch_log.id desc
      ) as catch_logs
    from filtered_catch_logs as catch_log
    join public.catch_log_species as species_item
      on species_item.catch_log_id = catch_log.id
    group by species_item.species_name
  )
  select
    section.species_name,
    section.total_records,
    section.catch_logs
  from species_sections as section
  order by section.latest_fishing_date desc, section.species_name;
end;
$$;

create or replace function public.get_catch_log_point_groups(
  p_location_type_id smallint,
  p_search_query text default ''
)
returns table (
  point_name text,
  total_records bigint,
  total_catch_count bigint,
  main_species text,
  last_date date
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_location_type_id not in (1, 2) then
    raise exception 'Unsupported location type: %', p_location_type_id
      using errcode = '22023';
  end if;

  return query
  with species_summary as (
    select
      species_item.catch_log_id,
      sum(species_item.count)::integer as total_count,
      string_agg(species_item.species_name, ' ') as species_names
    from public.catch_log_species as species_item
    group by species_item.catch_log_id
  ),
  filtered_catch_logs as (
    select
      catch_log.*,
      coalesce(nullif(btrim(catch_log.point_name), ''), '포인트 미입력') as point_label,
      coalesce(summary.total_count, catch_log.count) as total_count,
      coalesce(summary.species_names, catch_log.species_name) as search_species_names
    from public.catch_logs as catch_log
    left join species_summary as summary
      on summary.catch_log_id = catch_log.id
    where catch_log.user_id = (select auth.uid())
      and catch_log.location_type_id = p_location_type_id
      and (
        btrim(coalesce(p_search_query, '')) = ''
        or position(
          lower(btrim(p_search_query)) in lower(
            concat_ws(
              ' ',
              coalesce(summary.species_names, catch_log.species_name),
              coalesce(nullif(btrim(catch_log.point_name), ''), '포인트 미입력'),
              coalesce(
                nullif(btrim(catch_log.tide), ''),
                case
                  when catch_log.location_type_id = 1 then '해당없음'
                  else '물때 미입력'
                end
              ),
              catch_log.fishing_date::text
            )
          )
        ) > 0
      )
  ),
  point_totals as (
    select
      catch_log.point_label,
      count(*)::bigint as total_records,
      sum(catch_log.total_count)::bigint as total_catch_count,
      max(catch_log.fishing_date) as last_date
    from filtered_catch_logs as catch_log
    group by catch_log.point_label
  ),
  point_species_counts as (
    select
      catch_log.point_label,
      species_item.species_name,
      sum(species_item.count)::bigint as species_catch_count
    from filtered_catch_logs as catch_log
    join public.catch_log_species as species_item
      on species_item.catch_log_id = catch_log.id
    group by catch_log.point_label, species_item.species_name
  ),
  ranked_point_species as (
    select
      species_count.point_label,
      species_count.species_name,
      row_number() over (
        partition by species_count.point_label
        order by species_count.species_catch_count desc, species_count.species_name
      ) as species_rank
    from point_species_counts as species_count
  )
  select
    point_total.point_label as point_name,
    point_total.total_records,
    point_total.total_catch_count,
    coalesce(ranked_species.species_name, '기록 없음') as main_species,
    point_total.last_date
  from point_totals as point_total
  left join ranked_point_species as ranked_species
    on ranked_species.point_label = point_total.point_label
    and ranked_species.species_rank = 1
  order by
    point_total.total_catch_count desc,
    point_total.total_records desc,
    point_total.last_date desc,
    point_total.point_label;
end;
$$;

revoke all on function public.get_catch_log_list(smallint, text, text)
from public;
revoke all on function public.get_catch_log_list(smallint, text, text)
from anon;
grant execute on function public.get_catch_log_list(smallint, text, text)
to authenticated;

revoke all on function public.get_catch_log_species_sections(smallint, text)
from public;
revoke all on function public.get_catch_log_species_sections(smallint, text)
from anon;
grant execute on function public.get_catch_log_species_sections(smallint, text)
to authenticated;

revoke all on function public.get_catch_log_point_groups(smallint, text)
from public;
revoke all on function public.get_catch_log_point_groups(smallint, text)
from anon;
grant execute on function public.get_catch_log_point_groups(smallint, text)
to authenticated;

comment on table public.catch_log_species is
  'Per-species catch items that belong to one fishing trip catch log.';

comment on function public.get_catch_log_list(smallint, text, text) is
  'Returns the authenticated user catch logs with per-species items.';

comment on function public.get_catch_log_species_sections(smallint, text) is
  'Returns authenticated user catch logs grouped by per-species catch items.';

comment on function public.get_catch_log_point_groups(smallint, text) is
  'Returns point-level catch log aggregates using per-species catch items.';
