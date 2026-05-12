begin;

update public.catch_logs
set species_id = null
where species_id is not null;

update public.ai_species_predictions
set selected_species_id = null
where selected_species_id is not null;

delete from public.fish_species;

insert into public.fish_species (id, location_type, name)
values
  (1, 2, '볼락'),
  (2, 2, '우럭'),
  (3, 2, '광어'),
  (4, 2, '농어'),
  (5, 2, '참돔'),
  (6, 2, '감성돔'),
  (7, 2, '벵에돔'),
  (8, 2, '도다리'),
  (9, 2, '강도다리'),
  (10, 2, '방어'),
  (11, 2, '부시리'),
  (12, 2, '전갱이'),
  (13, 2, '양태 / 장대'),
  (14, 2, '붉바리'),
  (15, 2, '성대'),
  (16, 2, '고등어'),
  (17, 2, '갈치'),
  (18, 2, '전어'),
  (19, 2, '붕장어'),
  (20, 2, '삼치'),
  (21, 2, '쭈꾸미'),
  (22, 2, '갑오징어'),
  (23, 2, '무늬오징어'),
  (24, 2, '문어'),
  (25, 1, '붕어'),
  (26, 1, '잉어'),
  (27, 1, '향어'),
  (28, 1, '배스'),
  (29, 1, '블루길'),
  (30, 1, '쏘가리'),
  (31, 1, '꺽지'),
  (32, 1, '가물치'),
  (33, 1, '강준치'),
  (34, 1, '끄리'),
  (35, 1, '메기'),
  (36, 1, '민물장어'),
  (37, 1, '무지개송어'),
  (38, 1, '산천어');

select setval(
  pg_get_serial_sequence('public.fish_species', 'id'),
  greatest((select max(id) from public.fish_species), 1),
  true
);

commit;
