# 커뮤니티 앱 코드 스타일 리팩토링 가이드

이 문서는 현재 `community` Expo React Native 프로젝트의 코드 패턴을 다른 프로젝트에 옮길 때 참고하기 위한 스타일 가이드다.

목표는 “기능은 화면에 몰아넣지 않고, 화면은 조립에 집중하며, 서버 상태와 폼 처리는 정해진 위치에서 반복 가능하게 관리한다”이다.

## 선호하는 폴더/파일 분리 방식

기본 폴더 책임은 다음처럼 나눈다.

```text
app/              Expo Router 화면과 route layout
components/       재사용 가능한 UI 조각
api/              axios 기반 순수 API 요청 함수
hooks/queries/    React Query hook
hooks/            React Query와 무관한 일반 custom hook
constants/        색상, query key, 상수
types/            도메인 타입과 DTO 타입
utils/            SecureStore, header, image 같은 유틸
i18n/             번역 리소스
doc/              문서
```

선호하는 의존 흐름:

```text
app/*
  -> components/*
  -> hooks/queries/*
    -> api/*
      -> axiosInstance

app/*
  -> FormProvider
    -> input component
      -> useFormContext + Controller
```

원칙:

- `app` 화면 파일은 라우팅, 화면 조립, 화면 단위 이벤트 연결에 집중한다.
- 서버 요청 URL과 axios 호출은 `api`에 둔다.
- React Query의 `useQuery`, `useMutation`, 캐시 무효화는 `hooks/queries`에 둔다.
- 폼 input은 `components/*Input.tsx`로 분리하고 `useFormContext`로 form과 연결한다.
- 색상은 직접 hex를 흩뿌리지 않고 `constants`의 `colors`를 쓴다.

## React Native 화면 컴포넌트 예시

화면 컴포넌트는 “데이터 준비 + submit handler + 화면 조립” 정도만 담당한다.

좋은 형태:

```tsx
export default function WriteScreen() {
  const navigation = useNavigation();
  const createPost = useCreatePost();
  const postForm = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      imageUris: [],
      isVoteOpen: false,
      isVoteAttached: false,
      voteOptions: [{ displayPriority: 0, content: "" }],
    },
  });

  const onSubmit = (data: FormValues) => {
    createPost.mutate(data);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <CustomButton
          label="저장"
          size="medium"
          variant="standard"
          onPress={postForm.handleSubmit(onSubmit)}
        />
      ),
    });
  });

  return (
    <FormProvider {...postForm}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <TitleInput />
        <DescriptionInput />
        <VoteAttached />
      </KeyboardAwareScrollView>
    </FormProvider>
  );
}
```

선호 포인트:

- 화면 이름은 `WriteScreen`, `PostDetailScreen`, `LoginScreen`처럼 `Screen` suffix를 붙인다.
- `type FormValues` 또는 `type LoginForm`을 화면 가까이에 둔다.
- submit 함수는 `onSubmit`, 버튼/이벤트 함수는 `handlePressLike`, `handleRefresh`처럼 이름 붙인다.
- navigation header 버튼도 화면에서 연결하되, 버튼 UI 자체는 `CustomButton` 같은 컴포넌트를 재사용한다.
- 스타일은 파일 하단 `StyleSheet.create`로 모은다.

## 컴포넌트 분리 감각

컴포넌트는 화면보다 작은 단위로 쪼개되, 너무 추상적인 공통 컴포넌트부터 만들지 않는다.

좋은 분리:

```text
FeedList
  -> FeedItem
    -> Profile
    -> ImagePreviewList
    -> Vote

WriteScreen
  -> TitleInput
  -> DescriptionInput
  -> VoteAttached
  -> ImagePreviewList
  -> PostWriteFooter
  -> VoteModal
```

선호하는 컴포넌트 기준:

- 반복되는 UI는 분리한다. 예: `FeedItem`, `CommentItem`, `AvatarItem`.
- form field는 input 단위로 분리한다. 예: `EmailInput`, `PasswordInput`, `TitleInput`.
- 공통 primitive는 제한적으로 둔다. 예: `InputField`, `CustomButton`.
- props interface는 컴포넌트 위에 둔다.
- children보다 명확한 prop이 읽기 좋으면 `rightChild`, `option`처럼 이름 있는 prop을 쓴다.

## Custom Hook을 어느 정도까지 쪼개는지

