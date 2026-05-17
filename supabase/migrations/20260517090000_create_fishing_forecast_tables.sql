create table if not exists public.fishing_locations (
  id bigint generated always as identity primary key,
  name text not null,
  region_code text,
  location_type_id smallint not null default 2 references public.location_types(id),
  latitude double precision not null,
  longitude double precision not null,
  source text not null,
  external_location_id text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fishing_locations_name_not_blank check (
    char_length(btrim(name)) > 0
  ),
  constraint fishing_locations_region_code_not_blank check (
    region_code is null or char_length(btrim(region_code)) > 0
  ),
  constraint fishing_locations_source_not_blank check (
    char_length(btrim(source)) > 0
  ),
  constraint fishing_locations_source_external_location_id_key unique (
    source,
    external_location_id
  ),
  constraint fishing_locations_external_location_id_not_blank check (
    char_length(btrim(external_location_id)) > 0
  ),
  constraint fishing_locations_latitude_range check (
    latitude >= -90 and latitude <= 90
  ),
  constraint fishing_locations_longitude_range check (
    longitude >= -180 and longitude <= 180
  ),
  constraint fishing_locations_metadata_object_check check (
    jsonb_typeof(metadata) = 'object'
  )
);

comment on table public.fishing_locations is
  'Fishing forecast collection locations shared by fishing index and weather forecast data.';

comment on column public.fishing_locations.source is
  'External provider or manually managed source name.';

alter table public.fishing_locations enable row level security;

drop trigger if exists set_fishing_locations_updated_at on public.fishing_locations;
create trigger set_fishing_locations_updated_at
before update on public.fishing_locations
for each row
execute function public.set_updated_at();

create index if not exists fishing_locations_active_lookup_idx
  on public.fishing_locations (location_type_id, region_code, name)
  where is_active = true;

create index if not exists fishing_locations_location_type_id_idx
  on public.fishing_locations (location_type_id);

drop policy if exists "Anyone can view active fishing locations" on public.fishing_locations;
create policy "Anyone can view active fishing locations"
on public.fishing_locations
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

drop policy if exists "Admins can insert fishing locations" on public.fishing_locations;
create policy "Admins can insert fishing locations"
on public.fishing_locations
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

drop policy if exists "Admins can update fishing locations" on public.fishing_locations;
create policy "Admins can update fishing locations"
on public.fishing_locations
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

drop policy if exists "Admins can delete fishing locations" on public.fishing_locations;
create policy "Admins can delete fishing locations"
on public.fishing_locations
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

