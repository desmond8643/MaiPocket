import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";

import { AuthAPI, ChartAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Chart } from "@/types/chart";

export default function ChartDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const headerBtnRef = useRef<any>(null);

  // Function to open YouTube search
  const openYouTubeSearch = () => {
    if (!chart) return;

    setShowDropdown(false);
    const searchQuery = encodeURIComponent(`${chart.title} maimai`);
    const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    Linking.openURL(youtubeUrl).catch(err => console.error("Error opening YouTube:", err));
  };

  // Function to handle copy title
  const handleCopyTitle = () => {
    if (!chart) return;
    setShowDropdown(false);
    copyToClipboard(chart.title);
  };

  const openDropdown = () => {
    if (headerBtnRef.current) {
      headerBtnRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setDropdownPosition({
          top: pageY + height,
          right: 20,
        });
        setShowDropdown(true);
      });
    } else {
      setShowDropdown(true);
    }
  };

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
          const masterDiff = data.standard.difficulties.find(
            (d: { type: string }) => d.type === "master"
          );
          setSelectedDifficulty(
            masterDiff ? masterDiff.type : data.standard.difficulties[0].type
          );
        } else if (data.deluxe && data.deluxe.difficulties.length > 0) {
          setSelectedType("deluxe");
          const masterDiff = data.deluxe.difficulties.find(
            (d: { type: string }) => d.type === "master"
          );
          setSelectedDifficulty(
            masterDiff ? masterDiff.type : data.deluxe.difficulties[0].type
          );
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

  // Function to handle copying text to clipboard
  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);

    // Show feedback based on platform
    if (Platform.OS === "android") {
      ToastAndroid.show("Title copied to clipboard", ToastAndroid.SHORT);
    } else {
      // For iOS, show an alert instead of visual feedback
      Alert.alert("Copied", "Title copied to clipboard");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: chart ? chart.title : "Chart Details",
          headerBackTitle: "Charts",
          headerRight: () => (
            <TouchableOpacity
              ref={headerBtnRef}
              onPress={openDropdown}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="more-vert"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Dropdown Menu Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.dropdownContainer,
              {
                backgroundColor: Colors[colorScheme ?? "light"].background,
                borderColor: Colors[colorScheme ?? "light"].background,
                position: "absolute",
                top: dropdownPosition.top,
                right: dropdownPosition.right,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleCopyTitle}
            >
              <MaterialIcons
                name="content-copy"
                size={22}
                color={Colors[colorScheme ?? "light"].text}
              />
              <ThemedText style={styles.dropdownText}>Copy Title</ThemedText>
            </TouchableOpacity>

            <View
              style={[
                styles.dropdownSeparator,
                { backgroundColor: Colors[colorScheme ?? "light"].background },
              ]}
            />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={openYouTubeSearch}
            >
              <MaterialIcons
                name="search"
                size={22}
                color={Colors[colorScheme ?? "light"].text}
              />
              <ThemedText style={styles.dropdownText}>
                Search on YouTube
              </ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
                <TouchableOpacity
                  onPress={() => copyToClipboard(chart.title)}
                  activeOpacity={0.7}
                >
                  <ThemedText type="defaultSemiBold" style={styles.title}>
                    {chart.title}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.artist}>{chart.artist}</ThemedText>
                <ThemedText style={styles.category}>
                  {chart.category}
                </ThemedText>
                <ThemedText style={styles.bpm}>
                  BPM: {chart.bpm || "N/A"}
                </ThemedText>
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
                </TouchableOpacity>
              )}
            </View>

            {/* Difficulty Selector */}
            <View style={styles.difficultyContainer}>
              {chart[selectedType]?.difficulties
                .sort((a, b) => {
                  const difficultyOrder = [
                    "basic",
                    "advanced",
                    "expert",
                    "master",
                    "remaster",
                  ];
                  return (
                    difficultyOrder.indexOf(a.type) -
                    difficultyOrder.indexOf(b.type)
                  );
                })
                .map((diff) => (
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
                      {formatLevelDisplay(
                        typeof diff.level === "number"
                          ? { jp: diff.level }
                          : diff.level
                      )}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Posts Section - To be implemented */}
            <View style={styles.postsSection}>
              <View style={styles.postsSectionHeader}>
                <ThemedText style={styles.sectionTitle}>Posts</ThemedText>
                <TouchableOpacity
                  style={styles.addPostButton}
                  onPress={async () => {
                    const isLoggedIn = await AuthAPI.isLoggedIn();
                    
                    if (isLoggedIn) {
                      router.push({
                        pathname: "/charts/create-post",
                        params: {
                          chartId: chart._id,
                          chartType: selectedType,
                          difficulty: selectedDifficulty,
                        },
                      });
                    } else {
                      // Redirect to login with return URL parameters
                      router.push({
                        pathname: "/auth/login",
                        params: { 
                          returnTo: "charts", 
                          chartId: chart._id 
                        },
                      });
                    }
                  }}
                >
                  <MaterialIcons name="add" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.addPostButtonText}>
                    Add Post
                  </ThemedText>
                </TouchableOpacity>
              </View>

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
  postsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
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
  headerButton: {
    padding: 4,
    marginRight: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    // Remove justifyContent: "center" to prevent vertical centering
  },
  dropdownContainer: {
    borderRadius: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 16,
  },
  dropdownSeparator: {
    height: 1,
    marginHorizontal: 16,
  },
  addPostButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addPostButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
});