hook은 크게 두 종류로 나눈다.

```text
hooks/queries/useGetPost.ts       서버 상태 조회
hooks/queries/useCreatePost.ts    서버 상태 변경
hooks/useKeyboard.ts              디바이스/UI 상태
```

일반 custom hook은 React Native 이벤트나 앱 내부 상태를 감싼다.

```tsx
function useKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const onShow = () => setIsKeyboardVisible(true);
    const onHide = () => setIsKeyboardVisible(false);

    const showListener = Keyboard.addListener("keyboardDidShow", onShow);
    const hideListener = Keyboard.addListener("keyboardDidHide", onHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return { isKeyboardVisible };
}
```

쪼개는 기준:

- API 하나 또는 도메인 행동 하나는 query hook 하나로 만든다.
- 화면 안에서 2곳 이상 반복되거나 라이프사이클 정리가 필요하면 일반 hook으로 뺀다.
- 단순 `useState` 한 줄까지 억지로 hook으로 빼지는 않는다.
- `useAuth`처럼 인증 상태, 로그인, 회원가입, 로그아웃을 한 도메인 hook으로 묶는 것은 허용한다.

## API/service 함수 스타일

API 함수는 React와 분리된 순수 async 함수로 작성한다.

좋은 형태:

```tsx
const getPost = async (postId: number): Promise<Post> => {
  const { data } = await axiosInstance.get(`/posts/${postId}`);
  return data;
};

type RequestUpdatePost = {
  postId: number;
  body: CreatePostDto;
};

const updatePost = async ({
  postId,
  body,
}: RequestUpdatePost): Promise<number> => {
  const { data } = await axiosInstance.patch(`/posts/${postId}`, body);
  return data;
};
```

선호 포인트:

- 파일은 도메인별로 나눈다. 예: `api/post.ts`, `api/auth.ts`, `api/comment.ts`.
- 함수명은 HTTP 메서드보다 도메인 행동이 드러나게 한다. 예: `getPosts`, `createPost`, `editProfile`.
- 응답 타입은 가능한 `Promise<Post>`처럼 명시한다.
- 요청 body가 복잡하면 `RequestUpdatePost` 같은 type을 만든다.
- axios instance는 `api/axios.ts`에서 만들고 API 함수는 그 instance만 사용한다.
- API 함수 안에서는 Toast, router, query invalidation을 하지 않는다. 그런 부수효과는 query hook에서 처리한다.

## React Query Hook 스타일

조회 hook은 query key와 API 함수를 감싸는 얇은 레이어로 둔다.

```tsx
function useGetPost(id: number) {
  return useQuery({
    queryFn: () => getPost(+id),
    queryKey: postKeys.detail(id),
    enabled: Boolean(id),
  });
}
```

무한 스크롤은 `useInfiniteQuery`를 쓴다.

```tsx
const useGetInfinitePost = () => {
  return useInfiniteQuery({
    queryFn: ({ pageParam }) => getPosts(pageParam),
    queryKey: postKeys.list(),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const lastPost = lastPage[lastPage.length - 1];
      return lastPost ? allPages.length + 1 : undefined;
    },
  });
};
```

mutation hook은 성공 후 이동, 캐시 갱신, Toast 같은 앱 반응을 담당한다.

```tsx
const useCreatePost = () => {
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      router.replace("/");
      queryClient.invalidateQueries({
        queryKey: postKeys.lists(),
      });
    },
  });
};
```

query key는 `constants/queryKeys.ts`에 factory 형태로 둔다.

```tsx
const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: () => [...postKeys.lists(), "all"] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (postId: number) => [...postKeys.details(), postId] as const,
};
```

선호 포인트:

- query hook 파일명은 `useGetPost`, `useCreatePost`, `useDeletePost`처럼 행동이 드러나게 한다.
- query key는 문자열 배열을 직접 화면에 쓰지 않는다.
- mutation 성공 후에는 관련 query를 명확히 invalidate 또는 setQueryData 한다.
- optimistic update가 필요하면 `onMutate`, `onError`, `onSuccess`를 hook 내부에 모은다.

## Form 처리 방식

form은 `react-hook-form`을 사용한다.

화면:

```tsx
const loginForm = useForm<LoginForm>({
  defaultValues: {
    email: "",
    password: "",
  },
});

return (
  <FormProvider {...loginForm}>
    <EmailInput />
    <PasswordInput />
    <FixedBottomCTA
      label="로그인하기"
      onPress={loginForm.handleSubmit(onSubmit)}
    />
  </FormProvider>
);
```

input 컴포넌트:

```tsx
const TitleInput = () => {
  const { control, setFocus } = useFormContext();

  return (
    <Controller
      name="title"
      control={control}
      rules={{
        validate: (data: string) => {
          if (!data) return "제목은 필수입니다.";
          return true;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <InputField
          label="제목"
          value={value}
          onChangeText={onChange}
          error={error?.message}
          returnKeyType="next"
          onSubmitEditing={() => setFocus("description")}
        />
      )}
    />
  );
};
```

선호 포인트:

- `useForm`은 화면에서 생성한다.
- `FormProvider`로 하위 input에 context를 내려준다.
- 각 input은 `Controller + useFormContext`로 자기 validation과 UI 연결을 담당한다.
- 에러 문구는 input 컴포넌트 근처에서 관리한다.
- submit은 `form.handleSubmit(onSubmit)`으로만 통과시킨다.
- keyboard 대응이 필요한 화면은 `KeyboardAwareScrollView` 또는 `KeyboardAvoidingView`를 사용한다.

## 에러, Loading, Empty UI 처리 패턴

현재 프로젝트의 패턴은 단순하고 화면 흐름을 막지 않는 쪽에 가깝다.

리스트 empty:

```tsx
<FlatList
  data={posts?.pages.flat()}
  ListEmptyComponent={
    <Text style={styles.emptyText}>
      {isFetching
        ? "검색 중입니다."
        : submitKeyword
          ? "검색 결과가 없습니다."
          : "검색어를 입력해 주세요."}
    </Text>
  }
/>
```

상세 화면 loading/error:

```tsx
const { data: post, isPending, isError } = useGetPost(+id);

if (isPending || isError) return <></>;
```

mutation error:

```tsx
onError: (error: ResponseError) => {
  Toast.show({
    type: "error",
    text1: error.response?.data.message,
  });
}
```

권장 보완:

- 리스트는 `ListEmptyComponent`로 loading, empty, 안내 문구를 함께 처리한다.
- 버튼 mutation 중에는 `disabled={mutation.isPending}`를 건다.
- 인증/폼 에러는 `Toast.show` 또는 input error message로 보여준다.
- 상세 화면의 `return <></>`는 강의 코드 스타일에는 맞지만, 실제 서비스에서는 `LoadingView`, `ErrorView` 같은 가벼운 컴포넌트로 보완하는 편이 좋다.

## 네이밍 취향

파일명:

- 화면: `app/post/write.tsx`, `app/post/[id].tsx`, `app/auth/login.tsx`
- 컴포넌트: `FeedItem.tsx`, `SearchFeedList.tsx`, `CustomButton.tsx`
- form input: `EmailInput.tsx`, `PasswordInput.tsx`, `TitleInput.tsx`
- query hook: `useGetPost.ts`, `useCreatePost.ts`, `useGetInfinitePost.ts`
- api: `post.ts`, `auth.ts`, `comment.ts`

함수/변수명:

- 이벤트 핸들러: `handlePressLike`, `handleRefresh`, `handleEndReached`
- submit 함수: `onSubmit`
- mutation 변수: `createPost`, `updatePost`, `likePost`
- form instance: `loginForm`, `postForm`, `profileForm`
- boolean: `isDetail`, `isRefreshing`, `isKeyboardVisible`, `hasNextPage`
- props type: `FeedItemProps`, `UserFeedListProps`
- request type: `RequestUpdatePost`

선호하는 스타일:

- 컴포넌트는 `export default function ComponentName()` 또는 하단 `export default ComponentName`을 사용한다.
- type/interface 이름은 역할이 바로 보이게 한다.
- `data`만 남기지 말고 화면에서는 `data: posts`, `data: post`처럼 alias를 준다.
- `id`는 route params에서 오면 숫자로 변환해서 쓴다. 예: `+id`.

## 이런 코드는 싫다

### 화면에 API 요청을 직접 쓰는 코드

비선호:

```tsx
export default function PostDetailScreen() {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    axios.get(`/posts/${id}`).then((response) => {
      setPost(response.data);
    });
  }, [id]);

  const handleLike = async () => {
    await axios.post(`/likes/${post.id}`);
    const response = await axios.get(`/posts/${id}`);
    setPost(response.data);
  };
}
```

