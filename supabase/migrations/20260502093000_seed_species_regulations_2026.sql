with source_rows as (
  select *
  from (
    values
      ('우럭', 2, 'minimum_length', null, null, null, null, 23.0, null, '전장', null, null, '원문 어종: 조피볼락(Sebastes schlegelii)'),
      ('광어', 2, 'minimum_length', null, null, null, null, 35.0, null, '전장', null, null, '원문 어종: 넙치(Paralichthys olivaceus)'),
      ('도다리', 2, 'minimum_length', null, null, null, null, 20.0, null, '전장', null, null, '원문 어종: 문치가자미(Pleuronectes yokohamae)'),
      ('도다리', 2, 'closed_season', 12, 1, 1, 31, null, null, null, null, null, '원문 어종: 문치가자미(Pleuronectes yokohamae). 12월 1일부터 다음 해 1월 31일까지'),
      ('참돔', 2, 'minimum_length', null, null, null, null, 24.0, null, '전장', null, null, null),
      ('감성돔', 2, 'minimum_length', null, null, null, null, 25.0, null, '전장', null, null, null),
      ('감성돔', 2, 'closed_season', 5, 1, 5, 31, null, null, null, null, null, null),
      ('돌돔', 2, 'minimum_length', null, null, null, null, 24.0, null, '전장', null, null, null),
      ('농어', 2, 'minimum_length', null, null, null, null, 30.0, null, '전장', null, null, null),
      ('방어', 2, 'minimum_length', null, null, null, null, 30.0, null, '전장', null, null, null),
      ('고등어', 2, 'minimum_length', null, null, null, null, 21.0, null, '전장', null, null, '고등어 어획량 중 해당 체장의 고등어를 20퍼센트 미만으로 포획·채취하는 경우는 제외한다.'),
      ('고등어', 2, 'closed_season', 4, 1, 6, 30, null, null, null, null, null, '4월 1일부터 6월 30일까지의 기간 중 1개월의 범위에서 해양수산부장관이 정하여 고시하는 기간. 해당 기간 중 고등어를 어획량의 10퍼센트 미만으로 포획·채취하는 경우는 제외한다.'),
      ('갈치', 2, 'minimum_length', null, null, null, null, 18.0, null, '항문장', null, null, '갈치 어획량 중 해당 체장의 갈치를 20퍼센트 미만으로 포획·채취하는 경우는 제외한다.'),
      ('갈치', 2, 'closed_season', 7, 1, 7, 31, null, null, null, '북위 33도00분00초 이북 해역', '근해채낚기어업 및 연안복합어업 제외', '해당 구역에서 해당 기간 중 갈치를 어획량의 10퍼센트 미만으로 포획·채취하는 경우는 제외한다.'),
      ('볼락', 2, 'minimum_length', null, null, null, null, 15.0, null, '전장', null, null, null),
      ('쥐노래미', 2, 'minimum_length', null, null, null, null, 20.0, null, '전장', null, null, null),
      ('쥐노래미', 2, 'closed_season', 11, 1, 12, 31, null, null, null, null, null, '주 3)의 해역에서는 11월 15일부터 12월 14일까지로 한다.'),
      ('붕장어', 2, 'minimum_length', null, null, null, null, 35.0, null, '전장', null, null, null),
      ('문어', 2, 'minimum_weight', null, null, null, null, null, 600, '체중', null, null, '원문 어종: 대문어(Octopus dofleini)'),
      ('문어', 2, 'closed_season', 5, 16, 6, 30, null, null, null, null, null, '원문 어종: 참문어(Octopus vulgaris). 시·도지사가 5월 1일부터 9월 15일까지의 기간 중 46일 이상의 기간을 지역별로 따로 정하여 고시하는 경우에는 해당 기간으로 한다.'),
      ('삼치', 2, 'closed_season', 5, 1, 5, 31, null, null, null, null, null, null),
      ('쭈꾸미', 2, 'closed_season', 5, 11, 8, 31, null, null, null, null, null, '원문 어종: 주꾸미(Amphioctopus fangsiao)')
  ) as v(
    species_name,
    location_type,
    regulation_kind,
    period_start_month,
    period_start_day,
    period_end_month,
    period_end_day,
    min_length_cm,
    min_weight_g,
    measurement_basis,
    region_note,
    method_note,
    exception_note
  )
),
source_meta as (
  select
    '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)'::text as source_title,
    'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009'::text as source_url,
    '2026-01-01'::date as effective_from
)
delete from public.species_regulations sr
using source_meta sm
where sr.source_title = sm.source_title
  and sr.source_url = sm.source_url
  and sr.effective_from = sm.effective_from;

