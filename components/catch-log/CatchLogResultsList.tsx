import React, { type ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import type { CatchItemColors } from "@/components/catch-log/CatchItem";
import type { CatchItemPointColors } from "@/components/catch-log/CatchItemPoint";
import CatchLogItemList from "@/components/catch-log/CatchLogItemList";
import CatchLogPointList from "@/components/catch-log/CatchLogPointList";
import CatchLogSpeciesList from "@/components/catch-log/CatchLogSpeciesList";
import type {
  CatchLogListItem,
  CatchLogListResult,
} from "@/types/catch-log";

export type CatchLogResultsColors = CatchItemPointColors;

interface CatchLogResultsListProps {
  bottomInset: number;
  colors: CatchLogResultsColors;
  emptyComponent: ReactElement;
  headerComponent: ReactElement;
  onPressCatch: (catchLog: CatchLogListItem) => void;
  onPressPoint: (pointName: string) => void;
  result?: CatchLogListResult;
}

const CatchLogResultsList = ({
  bottomInset,
  colors,
  emptyComponent,
  headerComponent,
  onPressCatch,
  onPressPoint,
  result,
}: CatchLogResultsListProps) => {
  const contentContainerStyle = [
    styles.listContainer,
    { paddingBottom: 40 + bottomInset },
  ];
  const catchItemColors: CatchItemColors = {
    accentText: colors.accent,
    badgeBackground: colors.accentSoft,
    badgeText: colors.textSecondary,
    cardBackground: colors.cardBackground,
    cardBorder: colors.cardBorder,
    chevron: colors.chevron,
    metaText: colors.textTertiary,
    primaryText: colors.textPrimary,
  };

  if (!result) {
    return <View style={contentContainerStyle}>{emptyComponent}</View>;
  }

  switch (result.view) {
    case "species":
      return (
        <CatchLogSpeciesList
          colors={catchItemColors}
          contentContainerStyle={contentContainerStyle}
          emptyComponent={emptyComponent}
          headerComponent={headerComponent}
          onPressCatch={onPressCatch}
          sectionCountColor={colors.textSecondary}
          sections={result.sections}
          sectionTitleColor={colors.textPrimary}
        />
      );
    case "points":
      return (
        <CatchLogPointList
          colors={colors}
          contentContainerStyle={contentContainerStyle}
          emptyComponent={emptyComponent}
          groups={result.groups}
          headerComponent={headerComponent}
          onPressPoint={onPressPoint}
        />
      );
    case "list":
      return (
        <CatchLogItemList
          colors={catchItemColors}
          contentContainerStyle={contentContainerStyle}
          emptyComponent={emptyComponent}
          headerComponent={headerComponent}
          items={result.items}
          onPressCatch={onPressCatch}
        />
      );
  }
};

export default CatchLogResultsList;

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
});
