import { Dimensions, Platform } from "react-native";

export type IconGridLayout = {
  numColumns: number;
  itemWidth: number;
  gap: number;
};

export function isTabletDevice(width?: number): boolean {
  const w = width ?? Dimensions.get("window").width;
  return (Platform.OS === "ios" && Platform.isPad) || w >= 768;
}

/**
 * Chart jacket grid for list/ranking/favorites/recommendations icon view.
 * Phone stays 3 columns; iPad gets more columns with slightly larger jackets.
 */
export function getIconGridLayout(
  screenWidth: number,
  options?: {
    gap?: number;
    phoneTarget?: number;
    tabletTarget?: number;
    minColumns?: number;
    maxColumns?: number;
  }
): IconGridLayout {
  const gap = options?.gap ?? 8; // matches margin: 4 on each side
  const phoneTarget = options?.phoneTarget ?? 112;
  const tabletTarget = options?.tabletTarget ?? 148;
  const minColumns = options?.minColumns ?? 3;
  const maxColumns = options?.maxColumns ?? 8;

  const target = isTabletDevice(screenWidth) ? tabletTarget : phoneTarget;

  let numColumns = Math.floor(screenWidth / (target + gap));
  numColumns = Math.max(minColumns, Math.min(maxColumns, numColumns));

  const itemWidth = screenWidth / numColumns - gap;

  return { numColumns, itemWidth, gap };
}

/**
 * Timeline jacket size. Phone keeps the current 4-across feel;
 * iPad uses a slightly larger target and wraps to more columns.
 */
export function getTimelineIconSize(
  screenWidth: number,
  options?: {
    railPadding?: number;
    gap?: number;
    tabletTarget?: number;
  }
): number {
  const railPadding = options?.railPadding ?? 80;
  const gap = options?.gap ?? 10;
  const tabletTarget = options?.tabletTarget ?? 140;
  const available = Math.max(0, screenWidth - railPadding);

  if (!isTabletDevice(screenWidth)) {
    // Preserve current 4-column phone layout
    return (available - gap * 3) / 4;
  }

  let numColumns = Math.floor((available + gap) / (tabletTarget + gap));
  numColumns = Math.max(4, Math.min(8, numColumns));
  return (available - gap * (numColumns - 1)) / numColumns;
}
