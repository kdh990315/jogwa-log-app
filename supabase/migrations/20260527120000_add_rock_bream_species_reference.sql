insert into public.fish_species (
  location_type,
  name
)
values (
  2,
  '돌돔'
)
on conflict (name, location_type) do nothing;

insert into public.ai_species_references (
  location_type,
  name,
  scientific_name,
  identification_notes,
  source_title,
  source_url
)
values (
  2,
  '돌돔',
  'Oplegnathus fasciatus',
  array[
    '몸이 높고 좌우로 납작한 돔류 체형이며 몸 옆면에 검은 세로띠가 반복되면 돌돔을 우선 후보로 본다.',
    '어린 개체는 세로띠가 뚜렷하고 성장한 개체는 줄무늬가 흐려질 수 있으므로 두꺼운 입과 체형을 함께 비교한다.',
    '감성돔, 벵에돔, 참돔과 혼동될 수 있으므로 체고, 입 모양, 체측 세로띠 유무를 함께 확인한다.'
  ],
  '국립해양생물자원관 MBRIS',
  'https://www.mbris.kr/pub/marine/tsearch/tsearchDetail.do?spcTxnId=270000012286'
)
on conflict (name, location_type) do update
set
  scientific_name = excluded.scientific_name,
  identification_notes = excluded.identification_notes,
  source_title = excluded.source_title,
  source_url = excluded.source_url,
  is_active = true;

insert into public.species_regulations (
  species_id,
  regulation_kind,
  period_start_month,
  period_start_day,
  period_end_month,
  period_end_day,
  min_length_cm,
  min_weight_g,
  prohibited_length_min_cm,
  prohibited_length_max_cm,
  measurement_basis,
  region_note,
  method_note,
  exception_note,
  source_title,
  source_url,
  effective_from
)
select
  fs.id,
  'minimum_length',
  null,
  null,
  null,
  null,
  24.0,
  null,
  null,
  null,
  '전장',
  null,
  null,
  null,
  '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)',
  'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009',
  '2026-01-01'::date
from public.fish_species fs
where fs.name = '돌돔'
  and fs.location_type = 2
  and not exists (
    select 1
    from public.species_regulations sr
    where sr.species_id = fs.id
      and sr.regulation_kind = 'minimum_length'
      and sr.effective_from = '2026-01-01'::date
      and sr.min_length_cm = 24.0
  );
