alter table public.fishing_index_forecasts
add column if not exists target_species_name text not null default '미분류';

update public.fishing_index_forecasts
set target_species_name = coalesce(
  nullif(btrim(raw_payload ->> 'seafsTgfshNm'), ''),
  '미분류'
);

alter table public.fishing_index_forecasts
drop constraint if exists fishing_index_forecasts_unique_slot,
drop constraint if exists fishing_index_forecasts_target_species_name_not_blank;

alter table public.fishing_index_forecasts
add constraint fishing_index_forecasts_target_species_name_not_blank check (
  char_length(btrim(target_species_name)) > 0
);

alter table public.fishing_index_forecasts
add constraint fishing_index_forecasts_unique_slot unique (
  source,
  location_id,
  fishing_type,
  target_species_name,
  forecast_date,
  forecast_time
);

comment on column public.fishing_index_forecasts.target_species_name is
  'Provider target species name for sea fishing index forecasts.';
