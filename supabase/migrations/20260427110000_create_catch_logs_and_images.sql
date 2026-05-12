create table if not exists public.catch_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  fishing_date date not null,
  location_type_id smallint not null references public.location_types(id),
  species_id integer references public.fish_species(id) on delete set null,
  species_name text not null,
  count integer not null,
  size_cm numeric(5, 1),
  tide text,
  weather text,
  point_name text,
  latitude double precision,
  longitude double precision,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catch_logs_id_user_id_key unique (id, user_id),
  constraint catch_logs_species_name_not_blank check (char_length(btrim(species_name)) > 0),
  constraint catch_logs_count_non_negative check (count >= 0),
  constraint catch_logs_size_positive check (size_cm is null or size_cm > 0),
  constraint catch_logs_size_requires_positive_count check (count > 0 or size_cm is null),
  constraint catch_logs_latitude_range check (
    latitude is null or (latitude >= -90 and latitude <= 90)
  ),
  constraint catch_logs_longitude_range check (
    longitude is null or (longitude >= -180 and longitude <= 180)
  ),
  constraint catch_logs_coordinates_together check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  )
);

create table if not exists public.catch_images (
  id bigint generated always as identity primary key,
  catch_log_id bigint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0,
  mime_type text,
  width_px integer,
  height_px integer,
  file_size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catch_images_catch_log_user_fk
    foreign key (catch_log_id, user_id)
    references public.catch_logs(id, user_id)
    on delete cascade,
  constraint catch_images_storage_path_not_blank check (
    char_length(btrim(storage_path)) > 0
  ),
  constraint catch_images_sort_order_non_negative check (sort_order >= 0),
  constraint catch_images_width_positive check (width_px is null or width_px > 0),
  constraint catch_images_height_positive check (height_px is null or height_px > 0),
  constraint catch_images_file_size_non_negative check (
    file_size_bytes is null or file_size_bytes >= 0
  )
);

alter table public.catch_logs enable row level security;
alter table public.catch_images enable row level security;

drop trigger if exists set_catch_logs_updated_at on public.catch_logs;
create trigger set_catch_logs_updated_at
before update on public.catch_logs
for each row
execute function public.set_updated_at();

drop trigger if exists set_catch_images_updated_at on public.catch_images;
create trigger set_catch_images_updated_at
before update on public.catch_images
for each row
execute function public.set_updated_at();

create index if not exists catch_logs_user_id_fishing_date_idx
  on public.catch_logs (user_id, fishing_date desc);

create index if not exists catch_logs_user_id_location_type_id_fishing_date_idx
  on public.catch_logs (user_id, location_type_id, fishing_date desc);

create index if not exists catch_logs_user_id_species_id_idx
  on public.catch_logs (user_id, species_id)
  where species_id is not null;

create index if not exists catch_images_catch_log_id_idx
  on public.catch_images (catch_log_id);

create index if not exists catch_images_user_id_idx
  on public.catch_images (user_id);

create index if not exists fish_species_location_type_idx
  on public.fish_species (location_type);

drop policy if exists "Users can manage own catch logs" on public.catch_logs;
create policy "Users can manage own catch logs"
on public.catch_logs
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own catch images" on public.catch_images;
create policy "Users can manage own catch images"
on public.catch_images
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'catch-images',
  'catch-images',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own catch image objects" on storage.objects;
create policy "Users can read own catch image objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

drop policy if exists "Users can upload own catch image objects" on storage.objects;
create policy "Users can upload own catch image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

drop policy if exists "Users can update own catch image objects" on storage.objects;
create policy "Users can update own catch image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
)
with check (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

drop policy if exists "Users can delete own catch image objects" on storage.objects;
create policy "Users can delete own catch image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

grant usage on schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
