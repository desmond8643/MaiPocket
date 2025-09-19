import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Stack } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ChartAPI } from "@/api/client";
import { Chart } from "@/types/chart";

export default function ChartDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [chart, setChart] = useState<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"standard" | "deluxe">(
    "standard"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [posts, setPosts] = useState([]);

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const data = await ChartAPI.getChartById(id.toString());
        setChart(data);

        // Set default selections
        if (data.standard && data.standard.difficulties.length > 0) {
          setSelectedType("standard");
          const masterDiff = data.standard.difficulties.find((d: { type: string }) => d.type === "master");
          setSelectedDifficulty(masterDiff ? masterDiff.type : data.standard.difficulties[0].type);
        } else if (data.deluxe && data.deluxe.difficulties.length > 0) {
          setSelectedType("deluxe");
          const masterDiff = data.deluxe.difficulties.find((d: { type: string }) => d.type === "master");
          setSelectedDifficulty(masterDiff ? masterDiff.type : data.deluxe.difficulties[0].type);
        }

        // You'd need to implement this API method
        // fetchPosts(data._id, selectedType, selectedDifficulty);
      } catch (err) {
        console.error("Error fetching chart:", err);
        setError("Failed to load chart details");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [id]);

  // Helper function to format level display
  const formatLevelDisplay = (levelObj: {
    jp?: number;
    international?: number;
  }) => {
    const levelValue = levelObj.jp || levelObj.international || 0;

    return Math.round((levelValue % 1) * 100) / 100 >= 0.6
      ? `${Math.floor(levelValue)}+`
      : `${Math.floor(levelValue)}`;
  };

  // When type or difficulty changes, fetch corresponding posts
  useEffect(() => {
    if (!chart || !selectedDifficulty) return;

    // Fetch posts for the selected chart type and difficulty
    // You'd need to implement this API method
    // fetchPosts(chart._id, selectedType, selectedDifficulty);
  }, [chart, selectedType, selectedDifficulty]);

  const getDifficultyColor = (type: string) => {
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
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: chart ? chart.title : "Chart Details",
          headerBackTitle: "Charts",
        }}
      />
      
      <ThemedView style={{ flex: 1 }}>
        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors[colorScheme ?? "light"].tint}
            />
            <ThemedText style={styles.loadingText}>
              Loading chart details...
            </ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : !chart ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Chart not found</ThemedText>
          </ThemedView>
        ) : (
          <ScrollView style={styles.container}>
            {/* Chart Info Section */}
            <View style={styles.chartHeader}>
              <Image
                source={{ uri: chart.image }}
                style={styles.chartImage}
                contentFit="cover"
              />
              <View style={styles.chartInfo}>
                <ThemedText type="defaultSemiBold" style={styles.title}>
                  {chart.title}
                </ThemedText>
                <ThemedText style={styles.artist}>{chart.artist}</ThemedText>
                <ThemedText style={styles.category}>{chart.category}</ThemedText>
                <ThemedText style={styles.bpm}>BPM: {chart.bpm || "N/A"}</ThemedText>
              </View>
            </View>

            {/* Chart Type Selector */}
            <View style={styles.selectorContainer}>
              {chart.standard && (
                <TouchableOpacity
                  style={[
                    styles.typeSelector,
                    styles.standardLabel,
                    selectedType !== "standard" && styles.dimmedButton,
                  ]}
                  onPress={() => setSelectedType("standard")}
                >
                  <ThemedText style={styles.standardLabelText}>
                    スタンダード
                  </ThemedText>
                </TouchableOpacity>
              )}

              {chart.deluxe && (
                <TouchableOpacity
                  style={[
                    styles.typeSelector,
                    styles.deluxeLabel,
                    selectedType !== "deluxe" && styles.dimmedButton,
                  ]}
                  onPress={() => setSelectedType("deluxe")}
                >
                  <ThemedText>
                    <ThemedText style={[styles.deluxeLabelText, { color: "#FF0000" }]}>で</ThemedText>
                    <ThemedText style={[styles.deluxeLabelText, { color: "#FF8C00" }]}>ら</ThemedText>
                    <ThemedText style={[styles.deluxeLabelText, { color: "#FFD93D" }]}>っ</ThemedText>
                    <ThemedText style={[styles.deluxeLabelText, { color: "#7ADAA5" }]}>く</ThemedText>
                    <ThemedText style={[styles.deluxeLabelText, { color: "#3396D3" }]}>す</ThemedText>
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Difficulty Selector */}
            <View style={styles.difficultyContainer}>
              {chart[selectedType]?.difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff.type}
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(diff.type) },
                    selectedDifficulty !== diff.type && styles.dimmedButton,
                  ]}
                  onPress={() => setSelectedDifficulty(diff.type)}
                >
                  <ThemedText style={styles.difficultyText}>
                    {formatLevelDisplay(typeof diff.level === 'number' ? {jp: diff.level} : diff.level)}
                  </ThemedText>
                  {/* <ThemedText style={styles.difficultyType}>
                    {diff.type.charAt(0).toUpperCase() + diff.type.slice(1)}
                  </ThemedText> */}
                </TouchableOpacity>
              ))}
            </View>

            {/* Posts Section - To be implemented */}
            <View style={styles.postsSection}>
              <ThemedText style={styles.sectionTitle}>Posts</ThemedText>
              {posts.length > 0 ? (
                <ThemedText>Posts will be shown here</ThemedText>
              ) : (
                <ThemedText style={styles.noPosts}>
                  No posts yet for this chart
                </ThemedText>
              )}
            </View>
          </ScrollView>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  chartHeader: {
    flexDirection: "row",
    marginBottom: 24,
  },
  chartImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  chartInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  artist: {
    fontSize: 16,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    marginBottom: 4,
  },
  bpm: {
    fontSize: 14,
  },
  selectorContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  typeSelector: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedType: {
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  typeSelectorText: {
    fontWeight: "600",
  },
  difficultyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  difficultyBadge: {
    width: 70,
    height: 70,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  selectedDifficulty: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  difficultyText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  difficultyType: {
    color: "white",
    fontSize: 12,
  },
  chartDetails: {
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  difficultyDetails: {
    marginBottom: 8,
  },
  postsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noPosts: {
    textAlign: "center",
    color: "#888888",
    padding: 20,
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
  },
  standardLabel: {
    backgroundColor: "#4BAEEA",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  },
  deluxeLabelText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  selectedTypeButton: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  dimmedButton: {
    opacity: 0.6,
  },
});
