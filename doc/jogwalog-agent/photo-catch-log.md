# 사진으로 등록

이 문서는 조과 등록의 "사진으로 등록" 기능을 내일 바로 이어서 구현할 수 있도록 정리한다.

## 목표

"사진으로 등록"은 사용자가 조과 사진 1장을 선택하면 앱이 조과 등록 초안을 자동으로 채우고, 사용자가 확인/수정 후 저장하는 흐름이다.

핵심 포지션:

```text
사진만 선택하면 어종, 촬영일시, 위치, 물때/날씨/바다낚시지수까지 채워지는 조과 기록
```

중요한 표현:

- 자동 저장이 아니라 자동 초안 생성이다.
- AI 결과는 후보이며, 사용자가 최종 선택한다.
- 위치와 환경 데이터는 자동 보강하되 실패해도 조과 저장은 가능해야 한다.

## 사용자 플로우

```text
홈 또는 내 조과 목록
  -> + 조과 등록
  -> 등록 방식 선택
    -> 사진으로 등록
    -> 직접 입력
```

"사진으로 등록" 상세 흐름:

```text
사진으로 등록 선택
  -> 사진 촬영 또는 앨범에서 선택
  -> 사진 업로드
  -> AI 어종 판별 요청
  -> EXIF 촬영일시/위치 추출
  -> 위치가 없으면 현재 GPS 또는 지도 선택
  -> 위치와 시간 기준으로 바다낚시지수/날씨 데이터 매칭
  -> 조과 등록 초안 화면
  -> 사용자가 어종, 마릿수, 크기, 위치, 날짜, 물때, 날씨, 메모 확인/수정
  -> 저장
  -> 조과 상세 또는 내 조과 목록
```

버튼명:

- 기본 버튼명: `사진으로 등록`
- 보조 설명: `사진에서 어종과 촬영 정보를 불러와 빠르게 기록합니다.`
- 직접 입력 버튼명: `직접 입력`

## 화면 요구사항

### 등록 방식 선택

필수 요소:

- 제목: `조과 등록`
- `사진으로 등록` 버튼
- `직접 입력` 버튼

각 옵션 설명:

```text
사진으로 등록
사진에서 어종과 촬영 정보를 불러와 빠르게 기록합니다.

직접 입력
날짜, 위치, 어종을 직접 선택해 기록합니다.
```

### 사진 선택 화면

필수 상태:

- 사진 선택 전
- 사진 선택 중
- 업로드 중
- AI 분석 중
- 실패
- 권한 거부

주의:

- 사진 선택 실패와 AI 분석 실패를 구분한다.
- AI 분석 실패 시 직접 입력으로 이어갈 수 있어야 한다.

### 자동 초안 확인 화면

표시 후보:

- 사진 미리보기
- AI 어종 후보 목록
- 최종 선택 어종
- 마릿수
- 크기
- 촬영일시
- 위치 이름
- 위도/경도
- 물때
- 날씨
- 기온
- 수온
- 풍속
- 파고
- 바다낚시지수
- 메모

UX 기준:

- 자동으로 채워진 값과 사용자가 직접 수정한 값을 구분할 수 있으면 좋다.
- 필수값 누락 시 저장 버튼을 비활성화하거나 명확한 오류를 보여준다.
- 위치 권한이 거부되어도 지도 직접 선택으로 진행할 수 있어야 한다.

## 필요한 데이터

### catch_logs

최종 조과 기록에 필요한 값:

- `user_id`
- `fishing_date`
- `location_type_id`
- `species_id`
- `species_name`
- `count`
- `size_cm`
- `tide`
- `weather`
- `point_name`
- `latitude`
- `longitude`
- `memo`

추가 검토 필드:

- `entry_mode`: `manual`, `photo`
- `captured_at`
- `captured_at_source`: `photo_exif`, `device_time`, `manual`
- `location_source`: `photo_exif`, `current_gps`, `map`, `manual`
- `environment_source`: `fishing_index`, `weather_api`, `manual`, `none`
- `auto_filled_fields`
- `user_corrected_fields`

### catch_images

사진 저장에 필요한 값:

- `catch_log_id`
- `user_id`
- `storage_path`
- `public_url` 또는 signed URL 기준 path
- `width`
- `height`
- `mime_type`
- `file_size`
- `metadata`
- `is_primary`

추가 검토:

- EXIF 원본은 `metadata` jsonb에 저장할지 별도 컬럼으로 분리할지 결정한다.
- 정확한 위치 정보는 개인정보이므로 접근 정책을 확인한다.

### ai_species_predictions

AI 판별 저장에 필요한 값:

- `catch_log_id` 또는 초안 단계에서 연결 가능한 임시 식별자
- `user_id`
- `image_path`
- `provider`
- `model`
- `candidates`
- `selected_species_id`
- `selected_species_name`
- `raw_response`
- `usage`
- `created_at`

주의:

- AI 후보만으로 도감을 해금하지 않는다.
- 사용자가 최종 저장한 `catch_logs.species_id` 기준으로 도감을 해금한다.

### 환경 데이터

사진으로 등록 초안에 붙일 수 있는 값:

- `fishing_location_id`
- `fishing_index_forecast_id`
- `weather_forecast_id`
- `tide`
- `forecast_date`
- `forecast_time`
- `target_species_name`
- `fishing_index_grade`
- `fishing_index_score`
- `water_temp_c`
- `air_temp_c`
- `wind_speed_ms`
- `wind_direction`
- `wave_height_m`
- `current_speed`

