create index if not exists catch_logs_user_location_size_date_idx
  on public.catch_logs (
    user_id,
    location_type_id,
    size_cm desc nulls last,
    fishing_date desc,
    created_at desc
  );

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
  longitude double precision
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

  if p_sort_order = 'largest' then
    return query
    select
      catch_log.id,
      catch_log.fishing_date,
      catch_log.location_type_id,
      catch_log.species_id,
      catch_log.species_name,
      catch_log.count,
      catch_log.size_cm,
      catch_log.tide,
      catch_log.point_name,
      catch_log.latitude,
      catch_log.longitude
    from public.catch_logs as catch_log
    where catch_log.user_id = (select auth.uid())
      and catch_log.location_type_id = p_location_type_id
      and (
        btrim(coalesce(p_search_query, '')) = ''
        or position(
          lower(btrim(p_search_query)) in lower(
            concat_ws(
              ' ',
              catch_log.species_name,
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
    order by
      catch_log.size_cm desc nulls last,
      catch_log.fishing_date desc,
      catch_log.created_at desc,
      catch_log.id desc;
    return;
  end if;

  return query
  select
    catch_log.id,
    catch_log.fishing_date,
    catch_log.location_type_id,
    catch_log.species_id,
    catch_log.species_name,
    catch_log.count,
    catch_log.size_cm,
    catch_log.tide,
    catch_log.point_name,
    catch_log.latitude,
    catch_log.longitude
  from public.catch_logs as catch_log
  where catch_log.user_id = (select auth.uid())
    and catch_log.location_type_id = p_location_type_id
    and (
      btrim(coalesce(p_search_query, '')) = ''
      or position(
        lower(btrim(p_search_query)) in lower(
          concat_ws(
            ' ',
            catch_log.species_name,
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
  order by
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
  with filtered_catch_logs as (
    select catch_log.*
    from public.catch_logs as catch_log
    where catch_log.user_id = (select auth.uid())
      and catch_log.location_type_id = p_location_type_id
      and (
        btrim(coalesce(p_search_query, '')) = ''
        or position(
          lower(btrim(p_search_query)) in lower(
            concat_ws(
              ' ',
              catch_log.species_name,
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
      catch_log.species_name,
      count(*)::bigint as total_records,
      max(catch_log.fishing_date) as latest_fishing_date,
      jsonb_agg(
        jsonb_build_object(
          'id', catch_log.id,
          'fishing_date', catch_log.fishing_date,
          'location_type_id', catch_log.location_type_id,
          'species_id', catch_log.species_id,
          'species_name', catch_log.species_name,
          'count', catch_log.count,
          'size_cm', catch_log.size_cm,
          'tide', catch_log.tide,
          'point_name', catch_log.point_name,
          'latitude', catch_log.latitude,
          'longitude', catch_log.longitude
        )
        order by catch_log.fishing_date desc, catch_log.created_at desc, catch_log.id desc
      ) as catch_logs
    from filtered_catch_logs as catch_log
    group by catch_log.species_name
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
  with filtered_catch_logs as (
    select
      catch_log.*,
      coalesce(nullif(btrim(catch_log.point_name), ''), '포인트 미입력') as point_label
    from public.catch_logs as catch_log
    where catch_log.user_id = (select auth.uid())
      and catch_log.location_type_id = p_location_type_id
      and (
        btrim(coalesce(p_search_query, '')) = ''
        or position(
          lower(btrim(p_search_query)) in lower(
            concat_ws(
              ' ',
              catch_log.species_name,
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
      sum(catch_log.count)::bigint as total_catch_count,
      max(catch_log.fishing_date) as last_date
    from filtered_catch_logs as catch_log
    group by catch_log.point_label
  ),
  point_species_counts as (
    select
      catch_log.point_label,
      catch_log.species_name,
      sum(catch_log.count)::bigint as species_catch_count
    from filtered_catch_logs as catch_log
    group by catch_log.point_label, catch_log.species_name
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

revoke all on function public.get_catch_log_list(smallint, text, text) from public;
revoke all on function public.get_catch_log_list(smallint, text, text) from anon;
grant execute on function public.get_catch_log_list(smallint, text, text) to authenticated;

revoke all on function public.get_catch_log_species_sections(smallint, text) from public;
revoke all on function public.get_catch_log_species_sections(smallint, text) from anon;
grant execute on function public.get_catch_log_species_sections(smallint, text) to authenticated;

revoke all on function public.get_catch_log_point_groups(smallint, text) from public;
revoke all on function public.get_catch_log_point_groups(smallint, text) from anon;
grant execute on function public.get_catch_log_point_groups(smallint, text) to authenticated;

comment on function public.get_catch_log_list(smallint, text, text) is
  'Returns the authenticated user catch logs in latest or largest order.';

comment on function public.get_catch_log_species_sections(smallint, text) is
  'Returns the authenticated user catch logs grouped into species sections.';

comment on function public.get_catch_log_point_groups(smallint, text) is
  'Returns point-level catch log aggregates for the authenticated user.';