create table if not exists public.fishing_index_forecasts (
  id bigint generated always as identity primary key,
  location_id bigint not null references public.fishing_locations(id) on delete cascade,
  source text not null,
  external_forecast_id text,
  fishing_type text not null,
  forecast_date date not null,
  forecast_time time without time zone not null,
  tide text,
  wave_height_min_m numeric(5, 2),
  wave_height_max_m numeric(5, 2),
  water_temp_min_c numeric(4, 1),
  water_temp_max_c numeric(4, 1),
  air_temp_min_c numeric(4, 1),
  air_temp_max_c numeric(4, 1),
  current_speed_min_kn numeric(5, 2),
  current_speed_max_kn numeric(5, 2),
  wind_speed_min_ms numeric(5, 2),
  wind_speed_max_ms numeric(5, 2),
  fishing_index_score numeric(5, 2),
  fishing_index_grade text,
  raw_payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fishing_index_forecasts_unique_slot unique (
    source,
    location_id,
    fishing_type,
    forecast_date,
    forecast_time
  ),
  constraint fishing_index_forecasts_source_not_blank check (
    char_length(btrim(source)) > 0
  ),
  constraint fishing_index_forecasts_external_forecast_id_not_blank check (
    external_forecast_id is null
    or char_length(btrim(external_forecast_id)) > 0
  ),
  constraint fishing_index_forecasts_fishing_type_check check (
    fishing_type in ('갯바위', '선상')
  ),
  constraint fishing_index_forecasts_tide_not_blank check (
    tide is null or char_length(btrim(tide)) > 0
  ),
  constraint fishing_index_forecasts_fishing_index_grade_not_blank check (
    fishing_index_grade is null
    or char_length(btrim(fishing_index_grade)) > 0
  ),
  constraint fishing_index_forecasts_has_index_value check (
    fishing_index_score is not null or fishing_index_grade is not null
  ),
  constraint fishing_index_forecasts_wave_height_non_negative check (
    (wave_height_min_m is null or wave_height_min_m >= 0)
    and (wave_height_max_m is null or wave_height_max_m >= 0)
  ),
  constraint fishing_index_forecasts_wave_height_range check (
    wave_height_min_m is null
    or wave_height_max_m is null
    or wave_height_max_m >= wave_height_min_m
  ),
  constraint fishing_index_forecasts_water_temp_range check (
    water_temp_min_c is null
    or water_temp_max_c is null
    or water_temp_max_c >= water_temp_min_c
  ),
  constraint fishing_index_forecasts_air_temp_range check (
    air_temp_min_c is null
    or air_temp_max_c is null
    or air_temp_max_c >= air_temp_min_c
  ),
  constraint fishing_index_forecasts_current_speed_non_negative check (
    (current_speed_min_kn is null or current_speed_min_kn >= 0)
    and (current_speed_max_kn is null or current_speed_max_kn >= 0)
  ),
  constraint fishing_index_forecasts_current_speed_range check (
    current_speed_min_kn is null
    or current_speed_max_kn is null
    or current_speed_max_kn >= current_speed_min_kn
  ),
  constraint fishing_index_forecasts_wind_speed_non_negative check (
    (wind_speed_min_ms is null or wind_speed_min_ms >= 0)
    and (wind_speed_max_ms is null or wind_speed_max_ms >= 0)
  ),
  constraint fishing_index_forecasts_wind_speed_range check (
    wind_speed_min_ms is null
    or wind_speed_max_ms is null
    or wind_speed_max_ms >= wind_speed_min_ms
  ),
  constraint fishing_index_forecasts_score_non_negative check (
    fishing_index_score is null or fishing_index_score >= 0
  ),
  constraint fishing_index_forecasts_raw_payload_object_check check (
    jsonb_typeof(raw_payload) = 'object'
  )
);

comment on table public.fishing_index_forecasts is
  'Normalized sea fishing index forecast data collected on a schedule.';

comment on column public.fishing_index_forecasts.forecast_date is
  'Forecast local date from the upstream provider.';

comment on column public.fishing_index_forecasts.forecast_time is
  'Forecast local time from the upstream provider.';

comment on column public.fishing_index_forecasts.raw_payload is
  'Original provider response fragment for diagnostics and reprocessing.';

alter table public.fishing_index_forecasts enable row level security;

drop trigger if exists set_fishing_index_forecasts_updated_at on public.fishing_index_forecasts;
create trigger set_fishing_index_forecasts_updated_at
before update on public.fishing_index_forecasts
for each row
execute function public.set_updated_at();

create index if not exists fishing_index_forecasts_lookup_idx
  on public.fishing_index_forecasts (
    location_id,
    fishing_type,
    forecast_date,
    forecast_time
  );

drop policy if exists "Anyone can view fishing index forecasts" on public.fishing_index_forecasts;
create policy "Anyone can view fishing index forecasts"
on public.fishing_index_forecasts
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert fishing index forecasts" on public.fishing_index_forecasts;
create policy "Admins can insert fishing index forecasts"
on public.fishing_index_forecasts
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

drop policy if exists "Admins can update fishing index forecasts" on public.fishing_index_forecasts;
create policy "Admins can update fishing index forecasts"
on public.fishing_index_forecasts
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

