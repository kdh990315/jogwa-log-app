alter table public.catch_logs
add column if not exists address text,
add column if not exists region_name text,
add column if not exists captured_at_source text,
add column if not exists location_source text,
add column if not exists address_source text,
add column if not exists weather_source text,
add column if not exists species_source text,
add column if not exists weather_forecast_id bigint references public.weather_forecasts(id) on delete set null,
add column if not exists weather_location_id bigint references public.weather_locations(id) on delete set null,
add column if not exists fishing_index_forecast_id bigint references public.fishing_index_forecasts(id) on delete set null,
add column if not exists fishing_location_id bigint references public.fishing_locations(id) on delete set null,
add column if not exists current_speed_kn numeric(5, 2),
add column if not exists wind_direction_deg numeric(5, 1),
add column if not exists humidity_percent numeric(5, 2),
add column if not exists precipitation_probability_percent numeric(5, 2),
add column if not exists precipitation_amount_mm numeric(6, 2),
add column if not exists fishing_index_score numeric(5, 2),
add column if not exists fishing_index_grade text;

alter table public.catch_logs
drop constraint if exists catch_logs_address_not_blank,
add constraint catch_logs_address_not_blank check (
  address is null or char_length(btrim(address)) > 0
);

alter table public.catch_logs
drop constraint if exists catch_logs_region_name_not_blank,
add constraint catch_logs_region_name_not_blank check (
  region_name is null or char_length(btrim(region_name)) > 0
);

alter table public.catch_logs
drop constraint if exists catch_logs_captured_at_source_check,
add constraint catch_logs_captured_at_source_check check (
  captured_at_source is null
  or captured_at_source in ('photo_exif', 'device_time', 'manual', 'none')
);

alter table public.catch_logs
drop constraint if exists catch_logs_location_source_check,
add constraint catch_logs_location_source_check check (
  location_source is null
  or location_source in ('photo_exif', 'current_gps', 'map', 'manual', 'none')
);

alter table public.catch_logs
drop constraint if exists catch_logs_address_source_check,
add constraint catch_logs_address_source_check check (
  address_source is null
  or address_source in ('kakao_local', 'none')
);

alter table public.catch_logs
drop constraint if exists catch_logs_weather_source_check,
add constraint catch_logs_weather_source_check check (
  weather_source is null
  or weather_source in ('stored_weather', 'none')
);

alter table public.catch_logs
drop constraint if exists catch_logs_species_source_check,
add constraint catch_logs_species_source_check check (
  species_source is null
  or species_source in ('gemini', 'none')
);

alter table public.catch_logs
drop constraint if exists catch_logs_current_speed_range,
add constraint catch_logs_current_speed_range check (
  current_speed_kn is null or (current_speed_kn >= 0 and current_speed_kn <= 30)
);

alter table public.catch_logs
drop constraint if exists catch_logs_wind_direction_range,
add constraint catch_logs_wind_direction_range check (
  wind_direction_deg is null
  or (wind_direction_deg >= 0 and wind_direction_deg < 360)
);

alter table public.catch_logs
drop constraint if exists catch_logs_humidity_range,
add constraint catch_logs_humidity_range check (
  humidity_percent is null
  or (humidity_percent >= 0 and humidity_percent <= 100)
);

alter table public.catch_logs
drop constraint if exists catch_logs_precipitation_probability_range,
add constraint catch_logs_precipitation_probability_range check (
  precipitation_probability_percent is null
  or (
    precipitation_probability_percent >= 0
    and precipitation_probability_percent <= 100
  )
);

alter table public.catch_logs
drop constraint if exists catch_logs_precipitation_amount_non_negative,
add constraint catch_logs_precipitation_amount_non_negative check (
  precipitation_amount_mm is null or precipitation_amount_mm >= 0
);

alter table public.catch_logs
drop constraint if exists catch_logs_fishing_index_score_non_negative,
add constraint catch_logs_fishing_index_score_non_negative check (
  fishing_index_score is null or fishing_index_score >= 0
);

alter table public.catch_logs
drop constraint if exists catch_logs_fishing_index_grade_not_blank,
add constraint catch_logs_fishing_index_grade_not_blank check (
  fishing_index_grade is null or char_length(btrim(fishing_index_grade)) > 0
);

create index if not exists catch_logs_weather_forecast_id_idx
  on public.catch_logs (weather_forecast_id)
  where weather_forecast_id is not null;

create index if not exists catch_logs_weather_location_id_idx
  on public.catch_logs (weather_location_id)
  where weather_location_id is not null;

create index if not exists catch_logs_fishing_index_forecast_id_idx
  on public.catch_logs (fishing_index_forecast_id)
  where fishing_index_forecast_id is not null;

create index if not exists catch_logs_fishing_location_id_idx
  on public.catch_logs (fishing_location_id)
  where fishing_location_id is not null;

comment on column public.catch_logs.address is
  'Optional address auto-filled from a location provider or entered by the user.';

comment on column public.catch_logs.region_name is
  'Administrative region name used for future regional statistics.';

comment on column public.catch_logs.captured_at_source is
  'Source of the initially suggested catch timestamp.';

comment on column public.catch_logs.location_source is
  'Source of the initially suggested catch coordinate.';

comment on column public.catch_logs.weather_forecast_id is
  'Matched stored weather forecast row used to auto-fill catch environment.';

comment on column public.catch_logs.fishing_index_forecast_id is
  'Matched sea fishing index forecast row used to auto-fill marine fields.';
