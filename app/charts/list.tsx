import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { ChartAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Chart } from "@/types/chart";

export default function ChartListScreen() {
  const { type, value } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [charts, setCharts] = useState<Chart[]>([]);
  const [originalCharts, setOriginalCharts] = useState<Chart[]>([]); // Add this line
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setOriginalCharts(data); // Store original data here
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
      // Reset to original charts when search query is empty
      setCharts(originalCharts);
      return;
    }

    const filtered = originalCharts.filter(
      // Filter from original charts
      (chart) =>
        chart.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chart.artist &&
          chart.artist.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setCharts(filtered);
  }, [searchQuery, originalCharts]);

  // Update the getDifficulties function to handle level as an object
  const getDifficulties = (chart: Chart) => {
    interface SimpleDifficulty {
      type: string;
      level: any; // Using 'any' here since level is complex
    }

    const result: {
      standard: SimpleDifficulty[];
      deluxe: SimpleDifficulty[];
    } = {
      standard: [],
      deluxe: [],
    };

    // Function to sort difficulties
    const sortByDifficultyOrder = (difficulties: SimpleDifficulty[]) => {
      const difficultyOrder = ["basic", "advanced", "expert", "master", "remaster"];
      return difficulties.sort((a, b) => {
        return difficultyOrder.indexOf(a.type) - difficultyOrder.indexOf(b.type);
      });
    };

    // Get difficulties from standard version
    if (chart.standard && chart.standard.difficulties) {
      result.standard = sortByDifficultyOrder(
        chart.standard.difficulties.map((diff) => ({
          type: diff.type,
          level: diff.level,
        }))
      );
    }

    // Get difficulties from deluxe version
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
    // Default to JP level, fallback to international if JP isn't available
    const levelValue = levelObj.jp || levelObj.international || 0;

    return Math.round((levelValue % 1) * 100) / 100 >= 0.6
      ? `${Math.floor(levelValue)}+`
      : `${Math.floor(levelValue)}`;
  };

  const renderChartItem = ({ item }: { item: Chart }) => {
    const difficulties = getDifficulties(item);
    console.log(14.6 % 1);
    return (
      <TouchableOpacity
        style={[
          styles.chartCard,
          { backgroundColor: colorScheme === "dark" ? "#333333" : "#FFFFFF" },
        ]}
        onPress={() =>
          router.push({
            pathname: "/charts/[id]",
            params: { id: item._id },
          })
        }
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
                {difficulties.deluxe.map((diff, index) => (
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
                ))}
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

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* <SafeAreaView style={styles.container}> */}
        <Stack.Screen
          options={{
            title: value ? `${value.toString()}${!loading ? ` (${charts.length})`: ""}` : "Charts",
            headerBackTitle: "Categories",
          }}
        />
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
              placeholder="Search charts..."
              placeholderTextColor={
                colorScheme === "dark" ? "#AAAAAA" : "#888888"
              }
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </ThemedView>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors[colorScheme ?? "light"].tint}
            />
            <ThemedText style={styles.loadingText}>
              Loading charts...
            </ThemedText>
          </ThemedView>
        ) : error ? (
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
                // Re-fetch charts
                ChartAPI.getChartsByCategory(type.toString(), value.toString())
                  .then((data) => {
                    setCharts(data);
                    setLoading(false);
                  })
                  .catch((err) => {
                    console.error(`Error fetching charts for ${value}:`, err);
                    setError("Failed to load charts. Please try again.");
                    setLoading(false);
                  });
              }}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : charts.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="music.note" size={60} color="#CCCCCC" />
            <ThemedText style={styles.emptyText}>No charts found</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={charts}
            renderItem={renderChartItem}
            keyExtractor={(item) => item._id}
            numColumns={1}
            contentContainerStyle={styles.chartsList}
          />
        )}
      {/* </SafeAreaView> */}
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
    marginBottom: 16,
    paddingHorizontal: 8,
    marginTop: 16
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
});
