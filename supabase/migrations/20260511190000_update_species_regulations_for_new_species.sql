alter table public.species_regulations
  add column if not exists prohibited_length_min_cm numeric(5, 1),
  add column if not exists prohibited_length_max_cm numeric(5, 1);

alter table public.species_regulations
  drop constraint if exists species_regulations_regulation_kind_check,
  drop constraint if exists species_regulations_prohibited_length_range_positive,
  drop constraint if exists species_regulations_value_shape_check;

alter table public.species_regulations
  add constraint species_regulations_regulation_kind_check check (
    regulation_kind in (
      'closed_season',
      'minimum_length',
      'minimum_weight',
      'prohibited_length_range'
    )
  ),
  add constraint species_regulations_prohibited_length_range_positive check (
    prohibited_length_min_cm is null
    or (
      prohibited_length_min_cm > 0
      and prohibited_length_max_cm is not null
      and prohibited_length_max_cm > prohibited_length_min_cm
    )
  ),
  add constraint species_regulations_value_shape_check check (
    (
      regulation_kind = 'closed_season'
      and period_start_month is not null
      and period_start_day is not null
      and period_end_month is not null
      and period_end_day is not null
      and min_length_cm is null
      and min_weight_g is null
      and prohibited_length_min_cm is null
      and prohibited_length_max_cm is null
    )
    or (
      regulation_kind = 'minimum_length'
      and period_start_month is null
      and period_start_day is null
      and period_end_month is null
      and period_end_day is null
      and min_length_cm is not null
      and min_weight_g is null
      and prohibited_length_min_cm is null
      and prohibited_length_max_cm is null
    )
    or (
      regulation_kind = 'minimum_weight'
      and period_start_month is null
      and period_start_day is null
      and period_end_month is null
      and period_end_day is null
      and min_length_cm is null
      and min_weight_g is not null
      and prohibited_length_min_cm is null
      and prohibited_length_max_cm is null
    )
    or (
      regulation_kind = 'prohibited_length_range'
      and period_start_month is null
      and period_start_day is null
      and period_end_month is null
      and period_end_day is null
      and min_length_cm is null
      and min_weight_g is null
      and prohibited_length_min_cm is not null
      and prohibited_length_max_cm is not null
    )
  );

delete from public.species_regulations;

