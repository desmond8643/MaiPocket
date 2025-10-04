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
  Modal,
  Text,
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

export default function ChartListScreen() {
  const { type, value } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [charts, setCharts] = useState<Chart[]>([]);
  const [originalCharts, setOriginalCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { showAds, dynamicStyles } = useShowAds(false);
  
  // New state variables for enhanced view options
  const [viewMode, setViewMode] = useState<"list" | "icon">("list");
  const [groupBy, setGroupBy] = useState<"none" | "version" | "level">("none");
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [groupedCharts, setGroupedCharts] = useState<{[key: string]: Chart[]}>({});

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

  // Group charts based on selected grouping option
  useEffect(() => {
    if (groupBy === "none") {
      // No grouping needed
      return;
    }

    const grouped: {[key: string]: Chart[]} = {};
    
    charts.forEach(chart => {
      let key = "Unknown";
      
      if (groupBy === "version") {
        // Use version released from standard or deluxe
        const version = chart.standard?.versionReleased || chart.deluxe?.versionReleased;
        key = version || "Unknown";
      } else if (groupBy === "level") {
        // Use master level if available, or the highest level
        let highestLevel = 0;
        
        // Check standard difficulties
        if (chart.standard?.difficulties) {
          chart.standard.difficulties.forEach(diff => {
            const levelValue = typeof diff.level === 'number' ? 
              diff.level : 
              (diff.level?.jp || diff.level?.international || 0);
              
            if (diff.type === "master" && levelValue > highestLevel) {
              highestLevel = levelValue;
            }
          });
        }
        
        // Check deluxe difficulties
        if (chart.deluxe?.difficulties) {
          chart.deluxe.difficulties.forEach(diff => {
            const levelValue = typeof diff.level === 'number' ? 
              diff.level : 
              (diff.level?.jp || diff.level?.international || 0);
              
            if (diff.type === "master" && levelValue > highestLevel) {
              highestLevel = levelValue;
            }
          });
        }
        
        key = highestLevel > 0 ? `${Math.floor(highestLevel)}` : "Unknown";
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(chart);
    });
    
    // Sort the keys
    const sortedGrouped: {[key: string]: Chart[]} = {};
    Object.keys(grouped)
      .sort((a, b) => {
        // Sort numerically for levels
        if (groupBy === "level") {
          return Number(a) - Number(b);
        }
        // Sort alphabetically for versions
        return a.localeCompare(b);
      })
      .forEach(key => {
        sortedGrouped[key] = grouped[key];
      });
    
    setGroupedCharts(sortedGrouped);
  }, [charts, groupBy]);

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

    // Function to sort difficulties
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
  
  // Determine the chart type and apply appropriate border
  const getChartBorderStyle = (chart: Chart) => {
    if (chart.standard && !chart.deluxe) {
      return styles.standardBorder;
    } else if (!chart.standard && chart.deluxe) {
      return styles.deluxeBorder;
    }
    
    // Check if chart has remaster difficulty
    const hasRemaster = 
      (chart.standard?.difficulties.some(d => d.type === "remaster")) || 
      (chart.deluxe?.difficulties.some(d => d.type === "remaster"));
    
    if (hasRemaster) {
      return styles.remasterBorder;
    }
    
    // Default to standard border if both exist
    return styles.standardBorder;
  };

  const renderChartItem = ({ item }: { item: Chart }) => {
    const difficulties = getDifficulties(item);
    
    // List View
    if (viewMode === "list") {
      return (
        <TouchableOpacity
          style={[
            styles.chartCard,
            { backgroundColor: colorScheme === "dark" ? "#333333" : "#FFFFFF" },
          ]}
          onPress={() => {
            if (showAds) {
              showInterstitialAd(() => {
                router.push({
                  pathname: "/charts/[id]",
                  params: { id: item._id },
                });
              });
            } else {
              router.push({
                pathname: "/charts/[id]",
                params: { id: item._id },
              });
            }
          }}
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
    } 
    // Icon View
    else {
      return (
        <TouchableOpacity
          style={[
            styles.chartIcon,
            getChartBorderStyle(item),
          ]}
          onPress={() => {
            if (showAds) {
              showInterstitialAd(() => {
                router.push({
                  pathname: "/charts/[id]",
                  params: { id: item._id },
                });
              });
            } else {
              router.push({
                pathname: "/charts/[id]",
                params: { id: item._id },
              });
            }
          }}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.chartIconImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      );
    }
  };
  
  const renderGroupHeader = (title: string) => {
    return (
      <ThemedView style={styles.groupHeader}>
        <ThemedText style={styles.groupHeaderText}>{title}</ThemedText>
      </ThemedView>
    );
  };

  // Render ungrouped content
  const renderUngroupedContent = () => {
    if (viewMode === "list") {
      return (
        <FlatList
          data={charts}
          renderItem={renderChartItem}
          keyExtractor={(item) => item._id}
          numColumns={1}
          contentContainerStyle={[styles.chartsList, { paddingBottom: 70 }]}
        />
      );
    } else {
      return (
        <FlatList
          data={charts}
          renderItem={renderChartItem}
          keyExtractor={(item) => item._id}
          numColumns={3}
          contentContainerStyle={[styles.chartsIconGrid, { paddingBottom: 70 }]}
        />
      );
    }
  };
  
  // Render grouped content
  const renderGroupedContent = () => {
    return (
      <FlatList
        data={Object.keys(groupedCharts)}
        keyExtractor={(item) => item}
        renderItem={({ item: groupKey }) => (
          <View style={styles.groupContainer}>
            {renderGroupHeader(groupKey)}
            <View style={styles.groupContent}>
              {viewMode === "list" ? (
                groupedCharts[groupKey].map(chart => (
                  <View key={chart._id} style={{width: '100%'}}>
                    {renderChartItem({ item: chart })}
                  </View>
                ))
              ) : (
                <FlatList
                  data={groupedCharts[groupKey]}
                  renderItem={renderChartItem}
                  keyExtractor={(item) => item._id}
                  numColumns={3}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>
        )}
        contentContainerStyle={[styles.chartsList, { paddingBottom: 70 }]}
      />
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: value
            ? `${value.toString()}${!loading ? ` (${charts.length})` : ""}`
            : "Charts",
          headerBackTitle: "Categories",
        }}
      />
      
      <View style={styles.toolbarContainer}>
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
        
        {/* View options button */}
        <TouchableOpacity 
          style={styles.viewOptionsButton}
          onPress={() => setShowViewOptions(true)}
        >
          <IconSymbol
            name="line.3.horizontal.decrease.circle"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
      </View>

      {/* View options modal */}
      <Modal
        visible={showViewOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowViewOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowViewOptions(false)}
        >
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Display Options</ThemedText>
            
            <ThemedText style={styles.modalSectionTitle}>View Mode</ThemedText>
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  viewMode === "list" && styles.selectedOption
                ]}
                onPress={() => {
                  setViewMode("list");
                }}
              >
                <IconSymbol
                  name="list.bullet"
                  size={20}
                  color={viewMode === "list" ? "#FFFFFF" : Colors[colorScheme ?? "light"].text}
                />
                <ThemedText 
                  style={[
                    styles.optionText,
                    viewMode === "list" && {color: "#FFFFFF"}
                  ]}
                >
                  List
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton,
                  viewMode === "icon" && styles.selectedOption
                ]}
                onPress={() => {
                  setViewMode("icon");
                }}
              >
                <IconSymbol
                  name="square.grid.2x2"
                  size={20}
                  color={viewMode === "icon" ? "#FFFFFF" : Colors[colorScheme ?? "light"].text}
                />
                <ThemedText 
                  style={[
                    styles.optionText,
                    viewMode === "icon" && {color: "#FFFFFF"}
                  ]}
                >
                  Icons
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ThemedText style={styles.modalSectionTitle}>Group By</ThemedText>
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  groupBy === "none" && styles.selectedOption
                ]}
                onPress={() => {
                  setGroupBy("none");
                }}
              >
                <ThemedText 
                  style={[
                    styles.optionText,
                    groupBy === "none" && {color: "#FFFFFF"}
                  ]}
                >
                  None
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton,
                  groupBy === "version" && styles.selectedOption
                ]}
                onPress={() => {
                  setGroupBy("version");
                }}
              >
                <ThemedText 
                  style={[
                    styles.optionText,
                    groupBy === "version" && {color: "#FFFFFF"}
                  ]}
                >
                  Version
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton,
                  groupBy === "level" && styles.selectedOption
                ]}
                onPress={() => {
                  setGroupBy("level");
                }}
              >
                <ThemedText 
                  style={[
                    styles.optionText,
                    groupBy === "level" && {color: "#FFFFFF"}
                  ]}
                >
                  Level
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowViewOptions(false)}
            >
              <ThemedText style={styles.closeButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={styles.loadingText}>Loading charts...</ThemedText>
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
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : charts.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol name="music.note" size={60} color="#CCCCCC" />
          <ThemedText style={styles.emptyText}>No charts found</ThemedText>
        </ThemedView>
      ) : (
        // Render content based on grouping
        groupBy === "none" ? renderUngroupedContent() : renderGroupedContent()
      )}

      {/* Add the banner ad component */}
      {showAds && (
        <View style={dynamicStyles.bottomAdContainer}>
          <BannerAdComponent />
        </View>
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
  // Existing styles
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  bottomAdContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
  },
  
  // New styles
  toolbarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  viewOptionsButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    flex: 1,
    marginHorizontal: 4,
  },
  selectedOption: {
    backgroundColor: "#9944DD",
    borderColor: "#9944DD",
  },
  optionText: {
    marginLeft: 4,
    fontWeight: "500",
  },
  closeButton: {
    backgroundColor: "#9944DD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  chartIcon: {
    width: 100,
    height: 100,
    margin: 6,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 3,
  },
  chartIconImage: {
    width: "100%",
    height: "100%",
  },
  standardBorder: {
    borderColor: "#4BAEEA", // Blue border for standard charts
  },
  deluxeBorder: {
    borderColor: "#7ADAA5", // Green border for deluxe charts
  },
  remasterBorder: {
    borderColor: "#E9A5F1", // Light purple border for remaster charts
  },
  chartsIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  groupHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(153, 68, 221, 0.1)",
    marginBottom: 8,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  groupHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupContent: {
    flexDirection: "row", 
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
});
