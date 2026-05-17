alter table public.fishing_index_forecasts
add column if not exists fishing_type text not null default '갯바위';

alter table public.fishing_index_forecasts
drop constraint if exists fishing_index_forecasts_unique_slot,
drop constraint if exists fishing_index_forecasts_fishing_type_check;

alter table public.fishing_index_forecasts
add constraint fishing_index_forecasts_fishing_type_check check (
  fishing_type in ('갯바위', '선상')
);

alter table public.fishing_index_forecasts
add constraint fishing_index_forecasts_unique_slot unique (
  source,
  location_id,
  fishing_type,
  forecast_date,
  forecast_time
);
