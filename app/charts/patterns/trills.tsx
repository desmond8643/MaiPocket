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
import { DifficultyTrillAnalysis, TrillChartItem } from "@/types/chart";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type SortOption = "longestTrill" | "speed" | "level" | "trillCount";
type OrderOption = "asc" | "desc";

const SORT_OPTIONS: { key: SortOption; labelKey: string }[] = [
  { key: "longestTrill", labelKey: "sortLongestTrill" },
  { key: "speed", labelKey: "sortSpeed" },
  { key: "level", labelKey: "sortLevel" },
  { key: "trillCount", labelKey: "sortTrillCount" },
];

function getDivisionName(division: number): string {
  const names: Record<number, string> = {
    1: "whole",
    2: "half",
    4: "quarter",
    8: "8th",
    12: "12th",
    16: "16th",
    24: "24th",
    32: "32nd",
    48: "48th",
    64: "64th",
    96: "96th",
  };
  return names[division] || `${division}th`;
}

function getDifficultyColor(type: string): string {
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

function formatLevel(level: number): string {
  return Math.round((level % 1) * 100) / 100 >= 0.6
    ? `${Math.floor(level)}+`
    : `${Math.floor(level)}`;
}

export default function TrillsListScreen() {
  const colorScheme = useColorScheme();
  const { t } = useLocalization();
  const { showAds, dynamicStyles } = useShowAds(false);

  const [charts, setCharts] = useState<TrillChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("longestTrill");
  const [order, setOrder] = useState<OrderOption>("asc");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChart, setSelectedChart] = useState<TrillChartItem | null>(
    null
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyTrillAnalysis | null>(null);

  const fetchCharts = async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await ChartAPI.getTrillCharts({
        sortBy,
        order,
        page: pageNum,
        limit: 30,
      });

      if (isLoadMore) {
        setCharts((prev) => [...prev, ...response.charts]);
      } else {
        setCharts(response.charts);
      }
      setHasMore(response.pagination.hasMore);
    } catch (err) {
      console.error("Error fetching trill charts:", err);
      setError(t("errorLoadingCharts"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (showAds) {
      preloadInterstitialAd();
    }
  }, [showAds]);

  useEffect(() => {
    setPage(1);
    fetchCharts(1);
  }, [sortBy, order]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCharts(nextPage, true);
    }
  };

  const handleChartPress = (chart: TrillChartItem) => {
    setSelectedChart(chart);
    // Select the first difficulty by default
    if (chart.difficulties.length > 0) {
      setSelectedDifficulty(chart.difficulties[0]);
    }
    setModalVisible(true);
  };

  const navigateToChart = (chartId: string) => {
    if (showAds) {
      showInterstitialAd(() => {
        setModalVisible(false);
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

  const renderSortButton = ({
    key,
    labelKey,
  }: {
    key: SortOption;
    labelKey: string;
  }) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.sortButton,
        sortBy === key && styles.sortButtonActive,
        {
          backgroundColor:
            sortBy === key
              ? "#E91E63"
              : colorScheme === "dark"
              ? "#333333"
              : "#F0F0F0",
        },
      ]}
      onPress={() => setSortBy(key)}
    >
      <ThemedText
        style={[
          styles.sortButtonText,
          sortBy === key && { color: "white", fontWeight: "600" },
        ]}
      >
        {t(labelKey)}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderOrderToggle = () => (
    <TouchableOpacity
      style={[
        styles.orderButton,
        { backgroundColor: colorScheme === "dark" ? "#333333" : "#F0F0F0" },
      ]}
      onPress={() => setOrder(order === "desc" ? "asc" : "desc")}
    >
      <Ionicons
        name={order === "desc" ? "arrow-down" : "arrow-up"}
        size={18}
        color="#E91E63"
      />
    </TouchableOpacity>
  );

  const renderChartItem = ({ item }: { item: TrillChartItem }) => {
    // Find the fastest/longest trill difficulty for display
    const primaryDiff = item.difficulties.reduce((best, curr) => {
      if (sortBy === "speed") {
        return curr.fastestSpeed > best.fastestSpeed ? curr : best;
      }
      return curr.longestTrill > best.longestTrill ? curr : best;
    }, item.difficulties[0]);

    return (
      <TouchableOpacity
        style={[
          styles.chartCard,
          { backgroundColor: colorScheme === "dark" ? "#2A2D2F" : "white" },
        ]}
        onPress={() => handleChartPress(item)}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.chartImage}
          contentFit="cover"
        />
        <View style={styles.chartInfo}>
          <ThemedText
            type="defaultSemiBold"
            numberOfLines={1}
            style={styles.chartTitle}
          >
            {item.title}
          </ThemedText>
          <ThemedText numberOfLines={1} style={styles.chartArtist}>
            {item.artist || "Unknown Artist"}
          </ThemedText>

          {/* Difficulty badges */}
          <View style={styles.difficultyRow}>
            {item.difficulties.slice(0, 3).map((diff, idx) => (
              <View
                key={`${diff.version}-${diff.type}-${idx}`}
                style={[
                  styles.diffBadge,
                  { backgroundColor: getDifficultyColor(diff.type) },
                ]}
              >
                <ThemedText style={styles.diffBadgeText}>
                  {formatLevel(diff.level)}
                </ThemedText>
              </View>
            ))}
            {item.difficulties.length > 3 && (
              <ThemedText style={styles.moreText}>
                +{item.difficulties.length - 3}
              </ThemedText>
            )}
          </View>

          {/* Trill stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="musical-notes" size={14} color="#E91E63" />
              <ThemedText style={styles.statText}>
                {item.maxTrillLength} {t("notes")}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="speedometer" size={14} color="#E91E63" />
              <ThemedText style={styles.statText}>
                BPM {item.fastestBpm} {`{${item.fastestDivision}}`}
              </ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <ThemedText style={styles.loadingText}>
            {t("loadingCharts")}
          </ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.centerContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={40}
            color="#FF3B30"
          />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCharts(1)}
          >
            <ThemedText style={styles.retryButtonText}>{t("retry")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    if (charts.length === 0) {
      return (
        <ThemedView style={styles.centerContainer}>
          <Ionicons name="swap-horizontal" size={60} color="#CCCCCC" />
          <ThemedText style={styles.emptyText}>
            {t("noTrillChartsFound")}
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <FlatList
        data={charts}
        renderItem={renderChartItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color="#E91E63"
              style={styles.loadingMore}
            />
          ) : null
        }
      />
    );
  };

  const renderTrillDetailModal = () => {
    if (!selectedChart || !selectedDifficulty) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={styles.modalOverlay}
          //   activeOpacity={1}
          //   onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  colorScheme === "dark"
                    ? Colors.dark.background
                    : Colors.light.background,
              },
            ]}
            // onStartShouldSetResponder={() => true}
            // onTouchEnd={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <IconSymbol name="xmark" size={24} color="#888888" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Image
                source={{ uri: selectedChart.image }}
                style={styles.modalImage}
                contentFit="cover"
              />
              <View style={styles.modalHeaderText}>
                <ThemedText
                  type="defaultSemiBold"
                  numberOfLines={2}
                  style={styles.modalTitle}
                >
                  {selectedChart.title}
                </ThemedText>
                <ThemedText style={styles.modalArtist}>
                  {selectedChart.artist}
                </ThemedText>
              </View>
            </View>

            {/* Difficulty selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.difficultySelector}
            >
              {selectedChart.difficulties.map((diff, idx) => (
                <TouchableOpacity
                  key={`${diff.version}-${diff.type}-${idx}`}
                  style={[
                    styles.difficultyTab,
                    {
                      backgroundColor:
                        selectedDifficulty === diff
                          ? getDifficultyColor(diff.type)
                          : colorScheme === "dark"
                          ? "#333333"
                          : "#F0F0F0",
                    },
                  ]}
                  onPress={() => setSelectedDifficulty(diff)}
                >
                  <ThemedText
                    style={[
                      styles.difficultyTabText,
                      selectedDifficulty === diff && { color: "white" },
                    ]}
                  >
                    {/* {diff.type.charAt(0).toUpperCase() + diff.type.slice(1)}{" "} */}
                    {formatLevel(diff.level)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Trill details */}
            <ScrollView style={styles.trillDetailsContainer}>
              <View style={styles.trillSectionHeader}>
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.trillSectionTitle}
                >
                  {t("trillDetails")} ({selectedDifficulty.trillCount}{" "}
                  {t("trillsFound")})
                </ThemedText>
                {selectedDifficulty.version === "deluxe" ? (
                  <View style={[styles.deluxeLabel, { marginTop: 2 }]}>
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
                ) : (
                  <View style={[styles.standardLabel, { marginTop: 2 }]}>
                    <ThemedText style={styles.standardLabelText}>
                      スタンダード
                    </ThemedText>
                  </View>
                )}
              </View>

              {selectedDifficulty.trills.map((trill, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.trillItem,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#2A2D2F" : "#F5F5F5",
                    },
                  ]}
                >
                  <View style={styles.trillItemHeader}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.trillItemTitle}
                    >
                      {t("trill")} #{idx + 1}
                    </ThemedText>
                    <ThemedText style={styles.trillTimestamp}>
                      ⏱️ {trill.timestamp}
                    </ThemedText>
                  </View>

                  <View style={styles.trillStats}>
                    <View style={styles.trillStatRow}>
                      <Ionicons
                        name="musical-notes"
                        size={16}
                        color="#E91E63"
                      />
                      <ThemedText style={styles.trillStatLabel}>
                        {t("length")}:
                      </ThemedText>
                      <ThemedText style={styles.trillStatValue}>
                        {trill.length} {t("notes")}
                      </ThemedText>
                    </View>

                    {/* <View style={styles.trillStatRow}>
                      <Ionicons name="time" size={16} color="#E91E63" />
                      <ThemedText style={styles.trillStatLabel}>{t("duration")}:</ThemedText>
                      <ThemedText style={styles.trillStatValue}>{trill.trillLengthMs}ms</ThemedText>
                    </View> */}

                    <View style={styles.trillStatRow}>
                      <Ionicons name="speedometer" size={16} color="#E91E63" />
                      <ThemedText style={styles.trillStatLabel}>
                        {t("speed")}:
                      </ThemedText>
                      <ThemedText style={styles.trillStatValue}>
                        BPM {trill.bpm} {`{${trill.effectiveDivision}}`}
                      </ThemedText>
                    </View>

                    <View style={styles.trillStatRow}>
                      <Ionicons name="locate" size={16} color="#E91E63" />
                      <ThemedText style={styles.trillStatLabel}>
                        {t("positions")}:
                      </ThemedText>
                      <ThemedText style={styles.trillStatValue}>
                        {trill.positions.join(" ↔ ")}
                      </ThemedText>
                    </View>

                    {/* <View style={styles.trillStatRow}>
                      <Ionicons name="flash" size={16} color="#E91E63" />
                      <ThemedText style={styles.trillStatLabel}>{t("notesPerSec")}:</ThemedText>
                      <ThemedText style={styles.trillStatValue}>{trill.notesPerSecond}/s</ThemedText>
                    </View> */}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* View chart button */}
            <TouchableOpacity
              style={styles.viewChartButton}
              onPress={() => navigateToChart(selectedChart._id)}
            >
              <ThemedText style={styles.viewChartButtonText}>
                {t("viewChart")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: `${t("patternTrills")}`,
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      {/* Sort options */}
      <View style={styles.sortRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortContainer}
          contentContainerStyle={styles.sortContent}
        >
          {SORT_OPTIONS.map(renderSortButton)}
        </ScrollView>
        {renderOrderToggle()}
      </View>

      {renderContent()}

      {showAds && (
        <View style={dynamicStyles.bottomAdContainer}>
          <BannerAdComponent />
        </View>
      )}

      {renderTrillDetailModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  sortContainer: {
    flex: 1,
    maxHeight: 50,
  },
  orderButton: {
    width: 40,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sortContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: "row",
    paddingBottom: 8,
    marginTop: 4
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    // marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: "#E91E63",
  },
  sortButtonText: {
    fontSize: 14,
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  chartCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  chartInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  chartTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  chartArtist: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8,
  },
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  diffBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  moreText: {
    fontSize: 12,
    opacity: 0.6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    opacity: 0.8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.6,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#E91E63",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  loadingMore: {
    paddingVertical: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
    zIndex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: "row",
    marginBottom: 16,
    marginTop: 8,
  },
  modalImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  modalHeaderText: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  modalArtist: {
    fontSize: 14,
    opacity: 0.7,
  },
  difficultySelector: {
    marginBottom: 16,
  },
  difficultyTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
  },
  difficultyTabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  difficultyVersionText: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  trillDetailsContainer: {
    maxHeight: 320,
  },
  trillSectionTitle: {
    fontSize: 16,
    // marginBottom: 12,
  },
  trillItem: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  trillItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  trillItemTitle: {
    fontSize: 15,
    color: "#E91E63",
  },
  trillTimestamp: {
    fontSize: 13,
    opacity: 0.8,
  },
  trillStats: {
    gap: 8,
  },
  trillStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trillStatLabel: {
    fontSize: 13,
    opacity: 0.7,
    width: 90,
  },
  trillStatValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  viewChartButton: {
    backgroundColor: "#E91E63",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  viewChartButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  standardLabel: {
    backgroundColor: "#4BAEEA",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  standardLabelText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  deluxeLabel: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  deluxeLabelText: {
    fontWeight: "bold",
    fontSize: 10,
  },
  trillSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
});
