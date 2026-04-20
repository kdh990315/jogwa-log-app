# 배포와 분석

조과로그는 1차 MVP 완료 후 iOS App Store와 Samsung Galaxy Store 배포를 목표로 한다.

앱 사용 데이터 분석은 Google Analytics for Firebase를 우선 검토한다. 사용자가 말하는 "구글 애널리틱스"는 모바일 앱에서는 보통 Firebase 기반 Google Analytics를 의미한다.

## 1차 배포 목표

1차 MVP 완료 후 배포 대상:

- iOS: Apple App Store
- Android: Samsung Galaxy Store

추후 검토:

- Google Play Store
- TestFlight 공개 테스트
- Galaxy Store 베타 테스트

## iOS App Store 배포 기준

iOS 배포는 Apple Developer 계정과 App Store Connect를 기준으로 한다.

필요한 것:

- Apple Developer 계정
- `app.json` 또는 `app.config.ts`의 iOS bundle identifier
- production iOS build
- App Store Connect 앱 등록
- 앱 이름, 설명, 키워드, 카테고리
- 스크린샷
- 개인정보 처리방침 URL
- 앱 심사용 계정 또는 demo mode
- 광고, AI, 위치, 사진 권한 사용 설명

Expo 사용 시:

- EAS Build로 production build를 만든다.
- EAS Submit은 iOS build를 App Store Connect로 업로드할 수 있다.
- TestFlight 업로드와 App Store 심사는 다르다. TestFlight에 올라갔다고 자동 출시되는 것이 아니다.

주의:

- 로그인 기능이 있으면 Apple 리뷰어가 앱을 확인할 수 있는 demo account 또는 demo mode를 준비한다.
- placeholder, 깨진 링크, 임시 텍스트, 동작하지 않는 기능이 남아 있으면 안 된다.
- Gemini AI, 사진 업로드, 위치 정보, 광고 SDK를 사용하면 개인정보 처리방침과 권한 설명을 명확히 준비한다.

## Samsung Galaxy Store 배포 기준

Galaxy Store 배포는 Samsung Seller Portal을 기준으로 한다.

필요한 것:

- Samsung account
- Seller Portal 등록
- 앱 등록
- Android package name
- production Android build
- AAB 또는 APK binary
- 앱 이름, 설명, 카테고리
- 스크린샷과 아이콘
- 개인정보 처리방침 URL
- 지원 국가/지역
- 가격 정책

주의:

- EAS Submit은 기본적으로 Apple App Store와 Google Play Store 제출 자동화가 중심이다. Galaxy Store는 Seller Portal 업로드 또는 Samsung Developer API를 별도로 검토한다.
- Galaxy Store는 AAB 업로드를 지원하지만, Play Asset Delivery / Play Feature Delivery 같은 Google Play 전용 기능은 주의한다.
- Galaxy Store 심사용으로 Samsung 기기에서 조과 등록, 이미지 업로드, AI 판별, 위치 권한 흐름을 실제 테스트한다.
- 광고 SDK, Firebase, Supabase, 카카오지도, 소셜 로그인 동작이 Samsung 기기에서 정상인지 확인한다.

## 배포 전 체크리스트

공통:

- 앱 이름과 아이콘이 확정되어 있다.
- production 환경의 Supabase URL과 anon key가 설정되어 있다.
- service role key, Gemini API key, 쿠팡 파트너스 secret key가 앱 코드에 없다.
- 개인정보 처리방침 URL이 있다.
- 위치, 사진, 카메라 권한 설명이 실제 기능과 맞다.
- 로그인, 조과 등록, AI 판별, 도감, 내 조과 목록이 실제 기기에서 동작한다.
- 빈 화면, 오류 화면, 네트워크 실패 상태가 처리되어 있다.
- `npm run lint`와 `npx --no-install tsc --noEmit`를 통과한다.

iOS:

- iOS bundle identifier가 확정되어 있다.
- Apple 로그인 요구사항을 확인했다.
- App Store Connect 앱 정보와 스크린샷이 준비되어 있다.
- TestFlight에서 smoke test를 완료했다.

Galaxy Store:

- Android package name이 확정되어 있다.
- AAB/APK signing 전략이 정해져 있다.
- Samsung Seller Portal 등록 정보가 준비되어 있다.
- Samsung 기기에서 smoke test를 완료했다.

## Google Analytics for Firebase

앱 분석은 Google Analytics for Firebase를 우선 검토한다.

목표:

- 사용자가 조과를 얼마나 자주 등록하는지 파악한다.
- AI 어종 판별기를 얼마나 사용하는지 파악한다.
- 조과 등록 step에서 이탈이 많은 지점을 찾는다.
- 도감 기능이 실제로 사용되는지 파악한다.
- 광고/제휴 수익화가 UX를 해치지 않는지 판단한다.

## 이벤트 설계

이벤트 이름은 소문자 snake_case를 사용한다.

권장 이벤트:

```text
login_success
catch_log_start
catch_log_step1_complete
catch_log_step2_complete
catch_log_step3_complete
catch_log_create_success
catch_log_create_fail
ai_species_start
ai_species_image_selected
ai_species_detect_success
ai_species_detect_fail
ai_species_apply_to_log
species_dex_view
species_dex_detail_view
ad_banner_impression
coupang_link_click
```

이벤트 parameter 예시:

```text
provider
water_type
species_id
species_name
tide
weather
has_image
used_ai_detection
step
error_code
```

주의:

- 사용자의 정확한 위치 좌표를 analytics event parameter로 보내지 않는다.
- 사진 URL, 이미지 path, 메모 원문을 analytics에 보내지 않는다.
- 개인 식별이 가능한 값을 이벤트에 넣지 않는다.
- 낚시 위치 데이터는 조과 기록 DB에는 저장하더라도 분석 이벤트에는 최소화한다.
- 광고/개인화 분석을 도입하면 개인정보 처리방침과 동의 흐름을 다시 확인한다.

## 분석 도입 시점

1차 MVP 개발 중:

- 이벤트 이름과 기준만 문서화한다.
- 코드에는 분석 wrapper를 둘 수 있지만 실제 SDK 연결은 배포 직전 또는 베타 단계에서 확정한다.

베타 테스트 단계:

- Firebase Analytics를 연결한다.
- 조과 등록 funnel 이벤트를 우선 심는다.
- AI 판별 성공/실패 이벤트를 심는다.
- 도감 조회 이벤트를 심는다.

출시 이후:

- 이벤트가 너무 많으면 정리한다.
- 조과 등록 이탈률을 보고 step UX를 개선한다.
- AI 판별 실패율을 보고 이미지 업로드/Edge Function을 개선한다.

## 공식 문서 확인 규칙

배포와 분석은 정책이 자주 바뀐다. 구현 직전에는 최신 공식 문서를 다시 확인한다.

- Apple App Store Review Guidelines
- App Store Connect 문서
- Expo EAS Build / EAS Submit 문서
- Samsung Galaxy Store Seller Portal 문서
- Samsung Galaxy Store binary / signing 관련 문서
- Firebase Google Analytics 문서
- Apple App Tracking Transparency 관련 문서
- Google Play / Samsung / Apple 개인정보 정책 요구사항

