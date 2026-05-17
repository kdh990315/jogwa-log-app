drop index if exists public.fishing_index_forecasts_species_date_idx;

alter table public.fishing_index_forecasts
drop constraint if exists fishing_index_forecasts_unique_slot,
drop constraint if exists fishing_index_forecasts_target_species_name_not_blank;

alter table public.fishing_index_forecasts
drop column if exists target_species_id,
drop column if exists target_species_name;

alter table public.fishing_index_forecasts
add constraint fishing_index_forecasts_unique_slot unique (
  source,
  location_id,
  forecast_date,
  forecast_time
);
