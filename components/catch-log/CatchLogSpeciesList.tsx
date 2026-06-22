import React, { type ReactElement } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import CatchItem, {
  type CatchItemColors,
} from "@/components/catch-log/CatchItem";
import type {
  CatchLogListItem,
  CatchLogSpeciesSection,
} from "@/types/catch-log";

interface CatchLogSpeciesListProps {
  colors: CatchItemColors;
  contentContainerStyle: StyleProp<ViewStyle>;
  emptyComponent: ReactElement;
  headerComponent: ReactElement;
  onPressCatch: (catchLog: CatchLogListItem) => void;
  sections: CatchLogSpeciesSection[];
  sectionCountColor: string;
  sectionTitleColor: string;
}

const CatchLogSpeciesList = ({
  colors,
  contentContainerStyle,
  emptyComponent,
  headerComponent,
  onPressCatch,
  sections,
  sectionCountColor,
  sectionTitleColor,
}: CatchLogSpeciesListProps) => {
  return (
    <SectionList<CatchLogListItem, CatchLogSpeciesSection>
      contentContainerStyle={contentContainerStyle}
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
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text
            numberOfLines={1}
            style={[styles.sectionTitle, { color: sectionTitleColor }]}
          >
            {section.speciesName}
          </Text>
          <Text style={[styles.sectionCount, { color: sectionCountColor }]}>
            {section.totalRecords}건
          </Text>
        </View>
      )}
      sections={sections}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default CatchLogSpeciesList;

const styles = StyleSheet.create({
  catchItem: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "600",
  },
});
