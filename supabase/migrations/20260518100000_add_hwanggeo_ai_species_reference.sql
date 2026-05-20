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
  '황어',
  'Tribolodon hakonensis',
  array[
    '동해안 하구와 연안에서 보이는 은백색 잉어과 체형이며 주둥이가 비교적 뾰족하면 황어를 후보로 본다.',
    '산란기에는 몸 측면과 지느러미 일부에 적황색 또는 주황색 세로 띠가 나타날 수 있으므로 이 무늬가 보이면 황어 가능성을 높인다.',
    '숭어, 전어, 강준치처럼 길쭉한 은색 어종과 혼동될 수 있으므로 입 모양, 큰 비늘, 몸 측면의 주황색 띠 유무를 함께 비교한다.'
  ],
  '국립생물자원관 한반도의 생물다양성',
  'https://species.nibr.go.kr/home/mainHome.do?contCd=009002&ktsn=120000057642'
)
on conflict (name, location_type) do update
set
  scientific_name = excluded.scientific_name,
  identification_notes = excluded.identification_notes,
  source_title = excluded.source_title,
  source_url = excluded.source_url,
  is_active = true;
