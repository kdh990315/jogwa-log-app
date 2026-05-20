create unique index if not exists weather_forecasts_unique_grid_slot_idx
  on public.weather_forecasts (
    source,
    kma_nx,
    kma_ny,
    forecast_date,
    forecast_time
  );
