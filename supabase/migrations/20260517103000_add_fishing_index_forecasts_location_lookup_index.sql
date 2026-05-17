create index if not exists fishing_index_forecasts_location_lookup_idx
on public.fishing_index_forecasts (
  location_id,
  forecast_date,
  forecast_time,
  fishing_type,
  target_species_name
);
