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

export default function GameHomeScreen() {
  const [user, setUser] = useState(null);
  const [localScores, setLocalScores] = useState({
    normal: { highScore: 0, currentStreak: 0 },
    hard: { highScore: 0, currentStreak: 0 },
  });
  const [serverScores, setServerScores] = useState({
    normal: { highScore: 0, currentStreak: 0 },
    hard: { highScore: 0, currentStreak: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

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
        normal: scores.find((s: UserScore) => s.mode === "normal") || {
          highScore: 0,
          currentStreak: 0,
        },

        hard: scores.find((s: UserScore) => s.mode === "hard") || {
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
          Song Quiz Game
        </ThemedText>
      </View>
      <ThemedText style={styles.description}>
        Test your maimai knowledge! Guess the song from its thumbnail.
      </ThemedText>

      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, { backgroundColor: "#9944DD" }]}
          onPress={() => startGame("normal")}
        >
          <ThemedText style={styles.modeButtonText}>Normal Mode</ThemedText>
          <ThemedText style={styles.modeDescription}>
            Current songs only
          </ThemedText>
          <View style={styles.scoreContainer}>
            <ThemedText style={styles.scoreText}>
              High Score:{" "}
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : user ? (
                serverScores.normal.highScore
              ) : (
                localScores.normal.highScore
              )}
            </ThemedText>
            <ThemedText style={styles.scoreText}>
              Current Streak:{" "}
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : user ? (
                serverScores.normal.currentStreak
              ) : (
                localScores.normal.currentStreak
              )}
            </ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, { backgroundColor: "#E9A5F1" }]}
          onPress={() => startGame("hard")}
        >
          <ThemedText style={styles.modeButtonText}>Hard Mode</ThemedText>
          <ThemedText style={styles.modeDescription}>
            Includes deleted songs
          </ThemedText>
          <View style={styles.scoreContainer}>
            <ThemedText style={styles.scoreText}>
              High Score:{" "}
              {user ? serverScores.hard.highScore : localScores.hard.highScore}
            </ThemedText>
            <ThemedText style={styles.scoreText}>
              Current Streak:{" "}
              {user
                ? serverScores.hard.currentStreak
                : localScores.hard.currentStreak}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
