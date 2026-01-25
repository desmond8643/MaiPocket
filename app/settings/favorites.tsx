import { Image } from "expo-image";
import { router, Stack } from "expo-router";
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
import {
    preloadInterstitialAd,
    showInterstitialAd,
} from "@/components/InterstitialAdComponent";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAds } from "@/context/AdContext";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Chart } from "@/types/chart";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";

type ViewMode = "list" | "icon";

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [charts, setCharts] = useState<Chart[]>([]);
  const [originalCharts, setOriginalCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { t } = useLocalization();
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const showAds = !adsRemoved && !temporaryAdRemoval;

  // Preload an interstitial ad when the component mounts
  useEffect(() => {
    if (showAds) {
      preloadInterstitialAd();
    }
  }, [showAds]);

  // Fetch favorite charts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchFavorites = async () => {
        setLoading(true);
        setError(null);

        try {
          const data = await ChartAPI.getFavoriteCharts();
          setCharts(data);
          setOriginalCharts(data);
        } catch (err) {
          console.error("Error fetching favorite charts:", err);
          setError("Failed to load favorites. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchFavorites();
    }, [])
  );

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
  const getMaxLevel = (chart: Chart): { level: number | string; color: string } => {
    let maxLevel = 0;
    let difficultyType = "";

    const processDifficulties = (difficulties: any[]) => {
      difficulties.forEach((diff) => {
        const numLevel = diff.level.jp || diff.level.international || 0;
        if (numLevel > maxLevel) {
          maxLevel = numLevel;
          difficultyType = diff.type;
        }
      });
    };

    if (chart.standard && chart.standard.difficulties) {
      processDifficulties(chart.standard.difficulties);
    }

    if (chart.deluxe && chart.deluxe.difficulties) {
      processDifficulties(chart.deluxe.difficulties);
    }

    return {
      level: maxLevel % 1 === 0 ? `${maxLevel}.0` : maxLevel,
      color: getDifficultyColor(difficultyType),
    };
  };

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

  interface LevelObject {
    jp?: number;
    international?: number;
  }

  const formatLevelDisplay = (levelObj: LevelObject) => {
    const levelValue = levelObj.jp || levelObj.international || 0;
    return Math.round((levelValue % 1) * 100) / 100 >= 0.6
      ? `${Math.floor(levelValue)}+`
      : `${Math.floor(levelValue)}`;
  };

  const navigateToChart = (chartId: string) => {
    if (showAds) {
      showInterstitialAd(() => {
        router.push({
          pathname: "/charts/[id]",
          params: { id: chartId },
        });
      });
    } else {
      router.push({
        pathname: "/charts/[id]",
        params: { id: chartId },
      });
    }
  };

  const renderChartItem = ({ item }: { item: Chart }) => {
    const difficulties = getDifficulties(item);

    if (viewMode === "icon") {
      return (
        <TouchableOpacity
          style={[
            styles.iconCard,
            { backgroundColor: colorScheme === "dark" ? "#333333" : "#FFFFFF" },
          ]}
          onPress={() => navigateToChart(item._id)}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.iconImage}
            contentFit="cover"
          />
          <View style={styles.iconTextContainer}>
            <ThemedText numberOfLines={2} style={styles.iconTitleText}>
              {item.title}
            </ThemedText>
            <ThemedText numberOfLines={1} style={styles.iconArtistText}>
              {item.artist || "Unknown Artist"}
            </ThemedText>
          </View>

          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getMaxLevel(item).color },
            ]}
          >
            <ThemedText style={styles.levelBadgeText}>
              {getMaxLevel(item).level}
            </ThemedText>
          </View>
        </TouchableOpacity>
      );
    }

    // List view
    return (
      <TouchableOpacity
        style={[
          styles.chartCard,
          { backgroundColor: colorScheme === "dark" ? "#333333" : "#FFFFFF" },
        ]}
        onPress={() => navigateToChart(item._id)}
      >
        <View style={styles.topSection}>
          <Image
            source={{ uri: item.image }}
            style={styles.chartImage}
            contentFit="cover"
          />
          <View style={styles.textContainer}>
            <ThemedText
              type="defaultSemiBold"
              numberOfLines={2}
              style={styles.titleText}
            >
              {item.title}
            </ThemedText>
            <ThemedText numberOfLines={1} style={styles.artistText}>
              {item.artist || "Unknown Artist"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.bottomSection}>
          {difficulties.standard.length > 0 && (
            <View style={styles.difficultyRow}>
              <View style={styles.levelsContainer}>
                {difficulties.standard.map((diff, index) => (
                  <ThemedView
                    key={`standard-${diff.type}-${index}`}
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(diff.type) },
                    ]}
                  >
                    <ThemedText style={styles.difficultyText}>
                      {formatLevelDisplay(diff.level)}
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>
              <View style={styles.standardLabel}>
                <ThemedText style={styles.standardLabelText}>
                  スタンダード
                </ThemedText>
              </View>
            </View>
          )}

          {difficulties.deluxe.length > 0 && (
            <View style={styles.difficultyRow}>
              <View style={styles.levelsContainer}>
                {difficulties.deluxe.map(
                  (diff, index) =>
                    diff.level.jp && (
                      <ThemedView
                        key={`deluxe-${diff.type}-${index}`}
                        style={[
                          styles.difficultyBadge,
                          { backgroundColor: getDifficultyColor(diff.type) },
                        ]}
                      >
                        <ThemedText style={styles.difficultyText}>
                          {formatLevelDisplay(diff.level)}
                        </ThemedText>
                      </ThemedView>
                    )
                )}
              </View>
              <View style={styles.deluxeLabel}>
                <ThemedText style={styles.deluxeLabelText}>
                  <ThemedText
                    style={[styles.deluxeLabelText, { color: "#FF0000" }]}
                  >
                    で
                  </ThemedText>
                  <ThemedText
                    style={[styles.deluxeLabelText, { color: "#FF8C00" }]}
                  >
                    ら
                  </ThemedText>
                  <ThemedText
                    style={[styles.deluxeLabelText, { color: "#FFD93D" }]}
                  >
                    っ
                  </ThemedText>
                  <ThemedText
                    style={[styles.deluxeLabelText, { color: "#7ADAA5" }]}
                  >
                    く
                  </ThemedText>
                  <ThemedText
                    style={[styles.deluxeLabelText, { color: "#3396D3" }]}
                  >
                    す
                  </ThemedText>
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getNumColumns = () => {
    return viewMode === "icon" ? 3 : 1;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={styles.loadingText}>
            {t("loadingCharts")}
          </ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={40}
            color="#FF3B30"
          />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              ChartAPI.getFavoriteCharts()
                .then((data) => {
                  setCharts(data);
                  setOriginalCharts(data);
                  setLoading(false);
                })
                .catch((err) => {
                  console.error("Error fetching favorites:", err);
                  setError("Failed to load favorites. Please try again.");
                  setLoading(false);
                });
            }}
          >
            <ThemedText style={styles.retryButtonText}>{t("retry")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    if (charts.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol name="heart" size={60} color="#CCCCCC" />
          <ThemedText style={styles.emptyText}>{t("noFavorites")}</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {t("noFavoritesDesc")}
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <FlatList
        data={charts}
        renderItem={renderChartItem}
        keyExtractor={(item) => item._id}
        numColumns={getNumColumns()}
        key={`${viewMode}-flat`}
        contentContainerStyle={[styles.chartsList, { paddingBottom: 70 }]}
      />
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: `${t("favorites")}${!loading ? ` (${charts.length})` : ""}`,
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      {/* Search and controls */}
      <ThemedView style={styles.searchContainer}>
        <ThemedView
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: colorScheme === "dark" ? "#444444" : "#F0F0F0",
            },
          ]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color="#888888"
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: colorScheme === "dark" ? "#FFFFFF" : "#000000" },
            ]}
            placeholder={t("searchCharts")}
            placeholderTextColor={
              colorScheme === "dark" ? "#AAAAAA" : "#888888"
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>
      </ThemedView>

      {/* View mode controls */}
      <ThemedView style={styles.controlsContainer}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "list" && styles.toggleButtonActive,
              {
                backgroundColor: colorScheme === "dark" ? "#444444" : "#F0F0F0",
              },
            ]}
            onPress={() => setViewMode("list")}
          >
            <IconSymbol
              name="list.bullet"
              size={20}
              color={
                viewMode === "list"
                  ? Colors[colorScheme ?? "light"].tint
                  : "#888888"
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "icon" && styles.toggleButtonActive,
              {
                backgroundColor: colorScheme === "dark" ? "#444444" : "#F0F0F0",
              },
            ]}
            onPress={() => setViewMode("icon")}
          >
            <IconSymbol
              name="square.grid.3x3"
              size={20}
              color={
                viewMode === "icon"
                  ? Colors[colorScheme ?? "light"].tint
                  : "#888888"
              }
            />
          </TouchableOpacity>
        </View>
      </ThemedView>

      {renderContent()}
    </ThemedView>
  );
}

function getDifficultyColor(type: string) {
  switch (type) {
    case "basic":
      return "#88CC00";
    case "advanced":
      return "#FFCC00";
    case "expert":
      return "#FF5599";
    case "master":
      return "#9944DD";
    case "remaster":
      return "#E9A5F1";
    default:
      return "#888888";
  }
}

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
    justifyContent: "flex-end",
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
  chartsList: {
    paddingBottom: 20,
  },
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
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
  },
  emptySubtext: {
    marginTop: 8,
    color: "#888888",
    textAlign: "center",
  },
});

