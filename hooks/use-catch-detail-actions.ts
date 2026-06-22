import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { useDeleteCatchLog } from "@/hooks/queries/use-delete-catch-log";
import { getUserErrorMessage } from "@/utils/user-error-message";

interface CatchDetailActionSheetProps {
  isDeleting: boolean;
  isVisible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

interface UseCatchDetailActionsResult {
  actionSheetProps: CatchDetailActionSheetProps;
  openActionSheet: () => void;
}

const getCatchLogDeleteErrorMessage = (error: unknown) =>
  getUserErrorMessage(
    error,
    "조과 기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );

export const useCatchDetailActions = (
  catchLogId: number,
): UseCatchDetailActionsResult => {
  const router = useRouter();
  const [isActionSheetVisible, setActionSheetVisible] = useState(false);
  const deleteCatchLogMutation = useDeleteCatchLog();

  const closeActionSheet = () => {
    setActionSheetVisible(false);
  };

  const openActionSheet = () => {
    setActionSheetVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCatchLogMutation.mutateAsync(catchLogId);
      Alert.alert("삭제 완료", "조과 기록을 삭제했습니다.", [
        {
          onPress: () => router.replace("/catch-log"),
          text: "확인",
        },
      ]);
    } catch (error) {
      Alert.alert("삭제 실패", getCatchLogDeleteErrorMessage(error));
    }
  };

  const handlePressEdit = () => {
    closeActionSheet();
    router.push({
      params: { editId: String(catchLogId) },
      pathname: "/catch-register",
    });
  };

  const handlePressDelete = () => {
    closeActionSheet();
    Alert.alert(
      "조과 삭제",
      "이 조과 기록과 사진을 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.",
      [
        { style: "cancel", text: "취소" },
        {
          onPress: () => {
            void handleConfirmDelete();
          },
          style: "destructive",
          text: "삭제",
        },
      ],
    );
  };

  return {
    actionSheetProps: {
      isDeleting: deleteCatchLogMutation.isPending,
      isVisible: isActionSheetVisible,
      onClose: closeActionSheet,
      onDelete: handlePressDelete,
      onEdit: handlePressEdit,
    },
    openActionSheet,
  };
};
