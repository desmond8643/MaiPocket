import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ChartAPI } from "@/api/client";
import { BannerAdComponent } from "@/components/BannerAdComponent";
import {
  preloadInterstitialAd,
  showInterstitialAd,
} from "@/components/InterstitialAdComponent";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useShowAds } from "@/hooks/useShowAds";
import { Chart } from "@/types/chart";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ViewMode = "list" | "icon";

export default function ChartListScreen() {
  const { type, value } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [charts, setCharts] = useState<Chart[]>([]);
  const [originalCharts, setOriginalCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const insets = useSafeAreaInsets();
  const { showAds, dynamicStyles } = useShowAds(false);

  // Preload an interstitial ad when the component mounts
  useEffect(() => {
    if (showAds) {
      preloadInterstitialAd();
    }
  }, [showAds]);

  // Fetch charts for the selected category
  useEffect(() => {
    const fetchCharts = async () => {
      if (!type || !value) return;

      setLoading(true);
      setError(null);

      try {
        const data = await ChartAPI.getChartsByCategory(
          type.toString(),
          value.toString()
        );
        setCharts(data);
        setOriginalCharts(data);
      } catch (err) {
        console.error(`Error fetching charts for ${value}:`, err);
        setError("Failed to load charts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, [type, value]);

  // Apply search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCharts(originalCharts);
      return;
    }

    const filtered = originalCharts.filter(
      (chart) =>
        chart.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chart.artist &&
          chart.artist.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setCharts(filtered);
  }, [searchQuery, originalCharts]);

  // Helper function to get max level from a chart
  const getMaxLevel = (chart: Chart): number => {
    let maxLevel = 0;

    // Check standard difficulties
    if (chart.standard && chart.standard.difficulties) {
      chart.standard.difficulties.forEach((diff) => {
        const level = diff.level.jp || diff.level.international || 0;
        maxLevel = Math.max(maxLevel, level);
      });
    }

    // Check deluxe difficulties
    if (chart.deluxe && chart.deluxe.difficulties) {
      chart.deluxe.difficulties.forEach((diff) => {
        const level = diff.level.jp || diff.level.international || 0;
        maxLevel = Math.max(maxLevel, level);
      });
    }

    return maxLevel;
  };

  // Helper function to get chart constant (level display)
  const getChartConstant = (level: number): string => {
    return Math.round((level % 1) * 100) / 100 >= 0.6
      ? `${Math.floor(level)}+`
      : `${Math.floor(level)}`;
  };

  // Update the getDifficulties function to handle level as an object
  const getDifficulties = (chart: Chart) => {
    interface SimpleDifficulty {
      type: string;
      level: any;
    }

    const result: {
      standard: SimpleDifficulty[];
      deluxe: SimpleDifficulty[];
    } = {
      standard: [],
      deluxe: [],
    };

    const sortByDifficultyOrder = (difficulties: SimpleDifficulty[]) => {
      const difficultyOrder = [
        "basic",
        "advanced",
        "expert",
        "master",
        "remaster",
      ];
      return difficulties.sort((a, b) => {
        return (
          difficultyOrder.indexOf(a.type) - difficultyOrder.indexOf(b.type)
        );
      });
    };

    if (chart.standard && chart.standard.difficulties) {
      result.standard = sortByDifficultyOrder(
        chart.standard.difficulties.map((diff) => ({
          type: diff.type,
          level: diff.level,
        }))
      );
    }

    if (chart.deluxe && chart.deluxe.difficulties) {
      result.deluxe = sortByDifficultyOrder(
        chart.deluxe.difficulties.map((diff) => ({
          type: diff.type,
          level: diff.level,
        }))
      );
    }

    return result;
  };

  // Helper 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
    marginTop: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.tint + "20",
  },
  groupButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888888",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  chartsList: {
    paddingBottom: 20,
  },
  // List view styles (original)
  chartCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "column",
    padding: 12,
  },
  topSection: {
    flexDirection: "row",
    marginBottom: 16,
  },
  chartImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  artistText: {
    fontSize: 14,
  },
  bottomSection: {
    marginTop: 8,
  },
  difficultyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  standardLabel: {
    backgroundColor: "#4BAEEA",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  standardLabelText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  deluxeLabel: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    marginLeft: 8,
  },
  deluxeLabelText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  difficultyBadge: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  difficultyText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Icon view styles
  iconCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 8,
    maxWidth: "32%",
    position: "relative",
  },
  iconImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 6,
    marginBottom: 8,
  },
  iconTextContainer: {
    alignItems: "center",
  },
  iconTitleText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  iconArtistText: {
    fontSize: 10,
    textAlign: "center",
    opacity: 0.7,
  },
  levelBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  levelBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  // Loading, error, empty states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    color: "#888888",
  },
  bottomAdContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
  },
});