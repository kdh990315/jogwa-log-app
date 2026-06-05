import {
  formatCatchLogDateLabel,
  formatCatchLogShortDateLabel,
  getCatchLogDateValue,
  getCatchLogMemoLabel,
  getCatchLogPointLabel,
  getCatchLogTideLabel,
  getCatchLogWeatherLabel,
} from "@/utils/catch-log-display";

describe("조과 표시 유틸", () => {
  it("저장 날짜가 화면 표시용 날짜로 변환되는지 확인", () => {
    expect(formatCatchLogDateLabel("2026-05-13")).toBe("2026.05.13");
    expect(formatCatchLogShortDateLabel("2026-05-13")).toBe("05.13");
    expect(formatCatchLogShortDateLabel("5-13")).toBe("5-13");
  });

  it("날짜 정렬용 숫자 값이 계산되는지 확인", () => {
    expect(getCatchLogDateValue("2026-05-13")).toBe(20260513);
  });

  it("빈 표시값은 도메인별 기본 문구로 대체되는지 확인", () => {
    expect(getCatchLogMemoLabel("  ")).toBe("메모가 없습니다.");
    expect(getCatchLogPointLabel(null)).toBe("포인트 미입력");
    expect(getCatchLogWeatherLabel("")).toBe("날씨 미입력");
    expect(getCatchLogTideLabel(null, "salt")).toBe("물때 미입력");
    expect(getCatchLogTideLabel(null, "fresh")).toBe("해당없음");
  });

  it("입력된 표시값은 앞뒤 공백만 제거해서 유지되는지 확인", () => {
    expect(getCatchLogMemoLabel("  다음엔 큰 채비  ")).toBe("다음엔 큰 채비");
    expect(getCatchLogPointLabel("  동방파제  ")).toBe("동방파제");
    expect(getCatchLogWeatherLabel("  흐림  ")).toBe("흐림");
    expect(getCatchLogTideLabel("  7물  ", "salt")).toBe("7물");
  });
});
