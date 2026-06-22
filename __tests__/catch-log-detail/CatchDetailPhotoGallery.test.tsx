import { fireEvent, render, screen } from "@testing-library/react-native";
import { Modal } from "react-native";

import CatchDetailPhotoGallery from "@/components/catch-log/catch-log-detail/CatchDetailPhotoGallery";

jest.mock("@expo/vector-icons/Ionicons", () => () => null);

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("@/hooks/use-app-theme", () => ({
  useAppTheme: () => ({ isDark: false }),
}));

describe("CatchDetailPhotoGallery", () => {
  it("선택한 사진으로 확대 모달을 열고 닫는다", () => {
    const view = render(
      <CatchDetailPhotoGallery images={["https://example.com/catch.jpg"]} />,
    );

    expect(view.UNSAFE_getByType(Modal).props.visible).toBe(false);

    fireEvent.press(screen.getByLabelText("조과 사진 1 확대"));
    expect(view.UNSAFE_getByType(Modal).props.visible).toBe(true);

    fireEvent.press(screen.getByLabelText("닫기"));
    expect(view.UNSAFE_getByType(Modal).props.visible).toBe(false);
  });
});
