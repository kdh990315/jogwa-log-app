import React, { type ReactElement } from "react";
import {
  FlatList,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import CatchItem, {
  type CatchItemColors,
} from "@/components/catch-log/CatchItem";
import type { CatchLogListItem } from "@/types/catch-log";

interface CatchLogItemListProps {
  colors: CatchItemColors;
  contentContainerStyle: StyleProp<ViewStyle>;
  emptyComponent: ReactElement;
  headerComponent: ReactElement;
  items: CatchLogListItem[];
  onPressCatch: (catchLog: CatchLogListItem) => void;
}

const CatchLogItemList = ({
  colors,
  contentContainerStyle,
  emptyComponent,
  headerComponent,
  items,
  onPressCatch,
}: CatchLogItemListProps) => {
  return (
    <FlatList<CatchLogListItem>
      contentContainerStyle={contentContainerStyle}
      data={items}
      keyExtractor={(item) => String(item.id)}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={emptyComponent}
      ListHeaderComponent={headerComponent}
      renderItem={({ item }) => (
        <CatchItem
          catchItem={item}
          colors={colors}
          onPress={() => onPressCatch(item)}
          style={styles.catchItem}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default CatchLogItemList;

const styles = StyleSheet.create({
  catchItem: {
    marginBottom: 8,
  },
});
