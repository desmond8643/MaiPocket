import { ChartAPI } from "@/api/client";
import { BannerAdComponent } from "@/components/BannerAdComponent";
import {
  preloadInterstitialAd,
  showInterstitialAd,
} from "@/components/InterstitialAdComponent";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useShowAds } from "@/hooks/useShowAds";
import { Chart } from "@/types/chart";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TimelineSection {
  date: string;
  charts: Chart[];
}

const ICON_SIZE = (Dimensions.get("window").width - 80) / 4; // 4 columns with margins

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { showAds, dynamicStyles } = useShowAds(false);

  const [sections, setSections] = useState<TimelineSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const groupChartsByDate = (charts: Chart[]): TimelineSection[] => {
    const grouped: { [key: string]: Chart[] } = {};

    charts.forEach((chart) => {
      if (chart.releasedDate) {
        const date = new Date(chart.releasedDate).toISOString().split("T")[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(chart);
      }
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, charts]) => ({ date, charts }));
  };

  const mergeSections = (
    existing: TimelineSection[],
    newSections: TimelineSection[]
  ): TimelineSection[] => {
    const merged = [...existing];

    newSections.forEach((newSection) => {
      const existingIndex = merged.findIndex((s) => s.date === newSection.date);
      if (existingIndex >= 0) {
        // Merge charts, avoiding duplicates
        const existingIds = new Set(
          merged[existingIndex].charts.map((c) => c._id)
        );
        const newCharts = newSection.charts.filter(
          (c) => !existingIds.has(c._id)
        );
        merged[existingIndex].charts.push(...newCharts);
      } else {
        merged.push(newSection);
      }
    });

    return merged.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const fetchCharts = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await ChartAPI.getTimelineCharts(pageNum, 50);
        console.log(response.charts)
        const newSections = groupChartsByDate(response.charts);

        if (isRefresh || pageNum === 1) {
          setSections(newSections);
        } else {
          setSections((prev) => mergeSections(prev, newSections));
        }

        setHasMore(response.pagination.hasMore);
      } catch (error) {
        console.error("Error fetching timeline:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

    useEffect(() => {
      fetchCharts(1);
    }, [fetchCharts]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchCharts(1, true);
//     }, [])
//   );

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCharts(nextPage);
    }
  };

  useEffect(() => {
    if (showAds) {
      preloadInterstitialAd();
    }
  }, [showAds]);

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

  const formatDate = (dateString: string) => {
    return dateString; // Already in YYYY-MM-DD format
  };

  const renderChartIcon = ({ item }: { item: Chart }) => (
    <TouchableOpacity
      style={styles.iconWrapper}
      onPress={() => navigateToChart(item._id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.chartIcon}
        contentFit="cover"
        transition={200}
      />
    </TouchableOpacity>
  );

  const renderSection = ({
    item,
    index,
  }: {
    item: TimelineSection;
    index: number;
  }) => {
    const isFirst = index === 0;
    const isLast = index === sections.length - 1;

    return (
      <View style={styles.sectionContainer}>
        {/* Timeline connector */}
        <View style={styles.timelineConnector}>
          {/* Dot */}
          {/* <View
            style={[
              styles.timelineDot,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
            ]}
          /> */}
          <Image
            source={
              index % 2 === 0
                ? require("@/assets/images/tap.svg")
                : require("@/assets/images/slide.svg")
            }
            style={[
              styles.timelineIcon,
              {
                tintColor:
                  index % 2 === 0
                    ? "#E83C91"
                    : Colors[colorScheme ?? "light"].tint,
              },
            ]}
          />
          {/* Line */}
          {!isLast && (
            <View
              style={[
                styles.timelineLine,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#444444" : "#E0E0E0",
                },
              ]}
            />
          )}
        </View>

        {/* Content */}
        <View style={styles.sectionContent}>
          {/* Date header */}
          <ThemedText style={styles.dateHeader}>
            {formatDate(item.date)}
          </ThemedText>

          {/* Charts grid */}
          <View style={styles.chartsGrid}>
            {item.charts.map((chart) => (
              <TouchableOpacity
                key={chart._id}
                style={styles.iconWrapper}
                onPress={() => navigateToChart(chart._id)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: chart.image }}
                  style={styles.chartIcon}
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator
          size="small"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: t("timeline") || "Timeline",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText style={styles.loadingText}>{t("loading")}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t("timeline") || "Timeline",
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.date}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: showAds ? insets.bottom + 70 : insets.bottom + 20 },
        ]}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
      {showAds && (
        <View style={dynamicStyles.bottomAdContainer}>
          <BannerAdComponent />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  timelineConnector: {
    width: 40,
    alignItems: "center",
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  sectionContent: {
    flex: 1,
    marginLeft: 12,
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  chartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chartIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  timelineIcon: {
    width: 25,
    height: 25,
    zIndex: 1,
  },
});
