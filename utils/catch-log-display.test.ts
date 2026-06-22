import {
  formatCatchLogDateLabel,
  formatCatchLogShortDateLabel,
  formatCatchSize,
  getCatchLogPointLabel,
} from "@/utils/catch-log-display";

describe("조과 표시 유틸", () => {
  it("저장 날짜가 화면 표시용 날짜로 변환되는지 확인", () => {
    expect(formatCatchLogDateLabel("2026-05-13")).toBe("2026.05.13");
    expect(formatCatchLogShortDateLabel("2026-05-13")).toBe("05.13");
    expect(formatCatchLogShortDateLabel("5-13")).toBe("5-13");
  });

  it("유효한 조과 크기에 단위를 붙이는지 확인", () => {
    expect(formatCatchSize(42)).toBe("42cm");
    expect(formatCatchSize(null)).toBeNull();
    expect(formatCatchSize(0)).toBeNull();
  });

  it("빈 포인트는 기본 문구로 대체되는지 확인", () => {
    expect(getCatchLogPointLabel(null)).toBe("포인트 미입력");
  });

  it("입력된 포인트는 앞뒤 공백만 제거해서 유지되는지 확인", () => {
    expect(getCatchLogPointLabel("  동방파제  ")).toBe("동방파제");
  });
});