선호:

```tsx
const { data: post } = useGetPost(+id);
const likePost = useLikePost();
```

이유:

- 화면이 axios URL, loading, cache refresh를 전부 알게 되면 유지보수가 어렵다.
- 같은 데이터를 다른 화면에서 재사용할 때 캐시 일관성이 깨진다.

### query key를 화면마다 직접 쓰는 코드

비선호:

```tsx
queryClient.invalidateQueries({
  queryKey: ["posts", "list", "all"],
});
```

선호:

```tsx
queryClient.invalidateQueries({
  queryKey: postKeys.list(),
});
```

이유:

- query key 문자열이 흩어지면 오타나 구조 변경에 취약하다.

### 하나의 화면 파일에 모든 input을 몰아넣는 코드

비선호:

```tsx
<Controller name="email" render={...} />
<Controller name="password" render={...} />
<Controller name="passwordConfirm" render={...} />
<Controller name="nickname" render={...} />
```

선호:

```tsx
<FormProvider {...signupForm}>
  <EmailInput />
  <PasswordInput />
  <PasswordConfirm />
  <NicknameInput />
</FormProvider>
```

이유:

- validation, placeholder, focus 이동, error UI가 input 파일에 모여 재사용하기 쉽다.

### 스타일을 JSX에 계속 인라인으로 쓰는 코드

비선호:

```tsx
<View style={{ padding: 16, backgroundColor: "#fff", flex: 1 }}>
  <Text style={{ fontSize: 16, color: "#333" }}>내용</Text>
</View>
```

선호:

```tsx
<View style={styles.container}>
  <Text style={styles.description}>내용</Text>
</View>
```

이유:

- 조건부로 한두 개 스타일을 넣는 것은 괜찮지만, 화면 전체 스타일은 `StyleSheet.create`에 모아야 읽기 쉽다.
- 색상은 `colors.WHITE`, `colors.GRAY_700`처럼 상수로 통일한다.

### loading, empty, error를 전혀 구분하지 않는 코드

비선호:

```tsx
if (!posts) return null;
```

선호:

```tsx
<FlatList
  data={posts?.pages.flat()}
  ListEmptyComponent={
    <Text style={styles.emptyText}>
      {isFetching ? "검색 중입니다." : "검색 결과가 없습니다."}
    </Text>
  }
/>
```

이유:

- 사용자 입장에서 빈 화면은 loading인지, 에러인지, 데이터가 없는지 알 수 없다.

### mutation 이후 캐시 처리를 화면에 흩뿌리는 코드

비선호:

```tsx
const mutation = useMutation({
  mutationFn: createPost,
});

const onSubmit = async (data) => {
  await mutation.mutateAsync(data);
  queryClient.invalidateQueries({ queryKey: postKeys.lists() });
  router.replace("/");
};
```

선호:

```tsx
const createPost = useCreatePost();

const onSubmit = (data: FormValues) => {
  createPost.mutate(data);
};
```

이유:

- 성공 후 이동과 캐시 무효화는 `useCreatePost`라는 도메인 행동 안에 있어야 다른 화면에서도 같은 동작을 기대할 수 있다.

## 리팩토링할 때 적용 순서

1. `api` 함수를 도메인별로 먼저 분리한다.
2. `constants/queryKeys.ts`에 query key factory를 만든다.
3. `hooks/queries`에 조회/변경 hook을 만든다.
4. 화면에서 axios, queryClient 직접 사용을 제거한다.
5. form 화면은 `FormProvider`로 감싸고 input 컴포넌트를 `Controller` 기반으로 분리한다.
6. 반복되는 list/item/input/button UI를 `components`로 뺀다.
7. loading, empty, error, disabled 상태를 화면 흐름에 맞게 추가한다.

## 한 줄 기준

화면은 조립하고, 컴포넌트는 UI를 책임지고, API는 요청만 하고, React Query hook은 서버 상태의 규칙을 책임진다.

## 조과로그에 적용할 때 보정할 점

이 문서는 `community` 프로젝트 기준이므로 조과로그에 적용할 때는 아래 기준을 우선한다.

### Supabase 프로젝트 기준

`community`의 `axiosInstance` 위치는 조과로그에서는 `api/supabase.ts`와 도메인별 Supabase service 함수로 치환한다.