with source_rows as (
  select *
  from (
    values
      ('볼락', 2, 'minimum_length', null, null, null, null, 15.0, null, null, null, '전장', null, null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('우럭', 2, 'minimum_length', null, null, null, null, 23.0, null, null, null, '전장', null, null, '원문 어종: 조피볼락(Sebastes schlegelii)', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('광어', 2, 'minimum_length', null, null, null, null, 35.0, null, null, null, '전장', null, null, '원문 어종: 넙치(Paralichthys olivaceus)', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('농어', 2, 'minimum_length', null, null, null, null, 30.0, null, null, null, '전장', null, null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('참돔', 2, 'minimum_length', null, null, null, null, 24.0, null, null, null, '전장', null, null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('감성돔', 2, 'minimum_length', null, null, null, null, 25.0, null, null, null, '전장', null, null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('감성돔', 2, 'closed_season', 5, 1, 5, 31, null, null, null, null, null, null, null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('도다리', 2, 'minimum_length', null, null, null, null, 20.0, null, null, null, '전장', null, null, '원문 어종: 문치가자미(Pleuronectes yokohamae)', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('도다리', 2, 'closed_season', 12, 1, 1, 31, null, null, null, null, null, null, null, '원문 어종: 문치가자미(Pleuronectes yokohamae). 12월 1일부터 다음 해 1월 31일까지', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('방어', 2, 'minimum_length', null, null, null, null, 30.0, null, null, null, '전장', null, null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('고등어', 2, 'minimum_length', null, null, null, null, 21.0, null, null, null, '전장', null, null, '고등어 어획량 중 해당 체장의 고등어를 20퍼센트 미만으로 포획·채취하는 경우는 제외한다.', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('고등어', 2, 'closed_season', 4, 1, 6, 30, null, null, null, null, null, null, null, '4월 1일부터 6월 30일까지의 기간 중 1개월의 범위에서 해양수산부장관이 정하여 고시하는 기간. 해당 기간 중 고등어를 어획량의 10퍼센트 미만으로 포획·채취하는 경우는 제외한다.', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('갈치', 2, 'minimum_length', null, null, null, null, 18.0, null, null, null, '항문장', null, null, '갈치 어획량 중 해당 체장의 갈치를 20퍼센트 미만으로 포획·채취하는 경우는 제외한다.', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('갈치', 2, 'closed_season', 7, 1, 7, 31, null, null, null, null, null, '북위 33도00분00초 이북 해역', '근해채낚기어업 및 연안복합어업 제외', '해당 구역에서 해당 기간 중 갈치를 어획량의 10퍼센트 미만으로 포획·채취하는 경우는 제외한다.', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('전어', 2, 'closed_season', 5, 1, 7, 15, null, null, null, null, null, '강원특별자치도 및 경상북도 제외', null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('붕장어', 2, 'minimum_length', null, null, null, null, 35.0, null, null, null, '전장', null, null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('문어', 2, 'minimum_weight', null, null, null, null, null, 600, null, null, '체중', null, null, '원문 어종: 대문어(Octopus dofleini)', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('문어', 2, 'closed_season', 5, 16, 6, 30, null, null, null, null, null, null, null, '원문 어종: 참문어(Octopus vulgaris). 시·도지사가 5월 1일부터 9월 15일까지의 기간 중 46일 이상의 기간을 지역별로 따로 정하여 고시하는 경우에는 해당 기간으로 한다.', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('삼치', 2, 'closed_season', 5, 1, 5, 31, null, null, null, null, null, null, null, null, '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('쭈꾸미', 2, 'closed_season', 5, 11, 8, 31, null, null, null, null, null, null, null, '원문 어종: 주꾸미(Amphioctopus fangsiao)', '해양수산부 수산자원의 금어기·금지체장 기준(2026.1.1.)', 'https://www.mof.go.kr/doc/ko/selectDoc.do?bbsSeq=22&docSeq=64389&menuSeq=1009', '2026-01-01'::date),
      ('쏘가리', 1, 'closed_season', 4, 20, 5, 30, null, null, null, null, null, '전라북도, 전라남도, 경상북도 및 경상남도', null, '댐·호소에서는 5월 10일부터 6월 20일까지로 한다.', '국가법령정보센터 내수면어업법 시행령 [별표 1](2026.3.24. 시행)', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lspttninfSeq=71122', '2026-03-24'::date),
      ('쏘가리', 1, 'closed_season', 5, 1, 6, 10, null, null, null, null, null, '전라북도, 전라남도, 경상북도 및 경상남도를 제외한 모든 지역', null, '댐·호소에서는 5월 20일부터 6월 30일까지로 한다.', '국가법령정보센터 내수면어업법 시행령 [별표 1](2026.3.24. 시행)', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lspttninfSeq=71122', '2026-03-24'::date),
      ('쏘가리', 1, 'minimum_length', null, null, null, null, 18.0, null, null, null, '전장', null, null, null, '국가법령정보센터 내수면어업법 시행령 [별표 1](2026.3.24. 시행)', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lspttninfSeq=71122', '2026-03-24'::date),
      ('민물장어', 1, 'closed_season', 10, 1, 3, 31, null, null, null, null, null, '전국. 다만, 댐·호소 제외', null, '원문 어종: 뱀장어(Anguilla japonica). 수산종자로 사용되는 15cm 미만 뱀장어는 금지기간에도 포획할 수 있다.', '국가법령정보센터 내수면어업법 시행령 [별표 1](2026.3.24. 시행)', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lspttninfSeq=71122', '2026-03-24'::date),
      ('민물장어', 1, 'prohibited_length_range', null, null, null, null, null, null, 15.0, 45.0, '전장', null, null, '원문 어종: 뱀장어(Anguilla japonica)', '국가법령정보센터 내수면어업법 시행령 [별표 1](2026.3.24. 시행)', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lspttninfSeq=71122', '2026-03-24'::date),
      ('무지개송어', 1, 'minimum_length', null, null, null, null, 12.0, null, null, null, '전장', null, null, '원문 어종: 송어. 앱 어종명은 무지개송어로 매핑했다.', '국가법령정보센터 내수면어업법 시행령 [별표 1](2026.3.24. 시행)', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lspttninfSeq=71122', '2026-03-24'::date),
      ('산천어', 1, 'minimum_length', null, null, null, null, 20.0, null, null, null, '전장', null, null, null, '국가법령정보센터 내수면어업법 시행령 [별표 1](2026.3.24. 시행)', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lspttninfSeq=71122', '2026-03-24'::date)
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
  sr.regulation_kind::text,
  sr.period_start_month::smallint,
  sr.period_start_day::smallint,
  sr.period_end_month::smallint,
  sr.period_end_day::smallint,
  sr.min_length_cm::numeric(5, 1),
  sr.min_weight_g::integer,
  sr.prohibited_length_min_cm::numeric(5, 1),
  sr.prohibited_length_max_cm::numeric(5, 1),
  sr.measurement_basis::text,
  sr.region_note::text,
  sr.method_note::text,
  sr.exception_note::text,
  sr.source_title::text,
  sr.source_url::text,
  sr.effective_from::date
from source_rows sr
join public.fish_species fs
  on fs.name = sr.species_name
  and fs.location_type = sr.location_type::smallint;
