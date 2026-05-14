# 조과로그 리팩토링 로드맵

이 문서는 현재 조과로그 앱을 단계적으로 정리하기 위한 실행 계획이다.

기준 문서:

- 코드 스타일 기준: `doc/code-style-examples/community-code-style-refactor-guide.md`
- 아키텍처 기준: `doc/jogwalog-agent/architecture.md`
- 코드 규칙: `doc/jogwalog-agent/coding-conventions.md`
- Supabase 기준: `doc/jogwalog-agent/supabase.md`
- MVP 범위: `doc/jogwalog-agent/mvp-scope.md`

## 리팩토링 목표

1차 목표는 화면을 보기 좋게 줄이는 것이 아니라, 조과 등록 MVP의 데이터 무결성과 유지보수성을 회복하는 것이다.

우선순위:

```text
저장/수정/삭제 데이터 무결성
  -> AI 판별 결과와 조과 등록 연결
  -> 도메인 값과 표시 값 분리
  -> 조과 등록 화면 책임 분리
  -> 목록/홈/도감 조회 구조 정리
  -> 반복 UI와 스타일 정리
```

## 진행 상태

2026-05-13 기준:

- Phase 0. Checkpoint 정리: 완료
- Phase 1. 조과 저장 흐름 안정화: 완료
- Phase 2. AI 판별 결과와 조과 등록 연결: 완료
- Phase 3. 조과 도메인 값과 표시 값 분리: 완료
- Phase 4. 조과 등록 화면 분리: 완료
- Phase 5. AI 분석 화면 분리: 완료
- Phase 6. 목록, 홈, 도감 조회 구조 정리: 대기
- Phase 7. 공통 UI와 스타일 정리: 대기

## 작업 원칙

- 한 브랜치에서는 하나의 문제 축만 다룬다.
- 기능 변경, 리팩토링, 포맷팅, 의존성 업그레이드를 섞지 않는다.
- 화면 파일을 줄이기 전에 저장 흐름과 타입 경계를 먼저 안정화한다.
- 화면 컴포넌트에서 Supabase client를 직접 호출하지 않는다.
- `api/`는 Supabase 요청과 row-to-domain mapping을 책임진다.
- `hooks/queries/`는 cache invalidate, optimistic update, rollback 같은 서버 상태 규칙을 책임진다.
- 화면은 route param 처리, FormProvider, submit 연결, Alert/navigation 같은 UX 조립에 집중한다.
- 표시 문자열을 통계 계산 source로 사용하지 않는다.

## 현재 확인된 주요 문제

### 1. 조과 수정 저장 흐름이 부분 성공할 수 있음

파일:

- `api/catch-logs.ts`

현재 `catch_logs` 본문 update 이후 이미지 sort/delete/upload가 이어진다. 이미지 처리 중 실패하면 본문은 이미 수정된 상태로 남을 수 있다.

리스크:

- 사용자는 실패 Alert를 보지만 DB 본문은 바뀌어 있을 수 있다.
- DB row와 Storage object가 불일치할 수 있다.
- 삭제된 이미지 row와 남은 Storage object가 어긋날 수 있다.

### 2. AI 판별 결과가 조과 등록과 구조적으로 연결되지 않음

파일:

- `api/ai-species.ts`
- `app/(tabs)/species-analysis/index.tsx`
- `app/catch-register/index.tsx`
- `supabase/functions/detect-fish-species/index.ts`

현재 분석 결과에서 species name은 등록 화면에 prefill되지만, `predictionId`, 후보 목록, 사용자가 최종 선택한 어종이 조과 기록과 연결되지 않는다.

리스크:

- MVP 요구사항인 AI 판별 결과 저장이 불완전하다.
- 향후 AI 정확도 분석, 사용자 선택 추적, 통계 확장이 어렵다.

### 3. 도메인 값과 표시 문자열이 섞여 있음

파일:

