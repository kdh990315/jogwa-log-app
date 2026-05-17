drop index if exists public.fishing_locations_source_external_location_id_key;

alter table public.fishing_locations
drop constraint if exists fishing_locations_external_location_id_not_blank;

alter table public.fishing_locations
alter column external_location_id set not null;

alter table public.fishing_locations
add constraint fishing_locations_source_external_location_id_key unique (
  source,
  external_location_id
);

alter table public.fishing_locations
add constraint fishing_locations_external_location_id_not_blank check (
  char_length(btrim(external_location_id)) > 0
);
