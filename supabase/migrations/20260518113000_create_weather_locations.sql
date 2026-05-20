create table if not exists public.weather_locations (
  id bigint generated always as identity primary key,
  name text not null,
  location_level text not null,
  region_name text not null,
  sido_name text not null,
  sigungu_name text,
  eup_myeon_dong_name text,
  ri_name text,
  latitude double precision not null,
  longitude double precision not null,
  kma_nx integer not null,
  kma_ny integer not null,
  source text not null,
  source_version text,
  external_location_id text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_locations_source_external_location_id_key unique (
    source,
    external_location_id
  ),
  constraint weather_locations_name_not_blank check (
    char_length(btrim(name)) > 0
  ),
  constraint weather_locations_region_name_not_blank check (
    char_length(btrim(region_name)) > 0
  ),
  constraint weather_locations_sido_name_not_blank check (
    char_length(btrim(sido_name)) > 0
  ),
  constraint weather_locations_sigungu_name_not_blank check (
    sigungu_name is null or char_length(btrim(sigungu_name)) > 0
  ),
  constraint weather_locations_eup_myeon_dong_name_not_blank check (
    eup_myeon_dong_name is null
    or char_length(btrim(eup_myeon_dong_name)) > 0
  ),
  constraint weather_locations_ri_name_not_blank check (
    ri_name is null or char_length(btrim(ri_name)) > 0
  ),
  constraint weather_locations_location_level_check check (
    location_level in (
      'sido',
      'sigungu',
      'eup_myeon_dong',
      'ri',
      'fishing_location',
      'grid'
    )
  ),
  constraint weather_locations_latitude_range check (
    latitude >= -90 and latitude <= 90
  ),
  constraint weather_locations_longitude_range check (
    longitude >= -180 and longitude <= 180
  ),
  constraint weather_locations_kma_grid_positive check (
    kma_nx > 0 and kma_ny > 0
  ),
  constraint weather_locations_source_not_blank check (
    char_length(btrim(source)) > 0
  ),
  constraint weather_locations_external_location_id_not_blank check (
    char_length(btrim(external_location_id)) > 0
  ),
  constraint weather_locations_metadata_object_check check (
    jsonb_typeof(metadata) = 'object'
  )
);

comment on table public.weather_locations is
  'Weather forecast collection locations, separated from fishing forecast locations.';

comment on column public.weather_locations.kma_nx is
  'KMA DFS grid x coordinate derived from latitude/longitude.';

comment on column public.weather_locations.kma_ny is
  'KMA DFS grid y coordinate derived from latitude/longitude.';

comment on column public.weather_locations.is_active is
  'Only active rows are scheduled for weather forecast collection.';

alter table public.weather_locations enable row level security;

drop trigger if exists set_weather_locations_updated_at on public.weather_locations;
create trigger set_weather_locations_updated_at
before update on public.weather_locations
for each row
execute function public.set_updated_at();

create index if not exists weather_locations_active_grid_idx
  on public.weather_locations (kma_nx, kma_ny)
  where is_active = true;

create index if not exists weather_locations_active_region_lookup_idx
  on public.weather_locations (
    location_level,
    sido_name,
    sigungu_name,
    eup_myeon_dong_name
  )
  where is_active = true;

create index if not exists weather_locations_active_coordinate_idx
  on public.weather_locations (latitude, longitude)
  where is_active = true;

drop policy if exists "Anyone can view active weather locations" on public.weather_locations;
create policy "Anyone can view active weather locations"
on public.weather_locations
for select
to anon, authenticated
using (
  is_active = true
  or exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can insert weather locations" on public.weather_locations;
create policy "Admins can insert weather locations"
on public.weather_locations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update weather locations" on public.weather_locations;
create policy "Admins can update weather locations"
on public.weather_locations
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete weather locations" on public.weather_locations;
create policy "Admins can delete weather locations"
on public.weather_locations
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

alter table public.weather_forecasts
alter column location_id drop not null;

alter table public.weather_forecasts
add column if not exists weather_location_id bigint
references public.weather_locations(id) on delete cascade;

alter table public.weather_forecasts
add column if not exists kma_nx integer;

alter table public.weather_forecasts
add column if not exists kma_ny integer;

alter table public.weather_forecasts
add constraint weather_forecasts_location_reference_check check (
  location_id is not null
  or weather_location_id is not null
  or (kma_nx is not null and kma_ny is not null)
);

alter table public.weather_forecasts
add constraint weather_forecasts_kma_grid_positive check (
  (kma_nx is null and kma_ny is null)
  or (kma_nx > 0 and kma_ny > 0)
);

create index if not exists weather_forecasts_weather_location_lookup_idx
  on public.weather_forecasts (
    weather_location_id,
    forecast_date,
    forecast_time
  );

create index if not exists weather_forecasts_grid_lookup_idx
  on public.weather_forecasts (
    kma_nx,
    kma_ny,
    forecast_date,
    forecast_time
  )
  where kma_nx is not null and kma_ny is not null;

create unique index if not exists weather_forecasts_unique_grid_slot_idx
  on public.weather_forecasts (
    source,
    kma_nx,
    kma_ny,
    forecast_date,
    forecast_time
  );