- `types/catch-log.ts`
- `api/catch-logs.ts`
- `utils/home-stats.ts`
- `app/catch-log/index.tsx`
- `app/(tabs)/index.tsx`

예: API mapping 단계에서 `fishing_date`가 `YYYY.MM.DD` 표시 문자열로 바뀌고, 통계 util이 다시 문자열 split으로 연/월을 계산한다.

리스크:

- 화면 표시 형식을 바꾸면 통계/정렬이 깨질 수 있다.
- domain model과 view model의 책임이 흐려진다.

### 4. 대형 화면에 책임이 과도하게 몰려 있음

파일:

- `app/catch-register/index.tsx`
- `app/(tabs)/species-analysis/index.tsx`
- `app/(tabs)/index.tsx`
- `app/catch-log/index.tsx`
- `app/catch-log/[id].tsx`

리스크:

- 작은 수정도 회귀 범위가 커진다.
- form, modal, image picker, location, submit payload, route param 처리가 한 파일에 섞인다.
- 테스트와 검증 단위가 모호하다.

### 5. 목록과 홈 통계가 전체 조과 목록에 의존함

파일:

- `api/catch-logs.ts`
- `hooks/queries/use-catch-logs.ts`
- `app/catch-log/index.tsx`
- `app/(tabs)/index.tsx`
- `utils/home-stats.ts`

현재 `getMyCatchLogs`가 전체 조과 목록을 가져오고 여러 화면이 같은 데이터를 필터링/정렬/집계한다.

리스크:

- 데이터가 늘면 목록, 홈, 도감 성능이 같이 나빠진다.
- pagination 도입 시 여러 화면을 동시에 바꿔야 한다.

## 브랜치별 실행 계획

### Phase 0. Checkpoint 정리

브랜치:

```text
refactor/checkpoint
```

목표:

- 현재 큰 변경 상태를 보존한다.
- `.gitignore`에 로컬/민감 파일 제외 규칙을 반영한다.
- 리팩토링 기준 문서와 로드맵을 남긴다.

완료 기준:

- 현재 작업 상태가 checkpoint 브랜치에 있다.
- 리팩토링 기준 문서가 있다.
- 이 로드맵 문서가 있다.

검증:

- 문서 변경만 있으면 lint/typecheck는 생략 가능하다.

### Phase 1. 조과 저장 흐름 안정화

브랜치:

```text
refactor/catch-log-save-flow
```

대상 파일:

- `api/catch-logs.ts`
- `types/catch-log.ts`
- `hooks/queries/use-create-catch-log.ts`
- `hooks/queries/use-update-catch-log.ts`
- `hooks/queries/use-delete-catch-log.ts`
- 필요 시 Supabase migration 또는 Edge Function/RPC

목표:

- create/update/delete의 실패 지점과 보상 로직을 명확히 한다.
- DB row와 Storage object 불일치 가능성을 줄인다.
- 이미지 upload/delete/sort 관련 함수를 작게 나눈다.
- mutation hook의 cache invalidate 범위를 재검토한다.

작업 순서:

1. 현재 `createCatchLog`, `updateCatchLog`, `deleteCatchLog` 흐름을 단계별로 문서화한다.
2. 이미지 관련 helper를 `uploadCatchImage`, `insertCatchImages`, `removeCatchImageObjects`, `syncCatchLogImages`처럼 역할별로 정리한다.
3. update 흐름에서 본문 update와 이미지 변경의 순서를 재검토한다.
4. 부분 실패 시 사용자에게 보이는 결과와 실제 DB/Storage 상태가 어긋나지 않게 보상 로직을 둔다.
5. 필요하면 서버 쪽 RPC 또는 Edge Function으로 트랜잭션 경계를 옮길지 결정한다.

주의:

- Storage object 작업은 Postgres 트랜잭션 안에 들어가지 않는다.
- 복잡도를 무리하게 앱 코드에서만 해결하려 하지 않는다.
- delete에서 Storage cleanup 실패를 성공처럼 숨길 경우, 별도 재시도/관리 정책을 문서화한다.