drop policy if exists "Admins can delete fishing index forecasts" on public.fishing_index_forecasts;
create policy "Admins can delete fishing index forecasts"
on public.fishing_index_forecasts
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

create table if not exists public.weather_forecasts (
  id bigint generated always as identity primary key,
  location_id bigint not null references public.fishing_locations(id) on delete cascade,
  source text not null,
  external_forecast_id text,
  forecast_date date not null,
  forecast_time time without time zone not null,
  weather_condition text,
  air_temp_c numeric(4, 1),
  precipitation_probability_percent numeric(5, 2),
  precipitation_amount_mm numeric(6, 2),
  humidity_percent numeric(5, 2),
  wind_direction_deg numeric(5, 1),
  wind_direction_text text,
  wind_speed_ms numeric(5, 2),
  pressure_hpa numeric(7, 2),
  raw_payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_forecasts_unique_slot unique (
    source,
    location_id,
    forecast_date,
    forecast_time
  ),
  constraint weather_forecasts_source_not_blank check (
    char_length(btrim(source)) > 0
  ),
  constraint weather_forecasts_external_forecast_id_not_blank check (
    external_forecast_id is null
    or char_length(btrim(external_forecast_id)) > 0
  ),
  constraint weather_forecasts_weather_condition_not_blank check (
    weather_condition is null or char_length(btrim(weather_condition)) > 0
  ),
  constraint weather_forecasts_wind_direction_text_not_blank check (
    wind_direction_text is null or char_length(btrim(wind_direction_text)) > 0
  ),
  constraint weather_forecasts_precipitation_probability_range check (
    precipitation_probability_percent is null
    or (
      precipitation_probability_percent >= 0
      and precipitation_probability_percent <= 100
    )
  ),
  constraint weather_forecasts_precipitation_amount_non_negative check (
    precipitation_amount_mm is null or precipitation_amount_mm >= 0
  ),
  constraint weather_forecasts_humidity_range check (
    humidity_percent is null
    or (humidity_percent >= 0 and humidity_percent <= 100)
  ),
  constraint weather_forecasts_wind_direction_range check (
    wind_direction_deg is null
    or (wind_direction_deg >= 0 and wind_direction_deg < 360)
  ),
  constraint weather_forecasts_wind_speed_non_negative check (
    wind_speed_ms is null or wind_speed_ms >= 0
  ),
  constraint weather_forecasts_pressure_positive check (
    pressure_hpa is null or pressure_hpa > 0
  ),
  constraint weather_forecasts_raw_payload_object_check check (
    jsonb_typeof(raw_payload) = 'object'
  )
);

comment on table public.weather_forecasts is
  'Normalized weather forecast data collected on a schedule.';

comment on column public.weather_forecasts.forecast_date is
  'Forecast local date from the upstream provider.';

comment on column public.weather_forecasts.forecast_time is
  'Forecast local time from the upstream provider.';

comment on column public.weather_forecasts.raw_payload is
  'Original provider response fragment for diagnostics and reprocessing.';

alter table public.weather_forecasts enable row level security;

drop trigger if exists set_weather_forecasts_updated_at on public.weather_forecasts;
create trigger set_weather_forecasts_updated_at
before update on public.weather_forecasts
for each row
execute function public.set_updated_at();

create index if not exists weather_forecasts_lookup_idx
  on public.weather_forecasts (location_id, forecast_date, forecast_time);

drop policy if exists "Anyone can view weather forecasts" on public.weather_forecasts;
create policy "Anyone can view weather forecasts"
on public.weather_forecasts
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert weather forecasts" on public.weather_forecasts;
create policy "Admins can insert weather forecasts"
on public.weather_forecasts
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

drop policy if exists "Admins can update weather forecasts" on public.weather_forecasts;
create policy "Admins can update weather forecasts"
on public.weather_forecasts
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

drop policy if exists "Admins can delete weather forecasts" on public.weather_forecasts;
create policy "Admins can delete weather forecasts"
on public.weather_forecasts
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