## 현재 있는 연동

이미 있는 것:

- Supabase Auth/DB/Storage/Edge Functions
- Gemini 어종 판별 Edge Function: `supabase/functions/detect-fish-species`
- 바다낚시지수 자동 수집 Edge Function: `supabase/functions/sync-fishing-index`
- `expo-image-picker`
- `expo-location`
- `react-native-maps`
- Firebase Analytics

현재 자동 주기 수집:

- 바다낚시지수 API만 3시간마다 수집한다.

## 추가해야 할 API

우선순위 1:

- Kakao Local API
  - 좌표 -> 주소
  - 좌표 -> 행정구역
  - 장소/포인트 키워드 검색

우선순위 2:

- 기상청 단기/초단기예보 API
  - 날씨
  - 기온
  - 강수
  - 풍속/풍향
  - 습도

우선순위 3:

- KHOA 조석/조류/수온 API
  - 조석예보
  - 조위
  - 조류
  - 수온
  - 파고/해양관측

MVP 최소 조합:

```text
Gemini 어종 판별
+ expo-image-picker
+ expo-location
+ Kakao Local API
+ 현재 수집 중인 바다낚시지수 매칭
```

## 구현 순서

1. 등록 방식 선택 UI 추가
   - `+ 조과 등록` 진입 시 `사진으로 등록`, `직접 입력` 선택
   - 기존 직접 등록 흐름은 유지

2. 사진으로 등록 초안 타입 정의
   - `PhotoCatchLogDraft`
   - `AutoFilledField`
   - `CatchLogEntryMode`
   - `CapturedAtSource`
   - `LocationSource`

3. 사진 선택/촬영 흐름 연결
   - `expo-image-picker`
   - EXIF 옵션 확인
   - 선택 사진 preview

4. 사진 업로드와 AI 어종 판별 연결
   - 기존 `api/ai-species.ts`, `useDetectFishSpecies` 재사용
   - 같은 이미지 재분석 방지 검토

5. EXIF 촬영일시/위치 추출
   - 촬영일시가 있으면 기본값 반영
   - 위치가 있으면 위도/경도 반영
   - 없으면 `expo-location` 또는 지도 선택으로 fallback

6. 위치 이름 보강
   - Kakao Local API 추가 후 좌표를 주소/행정구역으로 변환
   - API key는 앱 코드에 직접 넣지 않는 방향 우선 검토

7. 바다낚시지수 매칭
   - 위치와 날짜 기준 가까운 `fishing_locations` 찾기
   - 오전/오후 기준 `forecast_time` 매칭
   - 어종명이 맞으면 `target_species_name` 기준 우선 매칭
   - 없으면 `기타어종` 또는 위치/시간 기준 fallback 검토

8. 초안 확인 화면 구현
   - React Hook Form 사용
   - 자동값은 초기값으로만 넣고 사용자가 수정 가능하게 한다.

9. 저장
   - 마지막 저장 시 `catch_logs`, `catch_images`, `ai_species_predictions` 연결
   - 실패 시 업로드된 이미지 정리 또는 재시도 처리

10. 분석 이벤트 추가
   - `photo_register_started`
   - `photo_selected`
   - `species_detected`
   - `photo_draft_created`
   - `photo_register_saved`
   - `photo_register_failed`

## 비용 관리

AI는 항상 호출하지 않는다.

운영 규칙:

- 사용자가 명시적으로 `사진으로 등록`을 선택하고 사진을 고른 뒤에만 호출한다.
- 같은 이미지/같은 storage path는 기존 분석 결과를 재사용한다.
- 무료 사용량 제한을 둔다. 예: 월 20~30회.
- 실패/재시도 카운트를 기록한다.
- AI 출조 상담보다 사진 어종 판별을 우선한다.

## 예외 처리

- 사진 권한 거부: 권한 안내 후 직접 입력 가능
- 위치 권한 거부: 지도 검색/직접 선택 가능
- EXIF 없음: 현재 시간/현재 위치 또는 직접 입력
- AI 판별 실패: 직접 어종 선택 가능
- AI confidence 낮음: 직접 선택을 강조
- 바다낚시지수 매칭 실패: 물때/날씨 직접 입력 가능
- Storage 업로드 실패: 재시도
- 저장 실패: 초안 유지 후 재시도

## 보안과 개인정보

- Supabase service role key, Gemini API key, 외부 API secret은 앱 코드에 넣지 않는다.
- 정확한 조과 위치는 기본 private 데이터로 취급한다.
- 공유 기능에서는 좌표 숨김 또는 반경 흐림을 기본값으로 검토한다.
- AI prompt에는 사용자의 개인 식별 정보와 정확한 개인 포인트명을 직접 포함하지 않는다.
- 사용자 개인 데이터 테이블은 RLS를 유지한다.

## 완료 기준

- `+ 조과 등록`에서 `사진으로 등록`과 `직접 입력`을 선택할 수 있다.
- 사진 1장을 선택해 조과 등록 초안을 만들 수 있다.
- AI 어종 후보가 표시되고 사용자가 최종 어종을 바꿀 수 있다.
- EXIF 또는 fallback으로 촬영일시/위치를 채울 수 있다.
- 바다낚시지수 매칭이 가능하면 초안에 반영된다.
- 자동값이 없어도 사용자가 직접 입력해 저장할 수 있다.
- 저장 후 내 조과 목록 또는 상세에서 정상 조회된다.
- `npm run lint`와 `npx --no-install tsc --noEmit`가 통과한다.