```text
app/*
  -> components/*
  -> hooks/queries/*
    -> api/*
      -> supabase
```

조과로그에서는 다음 원칙을 더 강하게 적용한다.

- 화면 컴포넌트에서 `supabase.from(...)`, `supabase.auth...`, `supabase.storage...`, `supabase.functions.invoke(...)`를 직접 호출하지 않는다.
- Supabase 응답의 `data`, `error`, row-to-domain mapping은 `api/`에서 정리한다.
- private Storage signed URL 생성도 한 곳에 모은다.
- API 함수는 Toast, Alert, router, query invalidation을 하지 않는다.
- service role key, Gemini API key는 앱 코드에 절대 넣지 않는다.

### Expo Router 기준

`useNavigation().setOptions`보다 Expo Router route 구조를 우선한다.

- 화면 이동은 `router.push`, 현재 화면 대체는 `router.replace`, 뒤로가기는 `router.back`을 쓴다.
- 동적 route param은 `useLocalSearchParams`로 읽고, 숫자 변환 전 유효성을 검사한다.
- `+id`는 짧지만 invalid param을 숨기기 쉬우므로 조과로그에서는 `Number(...) + Number.isFinite(...)`를 선호한다.

```tsx
const { id } = useLocalSearchParams<Record<string, string | string[]>>();
const catchLogId = Number(normalizeRouteParam(id));
const isValidCatchLogId = Number.isFinite(catchLogId);

const catchLogQuery = useCatchLog(catchLogId, isValidCatchLogId);
```

### Mutation side effect 기준

캐시 무효화는 React Query hook 내부에 둔다. 단, 화면 전환과 Alert은 화면 UX 맥락이 강하면 화면에 남겨도 된다.

```tsx
const createCatchLog = useCreateCatchLog();

async function onSubmit(values: CatchFormValues) {
  const createdCatchLog = await createCatchLog.mutateAsync(
    buildCreateCatchLogInput(values),
  );

  router.replace(`/catch-log/${createdCatchLog.id}`);
}
```

판단 기준:

- 여러 화면에서 같은 mutation 결과가 같은 navigation을 가져야 하면 hook 안에 둔다.
- 현재 화면의 Alert 문구, replace/back 선택, step reset처럼 화면 맥락에 가까우면 화면에 둔다.
- query invalidation, optimistic update, rollback은 hook 안에 둔다.

### 도메인 값과 표시 값 분리

조과로그는 향후 통계를 전제로 하므로 API/domain 타입에는 표시 문자열보다 구조화된 값을 우선 둔다.

비선호:

```tsx
interface CatchLogListItem {
  date: string; // "2026.05.12"
  tide: string; // "물때 미입력" 같은 fallback 포함
}
```

선호:

```tsx
interface CatchLogListItem {
  fishingDate: string; // "2026-05-12"
  tide: string | null;
}
```

표시용 문자열은 화면 또는 view model 유틸에서 만든다.

```tsx
const dateLabel = formatFishingDateLabel(catchLog.fishingDate);
const tideLabel = catchLog.tide ?? getFallbackTideLabel(catchLog.waterType);
```

### 대형 화면 리팩토링 기준

한 화면 파일이 커졌을 때는 아래 순서로 분리한다.

1. 순수 변환 함수: `buildCreateCatchLogInput`, `formatFishingDateLabel`
2. 화면 전용 hook: `useCatchRegisterForm`, `useCatchRegisterPhotos`
3. section 컴포넌트: `CatchRegisterStepTwo`, `CatchRegisterPhotoSection`
4. 공통 컴포넌트: 실제 사용처가 둘 이상일 때만 승격

분리 기준:

- `useEffect`가 4개 이상이면 lifecycle 책임을 hook으로 빼는 것을 검토한다.
- Modal, picker, action sheet가 화면 본문과 함께 있으면 별도 컴포넌트 후보로 본다.
- submit payload 생성, route param 정규화, 날짜/숫자 sanitize는 화면 하단에 쌓지 말고 util 또는 화면 hook으로 옮긴다.
- 단순 JSX 20줄을 줄이기 위한 과한 추상화는 하지 않는다.

### Supabase 저장 흐름 기준

DB row와 Storage object를 함께 바꾸는 기능은 실패 지점을 먼저 설계한다.

