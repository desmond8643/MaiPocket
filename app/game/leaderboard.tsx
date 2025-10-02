import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  View,
  ActivityIndicator,
} from "react-native";
import { getLeaderboard } from "@/api/client"; // We'll implement this
import { LeaderboardEntry } from "@/types/game"; // Import if available, or define inline
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BannerAdComponent } from "@/components/BannerAdComponent";
import { useAds } from "@/context/AdContext";

// If you need to define it inline:
// type LeaderboardEntry = {
//   id: string;
//   username: string;
//   highScore: number;
// };

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState("visual");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const insets = useSafeAreaInsets();
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const showActualAds = !adsRemoved && !temporaryAdRemoval;

  useEffect(() => {
    loadLeaderboard();
  }, [activeMode]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(activeMode);
      setLeaderboard(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => {
    // Special styling for top 3 positions
    let rankStyle = styles.rankText;

    if (index === 0) {
      rankStyle = styles.firstRank;
    } else if (index === 1) {
      rankStyle = styles.secondRank;
    } else if (index === 2) {
      rankStyle = styles.thirdRank;
    }

    return (
      <View style={styles.leaderboardItem}>
        <ThemedText style={rankStyle}>{index + 1}</ThemedText>
        <ThemedText style={styles.usernameText}>
          {item.displayName} (@{item.username})
        </ThemedText>
        <ThemedText style={styles.scoreText}>{item.highScore}</ThemedText>
      </View>
    );
  };

  const dynamicStyles = {
    bottomAdContainer: {
      ...styles.bottomAdContainer,
      bottom: insets.bottom, // Adjust for bottom inset
    },
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          {/* <IconSymbol name="chevron.left" size={24} /> */}
          <Ionicons name="arrow-back" size={24} color="#AE75DA" />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
          Leaderboards
        </ThemedText>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeMode === "visual" && styles.activeTabButton,
          ]}
          onPress={() => setActiveMode("visual")}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              activeMode === "visual" && styles.activeTabButtonText,
            ]}
          >
            Visual Mode
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeMode === "audio" && styles.activeTabButton,
          ]}
          onPress={() => setActiveMode("audio")}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              activeMode === "audio" && styles.activeTabButtonText,
            ]}
          >
            Audio Mode
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.leaderboardHeader}>
        <ThemedText style={styles.headerRankText}></ThemedText>
        <ThemedText style={styles.headerUsernameText}>Player</ThemedText>
        <ThemedText style={styles.headerScoreText}>Score</ThemedText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#696FC7" />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No scores yet</ThemedText>
          }
        />
      )}
      {showActualAds && (
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
    padding: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#696FC7",
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabButtonText: {
    fontWeight: "bold",
    color: "#696FC7",
  },
  leaderboardHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  headerRankText: {
    width: 50,
    fontWeight: "bold",
  },
  headerUsernameText: {
    flex: 1,
    fontWeight: "bold",
  },
  headerScoreText: {
    width: 60,
    textAlign: "right",
    fontWeight: "bold",
  },
  leaderboardItem: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.1)",
    alignItems: "center",
  },
  rankText: {
    width: 50,
    fontWeight: "bold",
  },
  firstRank: {
    width: 50,
    fontWeight: "bold",
    color: "#FFD700", // Yellow/gold color
    fontSize: 18,
  },
  secondRank: {
    width: 50,
    fontWeight: "bold",
    color: "#C0C0C0", // Silver/gray color
    fontSize: 17,
  },
  thirdRank: {
    width: 50,
    fontWeight: "bold",
    color: "#CD7F32", // Bronze/brown color
    fontSize: 16,
  },
  usernameText: {
    flex: 1,
  },
  scoreText: {
    width: 60,
    textAlign: "right",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
  },
  backButton: {
    marginRight: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    // paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomAdContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
  },
});
