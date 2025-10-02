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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHighScores } from "@/api/client";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { UserScore } from "@/types/game";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BannerAdComponent } from "@/components/BannerAdComponent";
import { useAds } from "@/context/AdContext";

export default function GameHomeScreen() {
  const [user, setUser] = useState(null);
  const [localScores, setLocalScores] = useState({
    visual: { highScore: 0, currentStreak: 0 },
    audio: { highScore: 0, currentStreak: 0 },
  });
  const [serverScores, setServerScores] = useState({
    visual: { highScore: 0, currentStreak: 0 },
    audio: { highScore: 0, currentStreak: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const showActualAds = !adsRemoved && !temporaryAdRemoval;

  useEffect(() => {
    // Check if user is logged in using your existing method
    checkUserAuth();
    loadLocalScores();
  }, []);

  // Add focus listener to refresh scores when returning to this screen
  useFocusEffect(
    useCallback(() => {
      loadLocalScores();
      if (user) {
        loadServerScores();
      }
    }, [user])
  );

  const checkUserAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        setUser(JSON.parse(userData));
        loadServerScores();
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };

  const loadLocalScores = async () => {
    try {
      setIsLoading(true);
      const savedScores = await AsyncStorage.getItem("songQuizScores");
      if (savedScores) {
        setLocalScores(JSON.parse(savedScores));
      }
    } catch (error) {
      console.error("Error loading local scores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServerScores = async () => {
    try {
      setIsLoading(true);
      const scores = await getHighScores();
      setServerScores({
        visual: scores.find((s: UserScore) => s.mode === "visual") || {
          highScore: 0,
          currentStreak: 0,
        },
        audio: scores.find((s: UserScore) => s.mode === "audio") || {
          highScore: 0,
          currentStreak: 0,
        },
      });
    } catch (error) {
      console.error("Error loading server scores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = (mode: string) => {
    if (!user && mode === "hard") {
      Alert.alert(
        "Login Required",
        "You need to be logged in to play Hard mode.",
        [
          { text: "Login", onPress: () => router.push("/auth/login") },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    router.push({
      pathname: "game/play",
      params: { mode },
    });
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
        <View style={{ width: 36 }} />
      </View>
      <ThemedText style={styles.description}>
        Test your maimai knowledge! Guess songs from thumbnails and screenshots.
      </ThemedText>

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
      </View>

      <TouchableOpacity
        style={styles.leaderboardButton}
        onPress={() => router.push("/game/leaderboard")}
      >
        <ThemedText style={styles.leaderboardButtonText}>
          View Leaderboards
        </ThemedText>
      </TouchableOpacity>
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
    // paddingHorizontal: 16,
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
});
