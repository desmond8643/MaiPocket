import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useShowAds } from "@/hooks/useShowAds";
import { Chart } from "@/types/chart";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ViewMode = "list" | "icon";
type GroupMode = "none" | "level" | "version";

// Helper function to check if a numerical level matches a string level representation
const matchesLevelString = (numLevel: number, levelString: string): boolean => {
  if (!levelString) return true;

  // Handle "X+" format
  if (levelString.endsWith("+")) {
    const baseLevel = parseInt(levelString.replace("+", ""));

    return (
      Math.floor(numLevel) === baseLevel &&
      Math.round((numLevel % 1) * 100) / 100 >= 0.6
    );
  }
  // Handle regular integer level
  else {
    const baseLevel = parseInt(levelString);

    return (
      Math.floor(numLevel) === baseLevel &&
      Math.round((numLevel % 1) * 100) / 100 < 0.6
    );
  }
};

export default function ChartListScreen() {
  const { type, value } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [charts, setCharts] = useState<Chart[]>([]);
  const [originalCharts, setOriginalCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupMode, setGroupMode] = useState<GroupMode>("none"); // Keep this but we won't change it
  const insets = useSafeAreaInsets();
  const { showAds, dynamicStyles } = useShowAds(false);
  const { t } = useLocalization();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  // Add this state to track image loading
  const [imageLoading, setImageLoading] = useState(true);
  const [nextChart, setNextChart] = useState<Chart | null>(null);

  console.log(type);
  const handleShuffle = () => {
    if (charts.length === 0) return;

    // Set imageLoading to true when we shuffle
    setImageLoading(true);

    // Pick a random chart from the filtered list
    const randomIndex = Math.floor(Math.random() * charts.length);
    const randomChart = charts[randomIndex];

    // Store the next chart but don't update selectedChart yet
    setNextChart(randomChart);

    // If this is the first shuffle, also set selectedChart and show the modal
    if (!selectedChart) {
      setSelectedChart(randomChart);
    }
    setModalVisible(true);
  };

  const getMatchingDifficulty = (chart: Chart) => {
    const levelValue = value?.toString();

    // If no levelValue is provided, return a randomly chosen available version
    if (!parseFloat(levelValue)) {
      const versions = [];

      if (chart.standard && chart.standard.difficulties?.length > 0) {
        if (
          type !== "version" ||
          chart.standard.versionReleased === levelValue
        ) {
          versions.push("standard");
        }
      }
      if (chart.deluxe && chart.deluxe.difficulties?.length > 0) {
        console.log(chart.deluxe.versionReleased);
        if (type !== "version" || chart.deluxe.versionReleased === levelValue) {
          versions.push("deluxe");
        }
      }

      if (versions.length === 0) {
        return null;
      }

      console.log(versions);

      // Randomly select a version if multiple are available
      const randomIndex = Math.floor(Math.random() * versions.length);
      return {
        type: null,
        level: null,
        version: versions[randomIndex] as "standard" | "deluxe",
      };
    }

    // Existing code for when levelValue is provided
    let matchingDifficulty: {
      type: string | null;
      level: number | null;
      version: "standard" | "deluxe";
    } | null = null;

    // Check for standard difficulties
    if (chart.standard && chart.standard.difficulties) {
      for (const diff of chart.standard.difficulties) {
        const numLevel = diff.level.jp;

        if (matchesLevelString(numLevel, levelValue)) {
          matchingDifficulty = {
            type: diff.type,
            level: numLevel,
            version: "standard",
          };
          break;
        }
      }
    }

    // If no matching standard difficulty, check deluxe
    if (!matchingDifficulty && chart.deluxe && chart.deluxe.difficulties) {
      for (const diff of chart.deluxe.difficulties) {
        const numLevel = diff.level.jp;
        if (matchesLevelString(numLevel, levelValue)) {
          matchingDifficulty = {
            type: diff.type,
            level: numLevel,
            version: "deluxe",
          };
          break;
        }
      }
    }

    return matchingDifficulty;
  };

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

  // Group charts when groupMode or charts change
  useEffect(() => {
    if (groupMode === "none") {
      // setGroupedData([]); // This line is removed as per the edit hint
      return;
    }
  }, [charts, groupMode]);

  // Helper function to get max level from a chart
  const getMaxLevel = (
    chart: Chart,
    type: "level" | "version" = "level",
    value?: string
  ): { level: number | string; color: string } => {
    let maxLevel = 0;
    let difficultyType = "";

    // Helper function to process difficulties
    const processDifficulties = (
      difficulties: any[],
      versionReleased?: string
    ) => {
      difficulties.forEach((diff) => {
        const numLevel = diff.level.jp || diff.level.international || 0;

        // For type 'level', check if the numerical level matches the string representation
        if (type === "level" && value) {
          if (!matchesLevelString(numLevel, value)) {
            return;
          }
        }

        // For type 'version', only consider charts with matching versionReleased
        if (type === "version" && value && versionReleased !== value) {
          return;
        }

        if (numLevel > maxLevel) {
          maxLevel = numLevel;
          difficultyType = diff.type;
        }
      });
    };

    // Check standard difficulties
    if (chart.standard && chart.standard.difficulties) {
      processDifficulties(
        chart.standard.difficulties,
        chart.standard.versionReleased
      );
    }

    // Check deluxe difficulties
    if (chart.deluxe && chart.deluxe.difficulties) {
      processDifficulties(
        chart.deluxe.difficulties,
        chart.deluxe.versionReleased
      );
    }

    return {
      level: maxLevel % 1 === 0 ? `${maxLevel}.0` : maxLevel,
      color: getDifficultyColor(difficultyType),
    };
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

  // Helper function to format level display
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

          {/* Show max level badge */}
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

    // List view (original implementation)
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
              ChartAPI.getChartsByCategory(type.toString(), value.toString())
                .then((data) => {
                  setCharts(data);
                  setOriginalCharts(data);
                  setLoading(false);
                })
                .catch((err) => {
                  console.error(`Error fetching charts for ${value}:`, err);
                  setError("Failed to load charts. Please try again.");
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
          <IconSymbol name="music.note" size={60} color="#CCCCCC" />
          <ThemedText style={styles.emptyText}>{t("noChartsFound")}</ThemedText>
        </ThemedView>
      );
    }

    // Always use the FlatList since we're only using "none" groupMode
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
      {/* <Stack.Screen
        options={{
          title: value
            ? `${value.toString()}${!loading ? ` (${charts.length})` : ""}`
            : t("charts"),
          headerBackButtonDisplayMode: "minimal",
        }}
      /> */}
      <Stack.Screen
        options={{
          title: value
            ? `${value.toString()}${!loading ? ` (${charts.length})` : ""}`
            : t("charts"),
          headerBackButtonDisplayMode: "minimal",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleShuffle}
              style={{ marginRight: 0 }}
            >
              <IconSymbol name="shuffle" size={22} color="#9944DD" />
            </TouchableOpacity>
          ),
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

      {/* View mode and grouping controls */}
      <ThemedView style={styles.controlsContainer}>
        {/* View mode toggle */}
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

      {/* Add the banner ad component */}
      {showAds && (
        <View style={dynamicStyles.bottomAdContainer}>
          <BannerAdComponent />
        </View>
      )}
      {modalVisible && selectedChart && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            {/* <View > */}
            <TouchableOpacity
              style={{
                ...styles.modalContainer,
                backgroundColor:
                  colorScheme === "dark"
                    ? Colors.dark.background
                    : Colors.light.background,
              }}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <IconSymbol name="xmark" size={24} color="#888888" />
              </TouchableOpacity>
              <View style={styles.modalContent}>
                {/* <Image
                  source={{ uri: selectedChart.image }}
                  style={styles.modalImage}
                  contentFit="cover"
                  onLoadStart={() => setImageLoading(true)}
                  onLoad={() => setImageLoading(false)}
                /> */}
                <Image
                  source={{ uri: nextChart?.image || selectedChart?.image }}
                  style={styles.modalImage}
                  contentFit="cover"
                  onLoadStart={() => setImageLoading(true)}
                  onLoad={() => {
                    // Only update the selected chart after the image loads
                    if (nextChart) {
                      setSelectedChart(nextChart);
                      setNextChart(null);
                    }
                    setImageLoading(false);
                  }}
                />

                <ThemedText
                  type="defaultSemiBold"
                  style={styles.modalSongTitle}
                >
                  {selectedChart.title}
                </ThemedText>

                <ThemedText style={styles.modalArtist}>
                  {selectedChart.artist}
                </ThemedText>
                <View style={styles.modalDifficultyContainer}>
                  <>
                    {/* {getMatchingDifficulty(selectedChart)?.level && (
                      <ThemedView
                        style={[
                          styles.difficultyBadge,
                          {
                            backgroundColor: getDifficultyColor(
                              getMatchingDifficulty(selectedChart)?.type || ""
                            ),
                            marginBottom: 0,
                          },
                        ]}
                      >
                        <ThemedText style={styles.difficultyText}>
                          {formatLevelDisplay({
                            jp: getMatchingDifficulty(selectedChart)
                              ?.level as number,
                          })}
                        </ThemedText>
                      </ThemedView>
                    )} */}

                    <ThemedText style={styles.modalDifficultyType}>
                      {getMatchingDifficulty(selectedChart)?.version ===
                      "standard" ? (
                        <View style={{ ...styles.standardLabel, width: 108 }}>
                          <ThemedText style={styles.standardLabelText}>
                            スタンダード
                          </ThemedText>
                        </View>
                      ) : (
                        <View style={{ ...styles.deluxeLabel, width: 96 }}>
                          <ThemedText style={styles.deluxeLabelText}>
                            <ThemedText
                              style={[
                                styles.deluxeLabelText,
                                { color: "#FF0000" },
                              ]}
                            >
                              で
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.deluxeLabelText,
                                { color: "#FF8C00" },
                              ]}
                            >
                              ら
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.deluxeLabelText,
                                { color: "#FFD93D" },
                              ]}
                            >
                              っ
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.deluxeLabelText,
                                { color: "#7ADAA5" },
                              ]}
                            >
                              く
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.deluxeLabelText,
                                { color: "#3396D3" },
                              ]}
                            >
                              す
                            </ThemedText>
                          </ThemedText>
                        </View>
                      )}
                    </ThemedText>
                  </>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => {
                  setModalVisible(false);
                  navigateToChart(selectedChart._id);
                }}
              >
                <ThemedText style={styles.viewButtonText}>
                  {t("viewChart")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.shuffleAgainButton,
                  imageLoading && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!imageLoading) {
                    handleShuffle();
                  }
                }}
                disabled={imageLoading}
              >
                <IconSymbol
                  name="shuffle"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <ThemedText style={styles.shuffleAgainText}>
                  {imageLoading ? t("shuffling") : t("shuffleAgain")}
                </ThemedText>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalHeader: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  modalImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalSongTitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  modalArtist: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
  },
  modalDifficultyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  modalDifficultyType: {
    marginLeft: 12,
    fontSize: 16,
  },
  viewButton: {
    backgroundColor: "#9944DD",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  shuffleAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#555555",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
    width: "100%",
  },
  shuffleAgainText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
