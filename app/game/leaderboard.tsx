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

// If you need to define it inline:
// type LeaderboardEntry = {
//   id: string;
//   username: string;
//   highScore: number;
// };

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState("normal");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

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
  }) => (
    <View style={styles.leaderboardItem}>
      <ThemedText style={styles.rankText}>#{index + 1}</ThemedText>
      <ThemedText style={styles.usernameText}>{item.username}</ThemedText>
      <ThemedText style={styles.scoreText}>{item.highScore}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
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
            activeMode === "normal" && styles.activeTabButton,
          ]}
          onPress={() => setActiveMode("normal")}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              activeMode === "normal" && styles.activeTabButtonText,
            ]}
          >
            Normal Mode
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeMode === "hard" && styles.activeTabButton,
          ]}
          onPress={() => setActiveMode("hard")}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              activeMode === "hard" && styles.activeTabButtonText,
            ]}
          >
            Hard Mode
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.leaderboardHeader}>
        <ThemedText style={styles.headerRankText}>Rank</ThemedText>
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
});
