drop index if exists public.catch_images_catch_log_id_idx;

create index if not exists catch_images_catch_log_id_user_id_idx
  on public.catch_images (catch_log_id, user_id);

create index if not exists catch_logs_location_type_id_idx
  on public.catch_logs (location_type_id);

create index if not exists catch_logs_species_id_idx
  on public.catch_logs (species_id)
  where species_id is not null;