완료 기준:

- create 실패 시 새 catch log row와 업로드된 이미지가 정리된다.
- update 실패 시 기존 조과 기록이 예측 가능한 상태로 남는다.
- delete 성공 후 cache가 목록/상세/edit에 맞게 정리된다.
- `npm run lint` 통과
- `npx --no-install tsc --noEmit` 통과

### Phase 2. AI 판별 결과와 조과 등록 연결

브랜치:

```text
refactor/ai-prediction-linking
```

상태:

```text
완료
```

대상 파일:

- `types/ai-species.ts`
- `types/catch-log.ts`
- `api/ai-species.ts`
- `api/catch-logs.ts`
- `hooks/queries/use-detect-fish-species.ts`
- `app/(tabs)/species-analysis/index.tsx`
- `app/catch-register/index.tsx`
- `supabase/migrations/*`
- `supabase/functions/detect-fish-species/index.ts`

목표:

- AI 판별 결과를 조과 등록 데이터와 구조적으로 연결한다.
- 사용자가 최종 선택한 어종과 AI 후보를 구분한다.
- AI 판별 이미지를 조과 이미지와 구분하되, 필요한 연결 정보는 남긴다.

확정한 정책:

- AI 후보 목록은 `ai_species_predictions.candidates`에 저장된 값을 원본으로 둔다.
- 분석 화면에서 등록 화면으로 route param으로 넘기는 값은 `predictionId`, top candidate의 `speciesId`, `speciesName`까지만 둔다.
- 사용자가 등록 화면에서 어종을 그대로 저장하면 top candidate의 `speciesId`가 최종 선택값으로 연결된다.
- 사용자가 등록 화면에서 어종명을 바꾸면 등록 시점의 어종 목록 매칭 결과를 최종 선택값으로 사용한다.
- 어종 목록에 매칭되지 않는 직접 입력값은 `catch_logs.species_name`에는 저장하되, `species_id`와 `selected_species_id`는 `null`로 둔다.
- AI 후보만으로 도감을 해금하지 않고, 저장된 조과의 `species_id` 기준으로만 도감 해금을 판단한다.
- AI 분석용 업로드 이미지가 Edge Function 호출 전에 실패하면 Storage object를 정리한다.

결정할 데이터:

- `predictionId`
- `imagePath`
- AI 후보 목록
- 사용자가 선택한 최종 `speciesId`
- 사용자가 직접 수정한 `speciesName`
- 조과 등록에 사용된 AI 결과 여부

작업 순서:

1. 현재 `ai_species_predictions` schema가 MVP 요구사항을 만족하는지 확인한다. 완료
2. `catch_logs`에 `ai_prediction_id` FK가 필요한지 결정한다. 완료: 기존 `ai_species_predictions.catch_log_id`를 사용한다.
3. 분석 화면에서 등록 화면으로 `predictionId`, `speciesId`, `speciesName`을 전달한다. 완료
4. 등록 화면 form/default/prefill 로직을 수정한다. 완료
5. create/update input에 AI prediction 연결 필드를 추가한다. 완료
6. 사용자가 최종 선택한 어종을 `ai_species_predictions.selected_species_id` 또는 `catch_logs.species_id`와 어떻게 연결할지 정한다. 완료
7. 실패한 AI 분석 업로드 이미지 cleanup 정책을 추가한다. 완료

완료 기준:

- AI 분석 결과로 조과 등록 시 prediction id가 저장 흐름에 반영된다.
- 사용자가 AI 결과를 수정해도 최종 선택값이 명확히 저장된다.
- AI 후보만으로 도감이 해금되지 않는다.
- migration, RLS, FK index를 확인한다. 완료: 기존 migration의 `catch_log_id`, `selected_species_id`, RLS, 인덱스를 사용한다.
- `npm run lint` 통과. 완료
- `npx --no-install tsc --noEmit` 통과. 완료

남은 참고 사항:

- Supabase Edge Function Deno 타입체크는 로컬에 `deno`가 없어서 실행하지 못했다.
- AI prediction 연결은 앱 API에서 후속 update로 수행한다. 완전한 서버 측 원자성이 필요해지면 RPC 또는 Edge Function으로 묶는다.

### Phase 3. 조과 도메인 값과 표시 값 분리

브랜치:

```text
refactor/catch-log-domain-date
```

상태:

```text
완료
```

대상 파일:

- `types/catch-log.ts`
- `api/catch-logs.ts`
- `utils/home-stats.ts`
- `utils/tide.ts`
- `app/catch-log/index.tsx`
- `app/catch-log/[id].tsx`
- `app/(tabs)/index.tsx`
- `components/catch-log/RecentCatchCard.tsx`

목표:

- domain model에는 구조화된 raw 값을 둔다.
- 표시 문자열은 화면 또는 view model helper에서 만든다.
- 통계 계산은 표시 문자열이 아니라 raw date와 nullable domain 값을 사용한다.

권장 타입 방향:

```ts
interface CatchLogListItem {
  id: number;
  fishingDate: string;
  speciesName: string;
  speciesId: number | null;
  count: number;
  sizeCm: number | null;
  tide: string | null;
  weather: string | null;
  pointName: string | null;
  latitude: number | null;
  longitude: number | null;
  waterType: CatchLogWaterType;
}
```

작업 순서:

1. `CatchLogListItem`, `CatchLogDetailItem`, `EditableCatchLog` 타입을 raw domain 값 중심으로 정리한다. 완료
2. `formatFishingDateLabel`, `getCatchLogPointLabel`, `getTideLabel` 같은 표시 helper를 만든다. 완료: `utils/catch-log-display.ts`
3. 홈 통계 util이 `fishingDate` raw 값을 기준으로 연/월 계산하도록 바꾼다. 완료
4. 목록 정렬이 표시 문자열이 아니라 raw date를 기준으로 동작하게 한다. 완료
5. 상세 화면 fallback 문구를 화면/view helper로 이동한다. 완료

완료 기준:

- 표시 형식 변경이 통계 계산에 영향을 주지 않는다. 완료
- `utils/home-stats.ts`가 `"YYYY.MM.DD"` split에 의존하지 않는다. 완료
- 기존 화면 표시 결과는 유지된다. 완료
- `npm test -- --runInBand` 통과. 완료
- `npm run lint` 통과. 완료
- `npx --no-install tsc --noEmit` 통과. 완료

### Phase 4. 조과 등록 화면 분리

브랜치:

```text
refactor/catch-register-form-split
```

상태:

```text
완료
```

대상 파일:

- `app/catch-register/index.tsx`
- `components/catch-register/*`
- `hooks/use-catch-register-form.ts`
- `hooks/use-catch-register-photos.ts`
- `utils/catch-register.ts`

목표:

- `app/catch-register/index.tsx`를 화면 조립 중심으로 줄인다.
- form field, step section, modal, photo picker, location search 책임을 분리한다.
- submit payload 생성과 server data -> form values mapping을 순수 함수로 이동한다.

권장 분리:

```text
app/catch-register/index.tsx
components/catch-register/CatchRegisterStepOne.tsx
components/catch-register/CatchRegisterStepTwo.tsx
components/catch-register/CatchRegisterStepThree.tsx
components/catch-register/CatchSpeciesPickerModal.tsx
components/catch-register/CatchFishingDatePicker.tsx
components/catch-register/CatchPhotoSection.tsx
hooks/use-catch-register-photos.ts
hooks/use-catch-register-location.ts
utils/catch-register-form.ts
```

작업 순서:

- [x] 순수 helper 분리: `utils/catch-register-form.ts`로 form values, submit input mapping, 수정 데이터 mapping을 이동했다.
- [x] 폼 필드 분리: `components/catch-register/CatchFormFields.tsx`가 `useFormContext + Controller` 패턴을 따른다.
- [x] 사진 로직/섹션 분리: `hooks/use-catch-register-photos.ts`, `components/catch-register/CatchPhotoSection.tsx`
- [x] 위치 로직/섹션 분리: `hooks/use-catch-register-location.ts`, `components/catch-register/CatchPointSection.tsx`
- [x] 날짜/어종 선택 모달 분리: `hooks/use-catch-register-fishing-date.ts`, `components/catch-register/CatchFishingDatePickerModal.tsx`, `hooks/use-catch-register-species-picker.ts`, `components/catch-register/CatchSpeciesPickerModal.tsx`
- [x] Step 1 물 종류 선택 섹션 분리: `components/catch-register/CatchWaterTypeStep.tsx`
- [x] Step 2 기본 정보 섹션 분리: `components/catch-register/CatchDetailsStep.tsx`
- [x] Step 3 포인트/사진 섹션 분리: `components/catch-register/CatchRegisterStepThree.tsx`
- [x] 최종 import/props 정리
- [x] Phase 4 완료 검증

완료 기준:

- 등록, 수정, AI prefill 흐름이 유지된다.
- Android back button step 이동이 유지된다.
- 날짜, 어종, 마릿수, 위치 invalid 상태가 유지된다.
- `npm test -- --runInBand` 통과
- `npm run lint` 통과
- `npx --no-install tsc --noEmit` 통과

### Phase 5. AI 분석 화면 분리

브랜치:

```text
refactor/species-analysis-split
```

상태:

```text
완료
```

대상 파일:

- `app/(tabs)/species-analysis/index.tsx`
- `components/species-analysis/*`
- `hooks/use-species-analysis-image.ts`
- `hooks/use-ai-analysis-tip.ts`

목표:

- 이미지 선택, 카메라/앨범 권한, 분석 실행, tip modal, result card 책임을 분리한다.
- AI 분석 실패 cleanup 정책을 UI 흐름과 맞춘다.

권장 분리:

```text
components/species-analysis/AnalysisImagePicker.tsx
components/species-analysis/AnalysisResultCard.tsx
components/species-analysis/AnalysisTipModal.tsx
components/species-analysis/RegulationSummary.tsx
hooks/use-species-analysis-image.ts
hooks/use-ai-analysis-tip.ts
```

작업 결과:

- [x] 이미지 선택, 카메라/앨범 권한, 선택 이미지 상태를 `hooks/use-species-analysis-image.ts`로 분리했다.
- [x] AI 분석 사진 팁 표시/오늘 숨기기 상태를 `hooks/use-ai-analysis-tip.ts`로 분리했다.
- [x] 업로드/미리보기/스캔 애니메이션 UI를 `components/species-analysis/AnalysisImagePicker.tsx`로 분리했다.
- [x] 분석 결과 카드를 `components/species-analysis/AnalysisResultCard.tsx`로 분리했다.
- [x] 포획 기준 요약을 `components/species-analysis/RegulationSummary.tsx`로 분리했다.
- [x] 분석 팁 모달을 `components/species-analysis/AnalysisTipModal.tsx`로 분리했다.

완료 기준:

- 앨범/카메라 선택 흐름이 유지된다.
- 분석 중 animation과 disabled 상태가 유지된다.
- 분석 결과에서 조과 등록 이동이 Phase 2 데이터 모델과 맞는다.
- `npm test -- --runInBand` 통과
- `npm run lint` 통과
- `npx --no-install tsc --noEmit` 통과

### Phase 6. 목록, 홈, 도감 조회 구조 정리

브랜치:

```text
refactor/catch-log-list-query-split
```

대상 파일:

- `api/catch-logs.ts`
- `hooks/queries/use-catch-logs.ts`
- `app/catch-log/index.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/dictionary/index.tsx`
- `utils/home-stats.ts`
- `utils/species-dex.ts`

목표:

