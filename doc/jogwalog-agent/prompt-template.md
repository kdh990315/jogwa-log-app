# 사용자 요청 템플릿

Codex에게 일을 맡길 때 아래 형식으로 요청하면 결과가 좋아집니다.

## 추천 요청 형식

```text
목표:
- 무엇을 만들거나 고칠지 적는다.

맥락:
- 관련 화면, 파일, 에러 로그, API 스펙, 디자인 링크를 적는다.

제약:
- 바꾸면 안 되는 것, 유지해야 하는 패턴, 제외할 범위를 적는다.

완료 기준:
- 어떤 검증이 통과해야 완료인지 적는다.
```

## 예시

```text
목표:
- 조과 등록 화면에 AI 어종 판별 기능을 추가해줘.

맥락:
- app/catch-log/write.tsx
- api/ai.ts
- hooks/queries/useDetectFishSpecies.ts
- components/CatchImagePicker.tsx

제약:
- 컴포넌트에서 Supabase client를 직접 호출하지 말 것.
- AI 판별 결과는 사용자가 최종 선택하기 전까지 조과 어종으로 확정하지 말 것.
- 이미지 업로드, AI 판별, 조과 등록 책임을 분리할 것.

완료 기준:
- 이미지 업로드 후 AI 어종 후보가 보인다.
- 사용자가 후보를 선택하면 조과 등록 폼의 어종 값에 반영된다.
- npm run lint, npx --no-install tsc --noEmit 통과.
```

## 어장관리 초기 요청 예시

```text
목표:
- 어장관리 1차 MVP의 조과 등록 화면을 만들어줘.

맥락:
- doc/jogwalog-agent/project-brief.md
- doc/jogwalog-agent/mvp-scope.md
- doc/jogwalog-agent/architecture.md
- doc/jogwalog-agent/supabase.md

제약:
- Supabase client를 화면 컴포넌트에서 직접 호출하지 말 것.
- 조과 등록 데이터는 향후 통계를 낼 수 있도록 구조화할 것.
- AI 어종 판별은 사용자가 최종 확정하기 전까지 자동 저장하지 말 것.

완료 기준:
- 조과 등록 폼이 존재한다.
- 어종, 마릿수, 물때, 날씨, 위치, 이미지 필드를 입력할 수 있다.
- npm run lint, npx --no-install tsc --noEmit 통과.
```
