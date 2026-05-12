alter table public.catch_logs
  drop constraint if exists catch_logs_species_id_fkey;

alter table public.ai_species_predictions
  drop constraint if exists ai_species_predictions_selected_species_id_fkey;

alter table public.species_regulations
  drop constraint if exists species_regulations_species_id_fkey;

do $$
begin
  if exists (
    select 1
    from public.fish_species
    where id = 20
      and location_type = 2
      and name = '강도다리'
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.fish_species
    where location_type = 2
      and name = '강도다리'
  ) then
    raise exception 'fish_species already contains 강도다리 with an id other than 20';
  end if;

  if exists (
    select 1
    from public.fish_species
    where id < 0
  ) then
    raise exception 'fish_species contains negative ids; cannot safely renumber with temporary negative ids';
  end if;

  update public.fish_species
  set id = -id
  where id >= 20;

  update public.catch_logs
  set species_id = -species_id
  where species_id >= 20;

  update public.ai_species_predictions
  set selected_species_id = -selected_species_id
  where selected_species_id >= 20;

  update public.species_regulations
  set species_id = -species_id
  where species_id >= 20;

  update public.fish_species
  set id = abs(id) + 1
  where id <= -20;

  update public.catch_logs
  set species_id = abs(species_id) + 1
  where species_id <= -20;

  update public.ai_species_predictions
  set selected_species_id = abs(selected_species_id) + 1
  where selected_species_id <= -20;

  update public.species_regulations
  set species_id = abs(species_id) + 1
  where species_id <= -20;

  insert into public.fish_species (id, location_type, name)
  values (20, 2, '강도다리');
end;
$$;

alter table public.catch_logs
  add constraint catch_logs_species_id_fkey
  foreign key (species_id)
  references public.fish_species(id)
  on update cascade
  on delete set null;

alter table public.ai_species_predictions
  add constraint ai_species_predictions_selected_species_id_fkey
  foreign key (selected_species_id)
  references public.fish_species(id)
  on update cascade
  on delete set null;

alter table public.species_regulations
  add constraint species_regulations_species_id_fkey
  foreign key (species_id)
  references public.fish_species(id)
  on update cascade
  on delete cascade;

select setval(
  pg_get_serial_sequence('public.fish_species', 'id'),
  greatest((select max(id) from public.fish_species), 1),
  true
);
