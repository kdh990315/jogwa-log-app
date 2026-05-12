# 지도 입력 UX 의사결정 기록

## 배경

조과 등록 step3는 사용자가 출조 위치를 선택하고, 향후 통계가 가능하도록 위도와 경도를 구조화해 저장하는 화면이다.

초기 목표는 국내 사용자에게 익숙한 Kakao 지도를 우선 검토하는 것이었다. 다만 React Native Expo 앱에서 Kakao JavaScript Map SDK를 사용하려면 WebView 안에 HTML과 SDK 스크립트를 올리는 구조가 필요했다.

## 시도한 접근

### Kakao Maps JavaScript SDK + WebView

구현 방향:

- `react-native-webview`를 추가했다.
- WebView 내부 HTML에 `div#map`을 만들고 Kakao JavaScript SDK를 로드했다.
- Kakao 공식 문서의 기본 지도 생성 흐름에 맞춰 `kakao.maps.load` 이후 `new kakao.maps.Map(...)`을 호출했다.
- 조과 등록 step3에 지도 영역을 연결해 위치 선택 UX를 검토했다.

확인한 점:

- Kakao 지도는 표시 가능했다.
- React Native 화면 안에 WebView를 넣는 방식이라 지도 드래그와 줌 조작감이 네이티브 지도보다 둔했다.
- step3 화면의 ScrollView와 WebView 내부 지도 제스처가 함께 작동하면서 실제 기기에서 사용감이 기대보다 좋지 않았다.
- WebView 방식은 HTML 문자열, Kakao JavaScript SDK 도메인, 환경 변수, native WebView 빌드까지 함께 관리해야 했다.

## 전환 판단

MVP에서 필요한 핵심은 Kakao 장소 데이터가 아니라 사용자가 조과 위치를 빠르게 선택하고 저장하는 것이다.

따라서 1차 MVP에서는 Kakao 지도 브랜드/장소 검색보다 다음 기준을 우선한다.

```text
지도 터치감
  -> 위치 선택 성공률
  -> 구현 안정성
  -> 유지보수 비용
  -> 지도 제공자 특화 기능
```

이 기준에서는 WebView 기반 Kakao 지도보다 `react-native-maps` 기반 네이티브 지도 컴포넌트가 더 적합하다.

## 현재 결정

- Kakao WebView 지도 코드는 제거한다.
- `react-native-webview` 의존성은 제거한다.
- step3에는 임시 placeholder를 두고, 다음 단계에서 `react-native-maps` 기반 위치 선택 컴포넌트로 교체한다.
- 위도/경도 저장 구조는 유지해 향후 지도 컴포넌트 교체 시 데이터 모델을 다시 바꾸지 않도록 한다.

## 후속 작업

### react-native-maps 기본 지도 도입

Kakao WebView 방식 제거 후 Expo 공식 문서 기준으로 `react-native-maps`를 도입했다.

1차 목표:

- 조과 등록 step3에 가장 기본적인 네이티브 지도 컴포넌트를 표시한다.
- 지도 제공자 특화 기능보다 실제 기기에서의 드래그, 줌, 스크롤 충돌 여부를 먼저 확인한다.
- 위치 선택, 마커, 현재 위치, 검색은 기본 지도 렌더링 확인 후 단계적으로 추가한다.

주의:

- `react-native-maps`도 native module이므로 development build 재생성이 필요하다.
- Android 배포 빌드에서 Google Maps를 안정적으로 사용하려면 Google Cloud의 Maps SDK for Android 설정과 API key 연결을 별도로 진행해야 한다.

## 이력서/포트폴리오 메모

사용자 경험 관점에서 지도 입력 방식을 비교 검증했다. Kakao JavaScript SDK를 WebView로 통합해 실제 기기에서 지도 표시와 제스처를 확인했지만, 위치 선택이라는 핵심 작업에서 터치 반응성과 유지보수성이 낮다고 판단했다. 이후 네이티브 지도 컴포넌트 기반으로 전환해 입력 성공률과 조작감을 우선하는 방향으로 개선했다.