- create: DB insert, Storage upload, image row insert 중 어디서 실패해도 orphan cleanup 경로가 있어야 한다.
- update: 본문 update와 이미지 delete/upload/sort 변경이 부분 성공하지 않도록 순서와 보상 로직을 문서화한다.
- delete: DB delete 성공 후 Storage delete 실패는 사용자 데이터 접근권한과 재시도 전략을 함께 검토한다.
- 복잡해지면 Edge Function 또는 Postgres RPC로 서버 쪽 트랜잭션 경계를 만드는 것을 검토한다.

### 타입 체크 범위

조과로그의 `tsconfig.json`은 앱 타입체크와 Edge Function 타입체크가 분리될 수 있다.

- 앱 코드는 `npx --no-install tsc --noEmit`로 확인한다.
- Supabase Edge Function은 Deno 타입체크 명령을 별도로 둔다.
- Edge Function이 타입체크 대상에서 제외되어 있으면 최종 답변에 확인하지 못한 범위를 명시한다.

### 리팩토링 단위와 브랜치 기준

리팩토링은 한 번에 크게 뒤집지 않고, 동작 단위로 브랜치를 나눈다.

브랜치 예시:

```text
refactor/catch-log-save-flow
refactor/ai-prediction-linking
refactor/catch-register-form-split
refactor/catch-log-domain-date
refactor/species-analysis-split
```

원칙:

- 한 브랜치에서는 하나의 문제 축만 다룬다.
- 기능 변경, 리팩토링, 포맷팅, 의존성 업그레이드를 한 커밋/PR에 섞지 않는다.
- 대형 화면 분리는 먼저 순수 함수와 hook을 빼고, 그 다음 section 컴포넌트를 뺀다.
- DB schema나 Storage policy 변경이 들어가면 UI 리팩토링과 분리한다.
- 리팩토링 브랜치의 완료 기준은 기존 동작 유지, lint 통과, typecheck 통과다.

커밋을 나눌 때는 아래 순서를 선호한다.

1. 타입/순수 함수 추출
2. API/service 정리
3. query hook 정리
4. 화면 조립 코드 정리
5. 검증 및 작은 cleanup

### 파일 크기 기준

줄 수는 절대 규칙은 아니지만 리팩토링 신호로 사용한다.

- 300줄 이상: 반복 JSX, helper 함수, style 중 분리 후보를 찾는다.
- 500줄 이상: section 컴포넌트 분리를 검토한다.
- 800줄 이상: 화면 전용 hook 분리를 우선 검토한다.
- 1000줄 이상: form, modal, list, submit, data mapping 책임을 반드시 나눈다.

단, 한 번에 줄 수를 줄이는 것이 목적은 아니다. 먼저 런타임 위험이 큰 책임부터 분리한다.

우선순위:

```text
저장/수정/삭제 데이터 무결성
  -> route param과 invalid state
  -> form validation과 submit payload
  -> loading/empty/error UI
  -> 반복 JSX와 스타일 정리
```

### 타입과 DTO 네이밍 기준

DB row, API 입력, domain model, 화면 form, 화면 표시 모델을 섞지 않는다.

권장 이름:

```text
CatchLogRow                 Supabase row shape
CatchImageRow               Supabase row shape
CreateCatchLogInput         api create input
UpdateCatchLogInput         api update input
CatchLog                    normalized domain model
CatchLogListItem            list domain item
CatchLogDetailItem          detail domain item
CatchFormValues             React Hook Form values
CatchLogListViewItem        화면 렌더링 전용 display item
CatchLogRouteParams         route param shape
```

원칙:

- `Row` 타입은 DB 컬럼명 snake_case를 그대로 따른다.
- `Input` 타입은 API/service 함수가 받는 값이다.
- `FormValues`는 문자열 input과 nullable UI 상태를 그대로 담는다.
- domain/view 타입은 camelCase를 사용한다.
- 화면 표시용 fallback 문자열은 domain 타입에 넣지 않는다.
- Supabase `.returns<T>()`에 넣는 타입은 실제 select 컬럼과 맞아야 한다.

비선호:

```tsx
interface CatchLog {
  date: string; // 화면 표시용
  tide: string; // fallback 포함
  point: string; // fallback 포함
}
```

선호:

```tsx
interface CatchLog {
  fishingDate: string;
  tide: string | null;
  pointName: string | null;
}
```

### 에러 처리 기준

