alter table public.catch_logs
add column if not exists air_temp_c numeric(4, 1),
add column if not exists water_temp_c numeric(4, 1),
add column if not exists wind_speed_ms numeric(5, 2),
add column if not exists wave_height_m numeric(4, 2);

alter table public.catch_logs
drop constraint if exists catch_logs_air_temp_range,
add constraint catch_logs_air_temp_range check (
  air_temp_c is null or (air_temp_c >= -80 and air_temp_c <= 80)
);

alter table public.catch_logs
drop constraint if exists catch_logs_water_temp_range,
add constraint catch_logs_water_temp_range check (
  water_temp_c is null or (water_temp_c >= -5 and water_temp_c <= 45)
);

alter table public.catch_logs
drop constraint if exists catch_logs_wind_speed_range,
add constraint catch_logs_wind_speed_range check (
  wind_speed_ms is null or (wind_speed_ms >= 0 and wind_speed_ms <= 100)
);

alter table public.catch_logs
drop constraint if exists catch_logs_wave_height_range,
add constraint catch_logs_wave_height_range check (
  wave_height_m is null or (wave_height_m >= 0 and wave_height_m <= 30)
);

comment on column public.catch_logs.air_temp_c is
  'Optional air temperature in Celsius at catch time, manually entered or auto-filled from weather data.';

comment on column public.catch_logs.water_temp_c is
  'Optional water temperature in Celsius at catch time, manually entered or auto-filled from marine/weather data.';

comment on column public.catch_logs.wind_speed_ms is
  'Optional wind speed in meters per second at catch time.';

comment on column public.catch_logs.wave_height_m is
  'Optional wave height in meters at catch time.';
