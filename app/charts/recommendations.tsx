import { ChartAPI } from "@/api/client";
import {
  preloadInterstitialAd,
  showInterstitialAd,
} from "@/components/InterstitialAdComponent";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import {
  SKILL_CEILING_BY_OPTION,
  SKILL_CEILING_OPTION_ORDER,
} from "@/constants/skillCeilingOptions";
import { useAds } from "@/context/AdContext";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  loadRecommendationProfile,
  selectRecommendations,
  setSkillCeilingOption,
} from "@/lib/recommendations";
import type {
  RecommendationProfileV1,
  SkillCeilingOptionId,
} from "@/types/recommendations";
import type { Chart } from "@/types/chart";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ViewMode = "list" | "icon";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
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

export default function RecommendationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const showAds = !adsRemoved && !temporaryAdRemoval;

  const [profile, setProfile] = useState<RecommendationProfileV1 | null>(null);
  const [allCharts, setAllCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    if (showAds) preloadInterstitialAd();
  }, [showAds]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, charts] = await Promise.all([
        loadRecommendationProfile(),
        ChartAPI.getAllCharts(),
      ]);
      setProfile(p);
      setAllCharts(Array.isArray(charts) ? charts : []);
    } catch {
      setError(t("recommendationsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, charts] = await Promise.all([
          loadRecommendationProfile(),
          ChartAPI.getAllCharts(),
        ]);
        if (cancelled) return;
        setProfile(p);
        setAllCharts(Array.isArray(charts) ? charts : []);
      } catch (e) {
        if (!cancelled) setError(t("recommendationsLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const optionId = profile?.skillCeilingOptionId ?? null;
  const spec = optionId ? SKILL_CEILING_BY_OPTION[optionId] : null;

  const listSeed = useMemo(() => {
    if (!optionId) return 0;
    return (
      dateSeed() * 1000003 +
      refreshNonce * 7919 +
      hashString(optionId)
    );
  }, [optionId, refreshNonce]);

  const recommended = useMemo(() => {
    if (!profile || !spec || allCharts.length === 0) return [];
    return selectRecommendations(allCharts, spec, profile, {
      count: 20,
      seed: listSeed,
    });
  }, [allCharts, profile, spec, listSeed]);

  const displayCharts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recommended;
    return recommended.filter(
      (chart) =>
        chart.title.toLowerCase().includes(q) ||
        (chart.artist && chart.artist.toLowerCase().includes(q))
    );
  }, [recommended, searchQuery]);

  const navigateToChart = useCallback(
    (chartId: string) => {
      const go = () =>
        router.push({ pathname: "/charts/[id]", params: { id: chartId } });
      if (showAds) showInterstitialAd(go);
      else go();
    },
    [showAds]
  );

  const onPickLevel = async (id: SkillCeilingOptionId) => {
    const next = await setSkillCeilingOption(id);
    setProfile(next);
    setLevelModalVisible(false);
  };

  const getMaxLevel = (chart: Chart): { level: number | string; color: string } => {
    let maxLevel = 0;
    let difficultyType = "";

    const processDifficulties = (difficulties: { type: string; level: { jp?: number; international?: number } }[]) => {
      difficulties.forEach((diff) => {
        const numLevel = diff.level.jp || diff.level.international || 0;
        if (numLevel > maxLevel) {
          maxLevel = numLevel;
          difficultyType = diff.type;
        }
      });
    };

    if (chart.standard?.difficulties) {
      processDifficulties(chart.standard.difficulties);
    }
    if (chart.deluxe?.difficulties) {
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
      level: { jp?: number; international?: number };
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
      return difficulties.sort(
        (a, b) =>
          difficultyOrder.indexOf(a.type) - difficultyOrder.indexOf(b.type)
      );
    };

    if (chart.standard?.difficulties) {
      result.standard = sortByDifficultyOrder(
        chart.standard.difficulties.map((diff) => ({
          type: diff.type,
          level: diff.level,
        }))
      );
    }

    if (chart.deluxe?.difficulties) {
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

  const renderChartItem = ({
    item,
    index,
  }: {
    item: Chart;
    index: number;
  }) => {
    const difficulties = getDifficulties(item);

    if (viewMode === "icon") {
      return (
        <TouchableOpacity
          style={[
            styles.iconCard,
            { backgroundColor: isDark ? "#333333" : "#FFFFFF" },
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

          {/* <View style={styles.rankingBadge}>
            <ThemedText style={styles.rankingBadgeText}>#{index + 1}</ThemedText>
          </View> */}

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

    return (
      <TouchableOpacity
        style={[
          styles.chartCard,
          { backgroundColor: isDark ? "#333333" : "#FFFFFF" },
        ]}
        onPress={() => navigateToChart(item._id)}
      >
        <View style={styles.topSection}>
          {/* <View style={styles.rankingContainer}>
            <ThemedText style={styles.rankingText}>#{index + 1}</ThemedText>
          </View> */}
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
                {difficulties.standard.map((diff, idx) => (
                  <ThemedView
                    key={`standard-${diff.type}-${idx}`}
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
                  (diff, idx) =>
                    diff.level.jp && (
                      <ThemedView
                        key={`deluxe-${diff.type}-${idx}`}
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

  const getNumColumns = () => (viewMode === "icon" ? 3 : 1);

  const renderLevelOption = (id: SkillCeilingOptionId) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.levelRow,
        {
          backgroundColor: isDark ? "#333333" : "#F5F5F5",
          borderColor: optionId === id ? "#9944DD" : "transparent",
        },
      ]}
      onPress={() => onPickLevel(id)}
    >
      <ThemedText style={styles.levelRowText}>{t(`skillCeiling_${id}`)}</ThemedText>
      {optionId === id ? (
        <IconSymbol name="checkmark.circle.fill" size={22} color="#9944DD" />
      ) : null}
    </TouchableOpacity>
  );

  const showGate = profile && !profile.skillCeilingOptionId;

  const headerRight = () =>
    optionId ? (
      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={() => setRefreshNonce((n) => n + 1)}
          style={styles.headerIconBtn}
          accessibilityLabel={t("recommendationsRefresh")}
        >
          <Ionicons name="refresh" size={22} color="#9944DD" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setLevelModalVisible(true)}
          style={styles.headerLevelBtn}
        >
          <ThemedText style={{ color: "#9944DD", fontWeight: "600" }}>
            {t("recommendationsChangeLevel")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    ) : null;

  const renderSearchAndViewToggle = () => (
    <>
      <ThemedView style={styles.searchContainer}>
        <ThemedView
          style={[
            styles.searchInputContainer,
            { backgroundColor: isDark ? "#444444" : "#F0F0F0" },
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
              { color: isDark ? "#FFFFFF" : "#000000" },
            ]}
            placeholder={t("searchCharts")}
            placeholderTextColor={isDark ? "#AAAAAA" : "#888888"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.controlsContainer}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "list" && styles.toggleButtonActive,
              { backgroundColor: isDark ? "#444444" : "#F0F0F0" },
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
              { backgroundColor: isDark ? "#444444" : "#F0F0F0" },
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
    </>
  );

  if (loading || !profile) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: t("chartRecommendations"),
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText style={styles.loadingText}>{t("loadingCharts")}</ThemedText>
      </ThemedView>
    );
  }

  const renderMainContent = () => {
    if (error) {
      return (
        <ThemedView style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={40}
            color="#FF3B30"
          />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <ThemedText style={styles.retryButtonText}>{t("retry")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    if (recommended.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol name="music.note" size={60} color="#CCCCCC" />
          <ThemedText style={[styles.emptyText, { textAlign: "center", paddingHorizontal: 24 }]}>
            {t("recommendationsEmpty")}
          </ThemedText>
        </ThemedView>
      );
    }

    if (displayCharts.length === 0) {
      return (
        <View style={styles.mainColumn}>
          {renderSearchAndViewToggle()}
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="music.note" size={60} color="#CCCCCC" />
            <ThemedText style={styles.emptyText}>{t("noChartsFound")}</ThemedText>
          </ThemedView>
        </View>
      );
    }

    return (
      <View style={styles.mainColumn}>
        {renderSearchAndViewToggle()}
        <FlatList
          style={styles.listFlex}
          data={displayCharts}
          renderItem={({ item, index }) => renderChartItem({ item, index })}
          keyExtractor={(item) => item._id}
          numColumns={getNumColumns()}
          key={`${viewMode}-flat`}
          contentContainerStyle={[
            styles.chartsList,
            showAds && { paddingBottom: 70 },
          ]}
        />
      </View>
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: showGate ? t("recommendationsPickLevel") : t("chartRecommendations"),
          headerBackButtonDisplayMode: "minimal",
          headerRight,
        }}
      />

      {showGate ? (
        <ScrollView
          contentContainerStyle={[
            styles.gateScroll,
            { paddingBottom: 24 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={styles.gateHint}>{t("recommendationsPickLevelHint")}</ThemedText>
          {SKILL_CEILING_OPTION_ORDER.map(renderLevelOption)}
        </ScrollView>
      ) : (
        renderMainContent()
      )}

      <Modal
        visible={levelModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLevelModalVisible(false)}
      >
        <ThemedView style={{ flex: 1, paddingTop: insets.top + 12 }}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">{t("recommendationsChangeLevel")}</ThemedText>
            <TouchableOpacity onPress={() => setLevelModalVisible(false)}>
              <ThemedText style={{ color: "#9944DD", fontWeight: "600" }}>
                {t("ok")}
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {SKILL_CEILING_OPTION_ORDER.map((id) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.levelRow,
                  {
                    backgroundColor: isDark ? "#333333" : "#F5F5F5",
                    borderColor: optionId === id ? "#9944DD" : "transparent",
                  },
                ]}
                onPress={() => onPickLevel(id)}
              >
                <ThemedText style={styles.levelRowText}>{t(`skillCeiling_${id}`)}</ThemedText>
                {optionId === id ? (
                  <IconSymbol name="checkmark.circle.fill" size={22} color="#9944DD" />
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainColumn: {
    flex: 1,
  },
  listFlex: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerLevelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  gateScroll: {
    padding: 16,
  },
  gateHint: {
    marginBottom: 16,
    lineHeight: 22,
    opacity: 0.85,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  levelRowText: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
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
    alignItems: "center",
  },
  rankingContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  chartImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
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
  rankingBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  rankingBadgeText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "bold",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
