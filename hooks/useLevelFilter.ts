import { useState } from "react";

export const LEVEL_OPTIONS = [
  "All",
  "15",
  "14+",
  "14",
  "13+",
  "13",
  "12+",
  "12",
  "11+",
  "11",
  "10+",
  "10",
  "9+",
  "9",
  "8+",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
  "1",
];

export function getLevelRange(level: string): {
  minLevel?: number;
  maxLevel?: number;
} {
  if (!level || level === "All") return {};

  const hasPlus = level.endsWith("+");
  const baseLevel = parseInt(level.replace("+", ""), 10);

  if (hasPlus) {
    // "14+" means 14.6 to 14.9
    return { minLevel: baseLevel + 0.6, maxLevel: baseLevel + 0.9 };
  } else {
    // "14" means 14.0 to 14.5
    return { minLevel: baseLevel, maxLevel: baseLevel + 0.5 };
  }
}

export function useLevelFilter() {
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [levelFilterModalVisible, setLevelFilterModalVisible] = useState(false);

  return {
    levelFilter,
    setLevelFilter,
    levelFilterModalVisible,
    setLevelFilterModalVisible,
    levelRange: getLevelRange(levelFilter),
  };
}
