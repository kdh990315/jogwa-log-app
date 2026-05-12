create table if not exists public.ai_species_predictions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  catch_log_id bigint,
  image_storage_path text not null,
  model text not null,
  water_type text,
  candidates jsonb not null,
  selected_species_id integer references public.fish_species(id) on delete set null,
  usage_metadata jsonb,
  created_at timestamptz not null default now(),
  constraint ai_species_predictions_catch_log_user_fk
    foreign key (catch_log_id, user_id)
    references public.catch_logs(id, user_id)
    on delete cascade,
  constraint ai_species_predictions_image_storage_path_not_blank check (
    char_length(btrim(image_storage_path)) > 0
  ),
  constraint ai_species_predictions_model_not_blank check (
    char_length(btrim(model)) > 0
  ),
  constraint ai_species_predictions_water_type_check check (
    water_type is null or water_type in ('saltwater', 'freshwater')
  ),
  constraint ai_species_predictions_candidates_array_check check (
    jsonb_typeof(candidates) = 'array'
  )
);

alter table public.ai_species_predictions enable row level security;

create index if not exists ai_species_predictions_user_id_created_at_idx
  on public.ai_species_predictions (user_id, created_at desc);

create index if not exists ai_species_predictions_catch_log_id_idx
  on public.ai_species_predictions (catch_log_id)
  where catch_log_id is not null;

create index if not exists ai_species_predictions_selected_species_id_idx
  on public.ai_species_predictions (selected_species_id)
  where selected_species_id is not null;

drop policy if exists "Users can manage own AI species predictions"
on public.ai_species_predictions;
create policy "Users can manage own AI species predictions"
on public.ai_species_predictions
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
