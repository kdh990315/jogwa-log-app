# 조과로그 Codex 문서 세트

이 폴더는 조과로그 프로젝트를 시작할 때 Codex에게 줄 프로젝트 지침 문서 모음이다.

## 먼저 볼 문서

1. `AGENTS.md`: Codex가 항상 읽어야 하는 핵심 규칙
2. `project-brief.md`: 조과로그 서비스 개요
3. `mvp-scope.md`: 1차 MVP 범위
4. `screen-flow.md`: 1차 MVP 화면 이동 흐름
5. `supabase.md`: Supabase 백엔드 설계 기준
6. `monetization.md`: 광고/제휴 수익화 기준
7. `release-analytics.md`: iOS/Galaxy Store 배포와 Google Analytics for Firebase 기준

## 문서 역할

- `AGENTS.md`: 핵심 작업 원칙, 기술 스택, 검증 명령, 완료 기준
- `project-brief.md`: 서비스 방향, 주요 사용자, 장기 방향
- `mvp-scope.md`: MVP 기능, 제외 범위, 저장해야 할 조과 데이터, 어종 도감 범위
- `screen-flow.md`: 로그인, 홈, 조과 등록 3단계, AI 어종 판별기, 어종 도감 화면 흐름
- `architecture.md`: 폴더 구조, Expo Router, React Query, API/service, Form/List/Image 규칙
- `supabase.md`: Auth, Postgres, Storage, Edge Functions, RLS, 인덱스, migration 규칙
- `monetization.md`: Google AdMob, 쿠팡 파트너스, 광고 배치, 정책 확인 기준
- `release-analytics.md`: App Store, Galaxy Store, Firebase Analytics, 이벤트 설계
- `ux-principles.md`: 사용자 경험 기준과 판단 우선순위
- `coding-conventions.md`: TypeScript, 컴포넌트, 스타일, 네이밍, 피해야 할 패턴
- `codex-workflow.md`: Codex 작업 방식, 검증, 계획 기준, 완료 기준
- `prompt-template.md`: Codex에게 요청할 때 쓸 템플릿과 예시

## 새 프로젝트에 적용하는 방법

새 프로젝트 루트에는 `AGENTS.md`가 있어야 Codex가 자동으로 읽는다.

권장 구조:

```text
새프로젝트/
  AGENTS.md
  doc/
    jogwalog-agent/
      project-brief.md
      mvp-scope.md
      screen-flow.md
      architecture.md
      supabase.md
      monetization.md
      release-analytics.md
      ux-principles.md
      coding-conventions.md
      codex-workflow.md
      prompt-template.md
```

현재 폴더의 `AGENTS.md`를 새 프로젝트 루트로 복사하고, 나머지 문서는 `doc/jogwalog-agent/`에 둔다.