with source_rows as (
  select *
  from (
    values
      ('우럭', 2, 'minimum_length', null, null, null, null, 23.0, null, '전장', null, null, '원문 어종: 조피볼락(Sebastes schlegelii)'),
      ('광어', 2, 'minimum_length', null, null, null, null, 35.0, null, '전장', null, null, '원문 어종: 넙치(Paralichthys olivaceus)'),
      ('도다리', 2, 'minimum_length', null, null, null, null, 20.0, null, '전장', null, null, '원문 어종: 문치가자미(Pleuronectes yokohamae)'),
      ('도다리', 2, 'closed_season', 12, 1, 1, 31, null, null, null, null, null, '원문 어종: 문치가자미(Pleuronectes yokohamae). 12월 1일부터 다음 해 1월 31일까지'),
      ('참돔', 2, 'minimum_length', null, null, null, null, 24.0, null, '전장', null, null, null),
      ('감성돔', 2, 'minimum_length', null, null, null, null, 25.0, null, '전장', null, null, null),
      ('감성돔', 2, 'closed_season', 5, 1, 5, 31, null, null, null, null, null, null),
      ('돌돔', 2, 'minimum_length', null, null, null, null, 24.0, null, '전장', null, null, null),
      ('농어', 2, 'minimum_length', null, null, null, null, 30.0, null, '전장', null, null, null),
      ('방어', 2, 'minimum_length', null, null, null, null, 30.0, null, '전장', null, null, null),
      ('고등어', 2, 'minimum_length', null, null, null, null, 21.0, null, '전장', null, null, '고등어 어획량 중 해당 체장의 고등어를 20퍼센트 미만으로 포획·채취하는 경우는 제외한다.'),
      ('고등어', 2, 'closed_season', 4, 1, 6, 30, null, null, null, null, null, '4월 1일부터 6월 30일까지의 기간 중 1개월의 범위에서 해양수산부장관이 정하여 고시하는 기간. 해당 기간 중 고등어를 어획량의 10퍼센트 미만으로 포획·채취하는 경우는 제외한다.'),
      ('갈치', 2, 'minimum_length', null, null, null, null, 18.0, null, '항문장', null, null, '갈치 어획량 중 해당 체장의 갈치를 20퍼센트 미만으로 포획·채취하는 경우는 제외한다.'),
      ('갈치', 2, 'closed_season', 7, 1, 7, 31, null, null, null, '북위 33도00분00초 이북 해역', '근해채낚기어업 및 연안복합어업 제외', '해당 구역에서 해당 기간 중 갈치를 어획량의 10퍼센트 미만으로 포획·채취하는 경우는 제외한다.'),
      ('볼락', 2, 'minimum_length', null, null, null, null, 15.0, null, '전장', null, null, null),
      ('쥐노래미', 2, 'minimum_length', null, null, null, null, 20.0, null, '전장', null, null, null),
      ('쥐노래미', 2, 'closed_season', 11, 1, 12, 31, null, null, null, null, null, '주 3)의 해역에서는 11월 15일부터 12월 14일까지로 한다.'),
      ('붕장어', 2, 'minimum_length', null, null, null, null, 35.0, null, '전장', null, null, null),
      ('문어', 2, 'minimum_weight', null, null, null, null, null, 600, '체중', null, null, '원문 어종: 대문어(Octopus dofleini)'),
      ('문어', 2, 'closed_season', 5, 16, 6, 30, null, null, null, null, null, '원문 어종: 참문어(Octopus vulgaris). 시·도지사가 5월 1일부터 9월 15일까지의 기간 중 46일 이상의 기간을 지역별로 따로 정하여 고시하는 경우에는 해당 기간으로 한다.'),
      ('삼치', 2, 'closed_season', 5, 1, 5, 31, null, null, null, null, null, null),
      ('쭈꾸미', 2, 'closed_season', 5, 11, 8, 31, null, null, null, null, null, '원문 어종: 주꾸미(Amphioctopus fangsiao)')
  ) as v(
    species_name,
    location_type,
    regulation_kind,
    period_start_month,
    period_start_day,
    period_end_month,
    period_end_day,
    min_length_cm,
    min_weight_g,
    measurement_basis,
    region_note,
    method_note,
    exception_note
  )
),
source_meta as (
  select
    '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)'::text as source_title,
    'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009'::text as source_url,
    '2026-01-01'::date as effective_from
)
insert into public.species_regulations (
  species_id,
  regulation_kind,
  period_start_month,
  period_start_day,
  period_end_month,
  period_end_day,
  min_length_cm,
  min_weight_g,
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
  sr.regulation_kind::text,
  sr.period_start_month::smallint,
  sr.period_start_day::smallint,
  sr.period_end_month::smallint,
  sr.period_end_day::smallint,
  sr.min_length_cm::numeric(5, 1),
  sr.min_weight_g::integer,
  sr.measurement_basis::text,
  sr.region_note::text,
  sr.method_note::text,
  sr.exception_note::text,
  sm.source_title,
  sm.source_url,
  sm.effective_from
from source_rows sr
cross join source_meta sm
join public.fish_species fs
  on fs.name = sr.species_name
  and fs.location_type = sr.location_type::smallint;
