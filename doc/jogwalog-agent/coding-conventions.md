# 코드 규칙

## TypeScript 규칙

- 객체 형태와 컴포넌트 props는 기본적으로 `interface`를 사용한다.
- union, alias, utility 조합, mutation variables에는 `type`을 사용한다.
- `any`는 피한다. 정말 필요하면 좁은 타입으로 격리하고 이유가 드러나게 작성한다.
- 타입 전용 import는 `import type`을 사용한다.
- 여러 파일에서 공유하는 타입은 `types/index.ts`에 둔다.
- 특정 컴포넌트에서만 쓰는 props 타입은 해당 컴포넌트 파일 안에 둬도 된다.

예시:

```tsx
interface CatchLogItemProps {
  catchLog: CatchLog;
  isDetail?: boolean;
}

export default function CatchLogItem({
  catchLog,
  isDetail = false,
}: CatchLogItemProps) {
  return null;
}
```

## 핵심 도메인 타입

- User
- AuthProvider
- CatchLog
- CatchImage
- FishSpecies
- SpeciesIllustration
- SpeciesDexEntry
- Tide
- Weather
- FishingLocation
- AiSpeciesPrediction
- CatchStats
- CreateCatchLogDto
- UpdateCatchLogDto

조과 기록의 핵심 타입은 통계 확장을 고려해 설계한다. 단순 문자열 하나에 모든 정보를 몰아넣지 말고, 물때/날씨/위치/어종/마릿수/이미지/AI 판별 결과를 분리해서 저장한다.

## 컴포넌트 규칙

- React 컴포넌트는 function declaration을 사용한다.
- props interface 이름은 `ComponentNameProps` 형식으로 짓는다.
- 이벤트 핸들러 이름은 `handle`로 시작한다.
- boolean 값은 `is`, `has`, `can`, `should`로 시작한다.
- 조건부 렌더링은 짧게 유지한다. 복잡하면 의미 있는 변수로 분리한다.
- 공통 컴포넌트를 너무 일찍 만들지 않는다. 실제 사용처가 둘 이상이거나 화면 파일이 읽기 어려워질 때 분리한다.

예시:

```tsx
interface CustomButtonProps extends PressableProps {
  label: string;
  size?: "medium" | "large";
  variant?: "filled" | "standard" | "outlined";
}

function CustomButton({
  label,
  size = "large",
  variant = "filled",
  ...props
}: CustomButtonProps) {
  return null;
}

export default CustomButton;
```

## 스타일 규칙

- 스타일은 파일 하단의 `StyleSheet.create()`에 둔다.
- 색상은 `constants/index.ts`의 colors를 사용한다.
- 조과로그는 라이트모드와 다크모드를 모두 지원한다.
- 사용자 선택이 없으면 시간대 기준으로 라이트/다크모드를 자동 적용한다.
- 색상은 theme token 형태로 관리한다. 예: `background`, `surface`, `text`, `mutedText`, `primary`, `danger`
- 컴포넌트에서 임의 hex color를 반복해서 쓰지 않는다.
- 동적 스타일은 style 배열로 처리한다.
- inline style은 작고 동적인 값에만 사용한다.
- React Native 스타일은 camelCase로 작성한다.
- 숫자 스타일에는 `px`를 붙이지 않는다.

## 네이밍 규칙

파일 이름:

```text
CatchLogItem.tsx
CatchLogList.tsx
CatchLogForm.tsx
useGetCatchLog.ts
useCreateCatchLog.ts
useUploadCatchImages.ts
useDetectFishSpecies.ts
useGetSpeciesDex.ts
queryKeys.ts
```

함수 이름:

```text
getCatchLog
getCatchLogs
createCatchLog
updateCatchLog
deleteCatchLog
uploadCatchImages
detectFishSpecies
getSpeciesDex
useGetCatchLog
useCreateCatchLog
useDetectFishSpecies
useGetSpeciesDex
handleSubmitCatchLog
handleSelectLocation
handleDetectFishSpecies
handlePressSpecies
```

변수 이름:

```text
isDetecting
isPending
isRefreshing
hasNextPage
catchLogId
userId
speciesName
speciesId
isUnlocked
tideName
weatherName
locationName
latitude
longitude
```

## 리스크 체크리스트

아래 코드를 수정할 때는 반드시 한 번 더 확인한다.

- `useLocalSearchParams` 값을 바로 숫자로 바꾸는 코드
- async 데이터를 사용하는 `useForm.defaultValues`
- `item.id.toString()`을 쓰는 `FlatList.keyExtractor`
- `queryFn` 없는 `queryClient.fetchQuery`
- 직접 작성한 query key 배열을 쓰는 `queryClient.invalidateQueries`
- SVG가 아닌 URL을 받는 `SvgUri`
- 중첩된 `Pressable`
- `break` 없는 `switch case`
- `useEffect` dependency 경고
- `auth.id`만 보고 실행되는 인증 redirect
- 목록 cache와 상세 cache를 불일치하게 만드는 mutation 코드
- RLS 없는 사용자 개인 데이터 테이블
- Supabase service role key 또는 Gemini API key가 앱 코드에 들어가는 경우
- Supabase Dashboard에서만 바꾸고 migration에 남기지 않은 DB 변경

## 피해야 할 패턴

컴포넌트에서 Supabase client를 직접 호출하지 않는다.

```tsx
const { data } = await supabase.from("catch_logs").select("*");
```

컴포넌트에서 Edge Function을 직접 호출하지 않는다.

```tsx
const { data } = await supabase.functions.invoke("detect-fish-species", {
  body: { imagePath },
});
```

query key를 inline으로 직접 쓰지 않는다.

```tsx
queryClient.invalidateQueries({ queryKey: ["catchLogs", "list"] });
```

async 데이터를 `defaultValues`에만 넣고 끝내지 않는다.

```tsx
useForm({
  defaultValues: {
    speciesName: catchLog?.speciesName,
  },
});
```

route param 검증 없이 요청하지 않는다.

```tsx
const { id } = useLocalSearchParams();
useGetCatchLog(+id);
```

SVG가 아닌 URL을 `SvgUri`에 넣지 않는다.

```tsx
<SvgUri uri={pngUrl} />
```
