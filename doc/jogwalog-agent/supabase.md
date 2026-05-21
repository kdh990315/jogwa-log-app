# Supabase 백엔드

어장관리의 백엔드는 Supabase를 사용한다.

## 사용 범위

- Supabase Auth: 카카오, 애플, 구글 로그인과 사용자 세션 관리
- Supabase Postgres: 조과 기록, 이미지 메타데이터, 어종, 위치, 통계 기반 데이터 저장
- Supabase Storage: 조과 이미지 저장. 도감 일러스트 저장 여부는 이미지 최적화 후 결정
- Supabase Edge Functions: Gemini 3.1 AI 어종 판별처럼 비밀 키가 필요한 서버 작업

## 보안 원칙

- Supabase anon key는 클라이언트에 둘 수 있지만, RLS가 올바르게 설정되어 있다는 전제가 필요하다.
- 모바일 앱에 Supabase service role key를 넣지 않는다.
- 모바일 앱에 Gemini API key를 넣지 않는다.
- Gemini 3.1 호출은 Supabase Edge Function에서 처리한다.
- 사용자 개인 데이터 테이블에는 Row Level Security를 반드시 활성화한다.
- 사용자별 데이터는 `user_id = auth.uid()` 기준으로 접근을 제한한다.
- RLS 정책 없이 클라이언트에서만 `user_id`로 필터링하는 방식은 금지한다.

## 권장 테이블

```text
profiles
catch_logs
catch_images
fish_species
species_regulations
species_illustrations
fishing_locations
ai_species_predictions
```

## 권장 관계

- `profiles.id`는 Supabase Auth의 `auth.users.id`를 참조한다.
- `catch_logs.user_id`는 `profiles.id`를 참조한다.
- `catch_images.catch_log_id`는 `catch_logs.id`를 참조한다.
- `catch_logs.species_id`는 가능하면 `fish_species.id`를 참조한다.
- `species_regulations.species_id`는 `fish_species.id`를 참조한다.
- `species_illustrations.species_id`는 `fish_species.id`를 참조한다.
- `ai_species_predictions.catch_log_id`는 필요 시 `catch_logs.id`를 참조한다.

## 도감 일러스트 저장 방식

도감 일러스트를 앱에 번들할지, Supabase Storage에서 불러올지는 이미지 최적화 후 결정한다.

결정 전까지 유지할 기준:

- 도감 해금은 `catch_logs.species_id` 기준으로 판단한다.
- AI 판별 후보만으로 도감을 해금하지 않는다.
- 도감 일러스트는 조과 사진과 분리해서 관리한다.
- DB에는 최소한 `species_id`와 일러스트 식별자를 연결할 수 있는 구조를 둔다.
- 일러스트 이미지의 출처와 라이선스는 구현 전에 확인한다.

## RLS 기본 방향

```sql
alter table catch_logs enable row level security;

create policy "Users can manage own catch logs"
on catch_logs
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

## 인덱스 기본 방향

- 외래키 컬럼은 직접 인덱스를 만든다. Postgres는 foreign key에 자동으로 인덱스를 만들지 않는다.
- 내 조과 목록은 `user_id`, `fishing_date` 기준 조회가 많으므로 복합 인덱스를 고려한다.
- 통계용 조회는 `user_id + tide`, `user_id + species`, `user_id + weather`, `user_id + fishing_date` 패턴을 기준으로 설계한다.
- 도감 조회는 사용자가 잡은 `species_id` 목록과 `fish_species`, `species_illustrations` join 패턴을 기준으로 설계한다.
- 실제 쿼리가 생기기 전부터 모든 조합의 인덱스를 만들지 않는다. MVP에서는 핵심 목록/상세/통계 후보 쿼리만 기준으로 만든다.

예시:

```sql
create index catch_logs_user_id_fishing_date_idx
on catch_logs (user_id, fishing_date desc);

create index catch_images_catch_log_id_idx
on catch_images (catch_log_id);
```

## 마이그레이션 규칙

- DB schema 변경은 가능하면 `supabase/migrations/`에 SQL migration으로 남긴다.
- Supabase Dashboard에서 임시로 바꾼 설정은 나중에 migration 또는 문서로 반드시 반영한다.
- 테이블을 만들 때 primary key, foreign key, not null, check constraint를 함께 검토한다.
- 사용자 개인 데이터 테이블을 만들면 RLS policy까지 같은 작업 범위에서 만든다.
- FK 컬럼을 추가하면 해당 FK 인덱스가 필요한지 확인한다.
- 통계용 컬럼은 나중에 문자열 파싱이 필요하지 않도록 구조화된 타입으로 저장한다.

## 인증 규칙

- 인증은 Supabase Auth를 기준으로 한다.
- 카카오, 애플, 구글 로그인을 지원한다.
- Supabase session은 안전한 저장소를 사용한다. Expo 환경에서 필요한 경우 SecureStore 기반 storage adapter를 사용한다.
- 로그아웃 시 Supabase session과 auth query cache를 함께 정리한다.
- 인증 가드는 `user.id`만 보지 말고 session loading 상태도 고려한다.
- 로그인 성공 후 `profiles` row가 없으면 생성하거나 onboarding 흐름으로 보낸다.
- 로그인 성공 후 현재 사용자 profile query를 refresh 또는 invalidate한다.
- 회원 탈퇴는 `profiles.status = 'pending_deletion'`으로 즉시 비활성화하고, 30일 복구 기간 후 purge Edge Function에서 Storage 객체와 Auth user를 영구 삭제한다.
- 탈퇴 대기 계정은 개인 조과 데이터와 Storage 객체에 접근할 수 없도록 RLS에서 active profile 조건을 확인한다.

인증 정책:

- access token 저장 위치: expo-secure-store
- refresh token 사용 여부: 백엔드 스펙 확정 후 결정
- 비로그인 접근 가능 화면: 로그인 화면, 약관/개인정보 화면
- 로그인 후 이동 화면: 내 조과 목록 또는 홈 화면
- 로그인 제공자: 카카오, 애플, 구글

## API 서버 정보

- 백엔드: Supabase
- 개발 Supabase project URL: 아직 미정
- 운영 Supabase project URL: 아직 미정
- 인증 방식: Supabase Auth 기반 카카오, 애플, 구글 로그인
- DB: Supabase Postgres
- 이미지 저장소: Supabase Storage
- 서버 함수: Supabase Edge Functions
- 공통 error 처리: Supabase error를 API/service 함수에서 앱 에러 메시지로 변환

## 외부 연동

- 카카오 로그인: Supabase Auth provider 또는 OAuth 연동 방식 사용
- 애플 로그인: Supabase Auth provider 사용
- 구글 로그인: Supabase Auth provider 사용
- 카카오지도: 위치 검색과 좌표 저장
- Gemini 3.1 AI: Supabase Edge Function에서 이미지 기반 어종 판별

외부 연동 API는 컴포넌트에서 직접 호출하지 않는다. 반드시 `api/`, Supabase Edge Function, 또는 전용 service/helper 계층으로 감싼 뒤 hook에서 사용한다.
