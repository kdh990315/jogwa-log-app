do $$
begin
  if exists (
    select 1
    from public.fish_species
    where id = 12
      and location_type = 2
      and name = '전갱이'
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.fish_species
    where location_type = 2
      and name = '전갱이'
  ) then
    raise exception 'fish_species already contains 전갱이 with an id other than 12';
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
  where id >= 12;

  update public.fish_species
  set id = abs(id) + 1
  where id <= -12;

  insert into public.fish_species (id, location_type, name)
  values (12, 2, '전갱이');
end;
$$;

select setval(
  pg_get_serial_sequence('public.fish_species', 'id'),
  greatest((select max(id) from public.fish_species), 1),
  true
);
