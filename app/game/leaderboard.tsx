import { getLeaderboard } from "@/api/client";
import { BannerAdComponent } from "@/components/BannerAdComponent";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAds } from "@/context/AdContext";
import { useLocalization } from "@/context/LocalizationContext";
import { LeaderboardEntry } from "@/types/game";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState("visual");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const insets = useSafeAreaInsets();
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const showActualAds = !adsRemoved && !temporaryAdRemoval;
  const { t } = useLocalization();

  useEffect(() => {
    loadLeaderboard();
    checkLoginStatus();
  }, [activeMode]);

  const checkLoginStatus = async () => {
    const userData = await AsyncStorage.getItem("userData");
    setIsLoggedIn(!!userData);
  };

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

  const navigateToLogin = () => {
    router.push("/auth/login");
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => {
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
      bottom: insets.bottom,
    },
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#AE75DA" />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
          {t("leaderboards")}
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
            {t("visualMode")}
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
            {t("audioMode")}
          </ThemedText>
        </TouchableOpacity>
      </View>
      {!isLoggedIn && (
        <TouchableOpacity style={styles.loginPrompt} onPress={navigateToLogin}>
          <ThemedText style={styles.loginPromptText}>
            {t("loginToCompete")}
          </ThemedText>
          <Ionicons name="arrow-forward" size={18} color="#696FC7" />
        </TouchableOpacity>
      )}
      <View style={styles.leaderboardHeader}>
        <ThemedText style={styles.headerRankText}></ThemedText>
        <ThemedText style={styles.headerUsernameText}>{t("player")}</ThemedText>
        <ThemedText style={styles.headerScoreText}>{t("score")}</ThemedText>
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
          contentContainerStyle={{...styles.listContent, paddingBottom: showActualAds ? 60 : 0}}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>{t("noScoresYet")}</ThemedText>
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
  loginPrompt: {
    flexDirection: "row",
    backgroundColor: "rgba(174, 117, 218, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  loginPromptText: {
    color: "#696FC7",
    fontWeight: "600",
  },
});