- 전체 조과 목록 하나에 모든 화면이 의존하는 구조를 줄인다.
- 목록, 홈 요약, 도감 해금 데이터를 용도별 query로 분리할 준비를 한다.
- 필요 시 pagination 또는 server-side aggregation을 도입한다.

작업 순서:

1. 현재 화면별 필요한 필드를 정리한다.
2. 목록용 query와 홈 요약용 query를 분리할지 결정한다.
3. `useInfiniteQuery + FlatList` 도입 범위를 정한다.
4. 도감 해금 조회가 `species_id` 중심으로 동작하는지 확인한다.
5. 인덱스와 RLS 성능을 함께 검토한다.

완료 기준:

- 목록 화면은 pagination 도입이 가능한 구조가 된다.
- 홈 통계는 필요한 데이터만 가져오거나, server-side aggregation 방향이 정해진다.
- 도감은 AI 후보가 아니라 사용자가 저장한 `species_id` 기준으로 해금된다.
- `npm run lint` 통과
- `npx --no-install tsc --noEmit` 통과

### Phase 7. 공통 UI와 스타일 정리

브랜치:

```text
refactor/common-ui-polish
```

대상 파일:

- `components/*`
- `constants/index.ts`
- `app/*`

목표:

- 반복되는 loading/error/empty/header/button UI를 필요한 만큼만 공통화한다.
- 색상 사용을 theme token 중심으로 정리한다.
- 과한 공통 컴포넌트는 만들지 않는다.

후보:

```text
AppLoadingState
AppErrorState
AppEmptyState
ConfirmActionSheet
FormFieldLabel
```

완료 기준:

- 중복이 실제로 줄어든다.
- 사용처 하나뿐인 추상 컴포넌트가 늘어나지 않는다.
- 라이트/다크 모드가 유지된다.
- `npm run lint` 통과
- `npx --no-install tsc --noEmit` 통과

## 검증 체크리스트

공통:

```bash
npm run lint
npx --no-install tsc --noEmit
```

라우팅 변경:

- invalid param에서 query가 실행되지 않는다.
- 상세, 목록, 등록, 수정 진입 경로가 유지된다.
- `router.push`, `router.replace`, `router.back` 선택이 의도와 맞다.
- header가 중복으로 보이지 않는다.

폼 변경:

- 등록 기본값이 맞다.
- 수정 화면은 서버 데이터 로드 후 `reset(...)`으로 채워진다.
- 숫자 input은 submit 전에 `NaN`이 되지 않는다.
- 좌표는 위도/경도 둘 다 있거나 둘 다 없다.
- disabled 상태와 submit 중복 방지가 유지된다.

Supabase 변경:

- migration SQL이 있다.
- 사용자 개인 데이터 table에는 RLS가 있다.
- `user_id` RLS 컬럼과 FK 컬럼 인덱스를 확인한다.
- Storage bucket policy가 사용자 path 기준으로 제한된다.
- service role key와 Gemini API key가 앱 코드에 없다.

Edge Function 변경:

- Deno 타입체크를 별도로 실행한다.
- request body runtime validation이 있다.
- 외부 API 응답 normalize가 있다.
- 로그용 error와 사용자 message가 분리된다.

## 리팩토링 중 보류할 항목

아래 항목은 별도 기능 작업으로 분리한다.

- Kakao Map으로 지도 구현 전환
- 통계 대시보드 고도화
- 광고/제휴 UI 확장
- 오프라인 모드
- 커뮤니티 기능
- 앱 배포 설정 고도화
- 전체 디자인 시스템 재구축

## 첫 작업 추천

가장 먼저 진행할 브랜치:

```text
refactor/catch-log-save-flow
```

이유:

- 조과로그 MVP의 핵심은 조과를 정확히 등록하는 것이다.
- 현재 가장 큰 리스크는 화면 줄 수보다 저장/수정/삭제 흐름의 데이터 무결성이다.
- 이 흐름이 안정돼야 AI 결과 연결, 화면 분리, 목록/통계 정리가 안전해진다.
