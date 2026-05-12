export interface SettingsNotice {
  body: string[];
  id: string;
  publishedAt: string;
  statusLabel: string;
  title: string;
}

export const settingsNotices: SettingsNotice[] = [
  {
    body: [
      "안녕하세요. 조과로그 개발자입니다.",
      "조과로그는 낚시 후 흩어지기 쉬운 조과 기록을 한곳에 정확히 남기기 위해 만든 앱입니다. 어종, 마릿수, 크기, 날짜, 물때, 날씨, 위치, 사진을 함께 기록해 나중에도 내 낚시 흐름을 쉽게 돌아볼 수 있도록 준비하고 있습니다.",
      "첫 버전은 내 조과를 빠르게 등록하고, 잡은 어종을 도감처럼 모아보는 경험에 집중합니다. AI 어종 판별은 기록을 돕는 보조 기능으로 제공되며, 최종 어종은 사용자가 직접 확인해 저장하는 방식을 유지합니다.",
      "앞으로 기록 안정성, 사진 관리, 도감 완성도, 계정 보안 순서로 차근차근 다듬어 가겠습니다. 조과로그가 낚시를 다녀온 뒤 가장 먼저 열어보는 기록장이 될 수 있도록 만들겠습니다.",
    ],
    id: "welcome-to-jogwalog",
    publishedAt: "2026.05.11",
    statusLabel: "게시중",
    title: "조과로그를 소개합니다",
  },
];

export function getSettingsNoticeById(
  noticeId: string,
): SettingsNotice | undefined {
  return settingsNotices.find((notice) => notice.id === noticeId);
}
