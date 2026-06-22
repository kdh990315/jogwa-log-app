import React, { type ReactElement } from "react";
import {
  FlatList,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import CatchItemPoint, {
  type CatchItemPointColors,
} from "@/components/catch-log/CatchItemPoint";
import type { CatchLogPointGroup } from "@/types/catch-log";

interface CatchLogPointListProps {
  colors: CatchItemPointColors;
  contentContainerStyle: StyleProp<ViewStyle>;
  emptyComponent: ReactElement;
  groups: CatchLogPointGroup[];
  headerComponent: ReactElement;
  onPressPoint: (pointName: string) => void;
}

const CatchLogPointList = ({
  colors,
  contentContainerStyle,
  emptyComponent,
  groups,
  headerComponent,
  onPressPoint,
}: CatchLogPointListProps) => {
  return (
    <FlatList<CatchLogPointGroup>
      contentContainerStyle={contentContainerStyle}
      data={groups}
      keyExtractor={(item) => item.pointName}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={emptyComponent}
      ListHeaderComponent={headerComponent}
      renderItem={({ item }) => (
        <CatchItemPoint
          colors={colors}
          onPress={onPressPoint}
          pointGroup={item}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default CatchLogPointList;
