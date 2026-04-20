# 아키텍처

## 프로젝트 구조

사용자가 명시적으로 바꾸지 않는 한 아래 구조를 따른다.

```text
app/              Expo Router 화면과 layout
api/              Supabase client/service 함수와 외부 API wrapper
hooks/queries/    React Query hook
hooks/            일반 custom hook
components/       재사용 UI 컴포넌트
constants/        colors, Supabase URL, query key, 고정값
types/            도메인 타입, DTO 타입
utils/            공통 유틸 함수
i18n/             번역 리소스
assets/           폰트, 이미지, 정적 파일
supabase/         migration, seed, Edge Functions, Supabase 설정
doc/              학습, 설계, 프로젝트 문서
```

새 기능 구현 순서:

```text
types
  -> api
  -> constants/queryKeys
  -> hooks/queries
  -> app 화면 또는 component
  -> 검증
```

## 아키텍처 규칙

- `app/`의 화면 파일은 data hook과 UI 컴포넌트를 조립한다.
- Supabase 요청은 `api/` 또는 전용 service 함수에 둔다. 컴포넌트에서 `supabase.from(...)`, `supabase.auth...`, `supabase.storage...`를 직접 흩뿌리지 않는다.
- 서버 상태는 React Query로 관리한다.
- 단순 UI 상태는 React state로 관리한다.
- 폼 상태는 React Hook Form으로 관리한다.
- 재사용되는 UI 조각은 `components/`에 둔다.
- 공통 상수는 `constants/`에 둔다.
- 공통 도메인 타입과 DTO 타입은 `types/`에 둔다.
- API 응답 정규화는 가능하면 `api/` 함수에서 한 번만 처리하고 컴포넌트에서 반복하지 않는다.

## Expo Router 규칙

- `app/` 아래 파일이 route를 정의한다.
- `_layout.tsx`는 navigator와 공통 화면 옵션을 정의한다.
- 실제 화면 UI는 `index.tsx`, `[id].tsx`, `write.tsx`, `update.tsx` 같은 파일에 둔다.
- `(tabs)` 같은 route group은 URL에 포함되지 않는다.
- 새 화면 이동은 `router.push`, 현재 화면 대체는 `router.replace`, 뒤로가기는 `router.back`을 사용한다.
- 동적 params는 타입을 지정한 `useLocalSearchParams`로 읽는다.
- 숫자 params는 `Number(...)`로 변환하고, query 전에 유효성을 검사한다.

예시:

```tsx
const { id } = useLocalSearchParams<{ id: string }>();
const catchLogId = Number(id);

const catchLogQuery = useGetCatchLog(catchLogId, {
  enabled: Number.isFinite(catchLogId),
});
```

## React Query 규칙

- query key는 반드시 `constants/queryKeys.ts`에서 만든다.
- 컴포넌트 안에서 query key 배열을 직접 만들지 않는다.
- query hook은 `hooks/queries/`에 둔다.
- mutation hook은 해당 기능에 필요한 invalidate와 navigation side effect를 함께 처리할 수 있다.
- invalidate 범위는 실제 바뀐 데이터에 맞춰 정한다. 예: 목록, 상세, 내 목록, 좋아요 목록, 프로필
- optimistic update는 이전 cache를 저장하고 실패 시 rollback해야 한다.
- `fetchQuery`에는 반드시 `queryFn`을 넣는다.

query key 패턴:

```ts
const catchLogKeys = {
  all: ["catchLogs"] as const,
  lists: () => [...catchLogKeys.all, "list"] as const,
  list: () => [...catchLogKeys.lists(), "all"] as const,
  myList: () => [...catchLogKeys.lists(), "my"] as const,
  stats: () => [...catchLogKeys.all, "stats"] as const,
  details: () => [...catchLogKeys.all, "detail"] as const,
  detail: (catchLogId: number) =>
    [...catchLogKeys.details(), catchLogId] as const,
};
```

## API/service 함수 규칙

- API 함수는 반환 타입을 명시한다.
- API 함수는 작게 유지하고 작업 이름으로 짓는다. 예: `getCatchLog`, `createCatchLog`, `updateCatchLog`, `deleteCatchLog`
- Supabase 호출은 `api/` 함수 또는 service 함수로 감싼다.
- 컴포넌트는 Supabase client를 직접 호출하지 않고 React Query hook을 사용한다.
- Supabase 응답의 `data`, `error` 처리는 API/service 함수에서 정리한다.
- 서버 응답이 UI에서 쓰기 불편하면 `api/`에서 한 번 정규화한다.
- Edge Function 호출도 컴포넌트에서 직접 하지 말고 `api/ai.ts` 같은 파일로 감싼다.

예시:

```ts
async function getCatchLog(catchLogId: number): Promise<CatchLog> {
  const { data, error } = await supabase
    .from("catch_logs")
    .select("*, catch_images(*)")
    .eq("id", catchLogId)
    .single();

  if (error) throw error;
  return data;
}
```

## Form 규칙

- `useForm`은 화면 컴포넌트에서 만든다.
- form 영역은 `FormProvider`로 감싼다.
- input 컴포넌트는 `useFormContext`와 `Controller`를 사용한다.
- 수정 화면처럼 서버 데이터가 나중에 들어오는 경우 `defaultValues`만 믿지 말고 `form.reset(...)`을 사용한다.
- 배열 필드는 `useFieldArray`를 사용한다.
- form 값 구독은 `useWatch`를 사용한다.
- submit은 `form.handleSubmit(onSubmit)`으로 연결한다.

## 리스트 규칙

- 서버 목록은 기본적으로 `useInfiniteQuery + FlatList` 조합을 사용한다.
- page 데이터는 `data?.pages.flat() ?? []`로 펼친다.
- `FlatList.data`에는 화면이 기대하는 정상 item만 넣는다.
- `item.id`가 없을 수 있으면 list에 오기 전에 API 응답을 정규화한다.
- 빈 화면은 `ListEmptyComponent`를 사용한다.
- `keyExtractor`는 안정적인 값을 사용한다.

## 이미지 규칙

- PNG/JPG/WebP 또는 일반 원격 이미지 URL은 `Image`를 사용한다.
- 실제 SVG 응답 URL에만 `SvgUri`를 사용한다.
- 조과 이미지는 Supabase Storage에 저장한다.
- Storage path는 사용자 단위로 분리한다. 예: `users/{userId}/catch-logs/{catchLogId}/{fileName}`
- public bucket을 쓸지 signed URL을 쓸지는 정책으로 결정한다. 기본은 private bucket + signed URL을 우선 검토한다.
- 상대 이미지 경로에 storage public URL 또는 signed URL을 붙이는 위치는 한 곳으로 통일한다.
- 이미지 선택, 업로드 API, UI preview 책임을 분리한다.
- 도감 일러스트를 앱에 번들할지, Supabase Storage에서 불러올지는 이미지 최적화 후 결정한다.
- 어떤 방식을 선택하든 `species_id`와 일러스트 리소스의 매핑 위치는 한 곳으로 통일한다.
