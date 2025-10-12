import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCrystalStatus, getHighScores } from "@/api/client";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { UserScore } from "@/types/game";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BannerAdComponent } from "@/components/BannerAdComponent";
import { useAds } from "@/context/AdContext";
import {
  fetchDataImmediately,
  useCrystalStatus,
  useGameScores,
} from "@/context/GameQueryProvider";

// Helper function to format the time remaining
const formatTimeRemaining = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function GameHomeScreen() {
  const [user, setUser] = useState(null);
  const [localScores, setLocalScores] = useState({
    visual: { highScore: 0, currentStreak: 0 },
    audio: { highScore: 0, currentStreak: 0 },
  });

  const { data: scores, isLoading: scoresLoading } = useGameScores();
  const { data: crystalStatus, isLoading: crystalsLoading } =
    useCrystalStatus();

  const serverScores = {
    visual: scores?.find((s: UserScore) => s.mode === "visual") || {
      highScore: 0,
      currentStreak: 0,
    },
    audio: scores?.find((s: UserScore) => s.mode === "audio") || {
      highScore: 0,
      currentStreak: 0,
    },
  };

  // const [isLoading, setIsLoading] = useState(true);
  const isLoading = scoresLoading || crystalsLoading;

  const insets = useSafeAreaInsets();
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const showActualAds = !adsRemoved && !temporaryAdRemoval;

  // Add state for the modal inside the GameHomeScreen component
  const [showCrystalInfo, setShowCrystalInfo] = useState(false);

  useEffect(() => {
    // Check if user is logged in using your existing method
    checkUserAuth();
    loadLocalScores();

    // Create and call an async function
    const fetchData = async () => {
      await fetchDataImmediately("gameScores");
      await fetchDataImmediately("crystalStatus");
    };

    fetchData();
  }, []);

  // Add focus listener to refresh scores when returning to this screen
  useFocusEffect(
    useCallback(() => {
      loadLocalScores();
    }, [user])
  );

  const checkUserAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };

  const loadLocalScores = async () => {
    try {
      const savedScores = await AsyncStorage.getItem("songQuizScores");
      if (savedScores) {
        setLocalScores(JSON.parse(savedScores));
      }
    } catch (error) {
      console.error("Error loading local scores:", error);
    }
  };

  const startGame = (mode: string) => {
    router.push({
      pathname: "game/play",
      params: { mode },
    });
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
          <IconSymbol name="chevron.left" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <ThemedText
          style={{
            fontSize: 24,
            fontWeight: "bold",
            flex: 1,
            textAlign: "center",
          }}
        >
          Song Quiz Game
        </ThemedText>
        <TouchableOpacity
          style={styles.trophyContainer}
          onPress={() => router.push("/game/leaderboard")}
        >
          <Ionicons name="trophy-outline" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.description}>
        Test your maimai knowledge! Guess songs from thumbnails and audio.
      </ThemedText>
      <ScrollView>
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, { backgroundColor: "#9944DD" }]}
            onPress={() => startGame("visual")}
          >
            <ThemedText style={styles.modeButtonText}>Visual Mode</ThemedText>
            <ThemedText style={styles.modeDescription}>
              Guess songs from thumbnails and screenshots
            </ThemedText>
            <View style={styles.scoreContainer}>
              <ThemedText style={styles.scoreText}>
                High Score:{" "}
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : user ? (
                  serverScores.visual.highScore
                ) : (
                  localScores.visual.highScore
                )}
              </ThemedText>
              <ThemedText style={styles.scoreText}>
                Current Streak:{" "}
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : user ? (
                  serverScores.visual.currentStreak
                ) : (
                  localScores.visual.currentStreak
                )}
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, { backgroundColor: "#4C8BF5" }]}
            onPress={() => startGame("audio")}
          >
            <ThemedText style={styles.modeButtonText}>Audio Mode</ThemedText>
            <ThemedText style={styles.modeDescription}>
              Guess songs from audio clips
            </ThemedText>
            <View style={styles.scoreContainer}>
              <ThemedText style={styles.scoreText}>
                High Score:{" "}
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : user ? (
                  serverScores.audio?.highScore || 0
                ) : (
                  localScores.audio?.highScore || 0
                )}
              </ThemedText>
              <ThemedText style={styles.scoreText}>
                Current Streak:{" "}
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : user ? (
                  serverScores.audio?.currentStreak || 0
                ) : (
                  localScores.audio?.currentStreak || 0
                )}
              </ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, { backgroundColor: "#4CAF50" }]}
            onPress={() => router.push("/game/casual-play")}
          >
            <ThemedText style={styles.modeButtonText}>Casual Mode</ThemedText>
            <ThemedText style={styles.modeDescription}>
              Customize your play experience
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              {
                flexDirection: "row",
                justifyContent: "flex-start",
                gap: 25,
                alignItems: "center",
                backgroundColor: "rgba(174, 117, 218, 0.1)",
              },
            ]}
            onPress={() => {
              if (user) {
                setShowCrystalInfo(true);
              } else {
                router.replace("/auth/login");
              }
            }}
          >
            <Image
              source={require("@/assets/images/crystal.png")}
              style={{ height: 100, width: 50 }}
            />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ThemedText style={{ fontSize: 16, fontWeight: "bold" }}>
                  Get 50 Crystals daily!
                </ThemedText>
              </View>
              <View
                style={{
                  marginTop: 16,
                  height: 25,
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: 6,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <View
                  style={{
                    width: `${Math.min(
                      100,
                      ((crystalStatus?.dailyCrystalsEarned || 0) /
                        (crystalStatus?.dailyLimit || 50)) *
                        100
                    )}%`,
                    height: "100%",
                    backgroundColor: "#4C8BF5",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: "white",
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    {user
                      ? `${crystalStatus.dailyCrystalsEarned} / ${crystalStatus.dailyLimit}`
                      : "Login to earn crystals!"}
                  </ThemedText>
                </View>
              </View>
              {user && crystalStatus.timeUntilReset && (
                <ThemedText
                  style={{ fontSize: 12, color: "gray", marginTop: 10 }}
                >
                  Resets in: {formatTimeRemaining(crystalStatus.timeUntilReset)}
                </ThemedText>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showActualAds && (
        <View style={dynamicStyles.bottomAdContainer}>
          <BannerAdComponent />
        </View>
      )}

      <Modal
        visible={showCrystalInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCrystalInfo(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCrystalInfo(false)}
        >
          <ThemedView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Image
                source={require("@/assets/images/crystal.png")}
                style={{ height: 50, width: 25, marginRight: 10 }}
              />
              <ThemedText style={styles.modalTitle}>
                Daily Crystal Rewards
              </ThemedText>
              <View></View>
            </View>

            <View style={styles.modalContent}>
              <ThemedText style={styles.modalSubtitle}>
                How to earn crystals:
              </ThemedText>

              <View style={styles.rewardItem}>
                <ThemedText style={styles.rewardLabel}>
                  Visual Mode & Audio Mode:
                </ThemedText>
                <ThemedText style={styles.rewardDescription}>
                  Get All Perfect (10/10) → 25 crystals
                </ThemedText>
              </View>

              <View style={styles.rewardItem}>
                <ThemedText style={styles.rewardLabel}>Casual Mode:</ThemedText>
                <ThemedText style={styles.rewardDescription}>
                  Get at least 5/10 → 10 crystals
                </ThemedText>
              </View>

              <View style={styles.divider} />

              <ThemedText style={styles.limitText}>
                Maximum 50 crystals can be earned daily
              </ThemedText>
              <ThemedText style={styles.resetText}>
                Resets daily at 4:00 AM (GMT+8)
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCrystalInfo(false)}
            >
              <ThemedText style={styles.closeButtonText}>Got it</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  modeContainer: {
    gap: 16,
    marginBottom: 24,
  },
  modeButton: {
    padding: 16,
    borderRadius: 12,
  },
  modeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modeDescription: {
    color: "white",
    fontSize: 14,
    marginBottom: 16,
  },
  scoreContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 12,
    borderRadius: 8,
  },
  scoreText: {
    color: "white",
    fontSize: 14,
  },
  leaderboardButton: {
    backgroundColor: "#696FC7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  leaderboardButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    marginRight: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  bottomAdContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
  },
  trophyContainer: {
    marginLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9944DD",
  },
  modalContent: {
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  rewardItem: {
    marginBottom: 12,
  },
  rewardLabel: {
    fontSize: 15,
    fontWeight: "bold",
  },
  rewardDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 15,
  },
  limitText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#9944DD",
  },
  resetText: {
    fontSize: 13,
    marginTop: 5,
    color: "gray",
  },
  closeButton: {
    backgroundColor: "#9944DD",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