에러 처리는 레이어별 책임을 나눈다.

```text
api/*
  -> Supabase/API error를 throw
  -> 필요한 경우 도메인 error message로 normalize

hooks/queries/*
  -> cache invalidate, optimistic update, rollback
  -> mutation 상태 노출

app/* 또는 components/*
  -> Alert, Toast, error view, retry button
  -> 사용자에게 보여줄 문구 결정
```

원칙:

- `api/` 함수에서 `Alert.alert`, Toast, router를 호출하지 않는다.
- 화면은 `getUserErrorMessage` 같은 변환 함수를 통해 사용자 문구를 만든다.
- retry가 가능한 조회 화면에는 retry 버튼을 둘 수 있다.
- mutation 중복 실행을 막기 위해 submit 버튼은 `isPending` 동안 disabled 처리한다.
- delete처럼 파괴적 행동은 확인 Alert를 화면에서 처리한다.

### 검증 기준

코드 리팩토링 후 기본 검증:

```bash
npm run lint
npx --no-install tsc --noEmit
```

UI 또는 라우팅 변경 시 추가 확인:

- 기대한 route로 진입되는지 확인한다.
- header가 중복으로 보이지 않는지 확인한다.
- `router.push`, `router.replace`, `router.back` 선택이 의도와 맞는지 확인한다.
- invalid route param일 때 query가 실행되지 않는지 확인한다.
- loading, empty, error 상태가 구분되는지 확인한다.
- Android safe area, keyboard, local server URL 이슈를 고려한다.
- `FlatList.data`에 `undefined`나 invalid item이 들어가지 않게 한다.

Supabase 변경 시 추가 확인:

- migration SQL이 남아 있는지 확인한다.
- 사용자 개인 데이터 table에는 RLS가 켜져 있는지 확인한다.
- RLS policy에서 `auth.uid()`는 `(select auth.uid())` 형태를 우선한다.
- RLS에 쓰는 `user_id` 같은 컬럼은 인덱스를 확인한다.
- FK 컬럼의 인덱스를 확인한다.
- Storage bucket public/private 결정과 object policy를 확인한다.
- service role key와 외부 API key가 앱 코드에 없는지 확인한다.

Edge Function 변경 시 추가 확인:

- secret은 환경 변수에서만 읽는다.
- 요청 body는 runtime validation 후 사용한다.
- 외부 API 응답은 normalize 후 앱에 반환한다.
- 실패 시 사용자에게 보일 message와 로그용 error detail을 분리한다.
- Storage upload가 선행되는 흐름은 실패 cleanup 또는 재시도 정책을 둔다.

### 폼 리팩토링 기준

React Hook Form 기반 화면은 아래 역할 분리를 따른다.

```text
screen
  -> useForm 생성
  -> FormProvider
  -> submit handler
  -> route param 적용

field component
  -> useFormContext
  -> Controller
  -> validation
  -> input UI

pure helper
  -> sanitize
  -> build mutation input
  -> server data -> form values mapping
```

원칙:

- 수정 화면에서 서버 데이터가 늦게 들어오면 `defaultValues`만 믿지 않고 `form.reset(...)`을 쓴다.
- 숫자 input은 form에서는 string으로 관리하고 submit 직전에 number로 변환한다.
- 변환 전에 빈 문자열, `NaN`, 음수, 좌표 범위를 검증한다.
- 배열 필드는 복잡해지면 `useFieldArray`를 쓴다.
- `useWatch`로 만든 파생 값은 submit source of truth가 아니라 UI 상태 계산에만 쓴다.

### 금지 패턴

조과로그 리팩토링 중 아래 패턴은 피한다.

- 화면에서 Supabase client 직접 호출
- Edge Function을 화면에서 직접 호출
- 표시 문자열을 통계 계산 source로 사용
- route param을 검증 없이 query/mutation에 넣기
- query key 배열을 화면이나 mutation에서 직접 작성
- mutation 성공 후 cache 처리를 화면마다 직접 작성
- DB row와 Storage object를 따로 바꾸면서 실패 보상 없는 코드
- `any`나 무리한 type assertion으로 타입 에러 덮기
- `catch`에서 에러를 삼키고 사용자에게 성공처럼 보이게 하기
- loading/error/empty를 `return null` 하나로 처리하기
- 공통 컴포넌트를 사용처 하나뿐인데 과하게 일반화하기
