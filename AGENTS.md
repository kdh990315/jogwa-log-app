## 프로젝트

어장관리는 낚시 조과 기록, 조과 사진 관리, 잡은 어종 도감, 통계, AI 어종 판별을 제공하는 React Native Expo 앱이다.

1차 MVP는 "내 조과를 정확히 등록하는 것"에 집중한다. 통계 화면은 1차 MVP에서 제외하지만, 물때/날씨/위치/어종/마릿수/이미지/AI 판별 결과는 향후 통계가 가능하도록 구조화해서 저장한다.

## 핵심 문서

작업 전 필요한 문서만 골라 읽는다.

- 프로젝트 개요: `doc/jogwalog-agent/project-brief.md`
- MVP 범위: `doc/jogwalog-agent/mvp-scope.md`
- 화면 플로우: `doc/jogwalog-agent/screen-flow.md`
- 아키텍처와 화면 구조: `doc/jogwalog-agent/architecture.md`
- Supabase 백엔드: `doc/jogwalog-agent/supabase.md`
- 수익화 정책: `doc/jogwalog-agent/monetization.md`
- 배포와 분석: `doc/jogwalog-agent/release-analytics.md`
- 사용자 경험 기준: `doc/jogwalog-agent/ux-principles.md`
- 코드 규칙: `doc/jogwalog-agent/coding-conventions.md`
- Codex 작업 방식: `doc/jogwalog-agent/codex-workflow.md`
- 사용자 요청 템플릿: `doc/jogwalog-agent/prompt-template.md`

## 기술 스택

- React Native
- Expo
- Expo Router
- TypeScript
- React Query
- Supabase
- `@supabase/supabase-js`
- React Hook Form
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Edge Functions
- Kakao Map
- Gemini 3.1 AI
- expo-image-picker
- expo-location
- Google AdMob
- Coupang Partners
- Google Analytics for Firebase
- Apple App Store
- Samsung Galaxy Store
- Light/Dark Mode 자동 테마

Axios는 Supabase로 처리하지 않는 외부 HTTP API가 있을 때만 사용한다.

## 작업 원칙

- 기존 구조와 패턴을 먼저 읽고 따른다.
- 변경 범위는 사용자 요청과 직접 관련된 파일로 제한한다.
- 기능 구현, 리팩터링, 포맷팅 변경, 의존성 업그레이드를 한 번에 섞지 않는다.
- 사용자가 만든 기존 변경사항을 되돌리지 않는다.
- 화면 컴포넌트에서 Supabase client를 직접 호출하지 않는다.
- Supabase 호출은 `api/` 또는 service 함수로 감싸고 React Query hook에서 사용한다.
- 서버 상태는 React Query로 관리하고, 단순 UI 상태는 React state로 관리한다.
- 폼 상태는 React Hook Form으로 관리한다.
- 라이트모드와 다크모드를 모두 지원한다. 사용자 선택이 없으면 시간대 기준으로 자동 적용한다.
- 타입 에러를 `any`나 무리한 type assertion으로 덮지 않는다.
- RLS 없이 사용자 개인 데이터 테이블을 만들지 않는다.
- Supabase service role key와 Gemini API key를 앱 코드에 넣지 않는다.
- 더 나은 방법, 새 라이브러리, 설정 변경, 외부 연동 방식을 제안할 때는 최신 공식 문서를 먼저 확인한다.
- 공식 문서가 확인되지 않은 내용은 추정이라고 표시하고, 가능하면 공식 문서 확인이 필요한 항목으로 남긴다.

## 판단 우선순위

기능 구현 중 선택지가 생기면 아래 순서로 판단한다.

```text
정확성
  -> 사용자 경험
  -> 보안과 개인정보 보호
  -> 데이터 무결성
  -> 타입 안정성
  -> 유지보수성
  -> 성능
  -> 코드량
```

사용자가 직접 마주하는 화면과 흐름에서는 사용자 경험을 우선한다. 다만 조과 기록은 개인 데이터이므로 인증, RLS, Storage 접근 권한, API key 보호를 가볍게 보지 않는다.

## 검증 명령

코드를 수정한 뒤 가능한 한 lint와 TypeScript 타입체크를 모두 실행한다.

```bash
npm run lint
npx --no-install tsc --noEmit
```

`npm run lint`는 lint 검증이고, `npx --no-install tsc --noEmit`는 TypeScript 타입체크다.

검증을 실행하지 못했으면 최종 답변에 이유를 명확히 적는다.

Supabase schema, RLS, Storage, Edge Function을 바꿨다면 migration SQL, RLS policy, 인덱스, 보안 리스크를 함께 검토한다.

Supabase, Expo, React Native, Kakao, Gemini, Apple/Google 로그인처럼 외부 서비스나 라이브러리 사용법을 제안하거나 바꿀 때는 최신 공식 문서를 기준으로 판단한다.

## 완료 기준

작업은 아래 조건을 만족해야 완료로 본다.

- 요청한 동작이 구현되어 있다.
- 타입이 실제 runtime 데이터와 맞는다.
- 필요한 경우 loading, empty, error, invalid-param 상태를 처리했다.
- cache invalidate 또는 optimistic update 범위가 맞다.
- navigation 동작이 route 구조와 맞다.
- 관련 검증을 실행했거나 실행하지 못한 이유를 남겼다.
- 최종 답변에 변경 파일, 검증 결과, 남은 리스크를 요약했다.

UI 또는 라우팅 변경이면 추가로 확인한다.

- 기대한 경로로 화면이 열린다.
- header가 중복으로 보이지 않는다.
- `router.push`, `router.replace`, `router.back` 선택이 의도와 맞다.
- Android safe area, keyboard, local server URL 이슈를 고려했다.
- list에 `undefined` 또는 잘못된 item이 들어가지 않는다.
