create table if not exists public.species_regulations (
  id bigint generated always as identity primary key,
  species_id integer not null references public.fish_species(id) on delete cascade,
  regulation_kind text not null check (
    regulation_kind in ('closed_season', 'minimum_length', 'minimum_weight')
  ),
  period_start_month smallint,
  period_start_day smallint,
  period_end_month smallint,
  period_end_day smallint,
  min_length_cm numeric(5, 1),
  min_weight_g integer,
  region_note text,
  method_note text,
  exception_note text,
  measurement_basis text,
  source_title text not null,
  source_url text not null,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint species_regulations_source_title_not_blank check (
    char_length(btrim(source_title)) > 0
  ),
  constraint species_regulations_source_url_not_blank check (
    char_length(btrim(source_url)) > 0
  ),
  constraint species_regulations_effective_range_check check (
    effective_to is null or effective_to >= effective_from
  ),
  constraint species_regulations_period_month_range check (
    (period_start_month is null or period_start_month between 1 and 12)
    and (period_end_month is null or period_end_month between 1 and 12)
  ),
  constraint species_regulations_period_day_range check (
    (period_start_day is null or period_start_day between 1 and 31)
    and (period_end_day is null or period_end_day between 1 and 31)
  ),
  constraint species_regulations_min_length_positive check (
    min_length_cm is null or min_length_cm > 0
  ),
  constraint species_regulations_min_weight_positive check (
    min_weight_g is null or min_weight_g > 0
  ),
  constraint species_regulations_value_shape_check check (
    (
      regulation_kind = 'closed_season'
      and period_start_month is not null
      and period_start_day is not null
      and period_end_month is not null
      and period_end_day is not null
      and min_length_cm is null
      and min_weight_g is null
    )
    or (
      regulation_kind = 'minimum_length'
      and period_start_month is null
      and period_start_day is null
      and period_end_month is null
      and period_end_day is null
      and min_length_cm is not null
      and min_weight_g is null
    )
    or (
      regulation_kind = 'minimum_weight'
      and period_start_month is null
      and period_start_day is null
      and period_end_month is null
      and period_end_day is null
      and min_length_cm is null
      and min_weight_g is not null
    )
  )
);

comment on table public.species_regulations is
  'Official closed season and minimum size/weight reference data by fish species.';

comment on column public.species_regulations.regulation_kind is
  'closed_season=금어기, minimum_length=금지체장, minimum_weight=금지체중';

alter table public.species_regulations enable row level security;

drop trigger if exists set_species_regulations_updated_at
on public.species_regulations;
create trigger set_species_regulations_updated_at
before update on public.species_regulations
for each row
execute function public.set_updated_at();

create index if not exists species_regulations_species_id_effective_from_idx
  on public.species_regulations (species_id, effective_from desc);

create index if not exists species_regulations_kind_idx
  on public.species_regulations (regulation_kind);

drop policy if exists "Anyone can view species regulations"
on public.species_regulations;
create policy "Anyone can view species regulations"
on public.species_regulations
for select
to anon, authenticated
using (true);
