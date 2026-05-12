update public.catch_logs cl
set species_id = fs.id
from public.fish_species fs
where cl.species_id is null
  and cl.location_type_id = fs.location_type
  and cl.species_name = fs.name;

update public.catch_logs cl
set
  species_id = fs.id,
  species_name = fs.name
from public.fish_species fs
where cl.species_id is null
  and cl.location_type_id = 1
  and cl.species_name = '장어'
  and fs.location_type = 1
  and fs.name = '민물장어';

update public.ai_species_predictions asp
set candidates = coalesce(updated_candidates.candidates, '[]'::jsonb)
from (
  select
    prediction.id,
    jsonb_agg(
      case
        when fs.id is not null then
          jsonb_set(candidate.value, '{speciesId}', to_jsonb(fs.id), true)
        else
          jsonb_set(candidate.value, '{speciesId}', 'null'::jsonb, true)
      end
      order by candidate.ordinality
    ) as candidates
  from public.ai_species_predictions prediction
  cross join lateral jsonb_array_elements(prediction.candidates)
    with ordinality as candidate(value, ordinality)
  left join public.fish_species fs
    on fs.name = candidate.value->>'speciesName'
  where jsonb_typeof(prediction.candidates) = 'array'
  group by prediction.id
) as updated_candidates
where asp.id = updated_candidates.id;
