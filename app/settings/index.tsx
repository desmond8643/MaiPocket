import { showRewardedAdImpl } from "@/components/RewardedAdImpl";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Key for storing the ad watch count data
const AD_WATCH_COUNT_KEY = "ad_watch_count";

export default function SettingsScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [adWatchCount, setAdWatchCount] = useState(0);
  const [resetTime, setResetTime] = useState<number | null>(null);
  const { t } = useLocalization();

  // Calculate the next 4 AM GMT+8 time
  const getNextResetTime = () => {
    const now = new Date();

    // Convert to GMT+8
    const gmt8Now = new Date(
      now.getTime() + (now.getTimezoneOffset() + 480) * 60000
    );

    // Set target time to 4 AM GMT+8
    let targetDate = new Date(gmt8Now);
    targetDate.setHours(4, 0, 0, 0);

    // If it's already past 4 AM GMT+8, set target to next day 4 AM
    if (gmt8Now.getHours() >= 4) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    // Convert back to local time for storage
    return targetDate.getTime() - (now.getTimezoneOffset() + 480) * 60000;
  };

  // Load the ad watch count data from AsyncStorage
  const loadAdWatchData = async () => {
    try {
      const data = await AsyncStorage.getItem(AD_WATCH_COUNT_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        const currentTime = Date.now();

        if (parsedData.resetTime && parsedData.resetTime > currentTime) {
          // Reset time hasn't passed yet, use the stored count
          setAdWatchCount(parsedData.count);
          setResetTime(parsedData.resetTime);
        } else {
          // Reset time has passed, reset the count and set new reset time
          const nextResetTime = getNextResetTime();
          setAdWatchCount(0);
          setResetTime(nextResetTime);

          // Save the updated values
          await AsyncStorage.setItem(
            AD_WATCH_COUNT_KEY,
            JSON.stringify({
              count: 0,
              resetTime: nextResetTime,
            })
          );
        }
      } else {
        // First time, initialize count and reset time
        const nextResetTime = getNextResetTime();
        setAdWatchCount(0);
        setResetTime(nextResetTime);

        await AsyncStorage.setItem(
          AD_WATCH_COUNT_KEY,
          JSON.stringify({
            count: 0,
            resetTime: nextResetTime,
          })
        );
      }
    } catch (error) {
      console.error("Failed to load ad watch count data:", error);
    }
  };

  // Increment the ad watch count
  const incrementAdWatchCount = async () => {
    try {
      const newCount = adWatchCount + 1;
      setAdWatchCount(newCount);

      await AsyncStorage.setItem(
        AD_WATCH_COUNT_KEY,
        JSON.stringify({
          count: newCount,
          resetTime,
        })
      );

      return newCount;
    } catch (error) {
      console.error("Failed to increment ad watch count:", error);
      return adWatchCount;
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parseUserData = JSON.parse(userData);
          setIsLoggedIn(true);
          setUserId(parseUserData._id);
        } else {
          setIsLoggedIn(false);
          setUserId("");
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoginStatus();
    loadAdWatchData(); // Load the ad watch count data
  }, []);

  const handleShowRewardAd = () => {
    const unsubscribe = showRewardedAdImpl(
      async (reward) => {
        // Increment ad watch count when reward is earned
        await incrementAdWatchCount();
        // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate(300);
        Alert.alert(
          "Success",
          `Rewarded ad watched! Count: ${adWatchCount + 1}`
        );
      },
      () => {
        console.log("Ad closed");
      }
    );
  };

  // Format remaining time until reset
  const formatRemainingTime = () => {
    if (!resetTime) return "N/A";

    const now = Date.now();
    const diff = resetTime - now;

    if (diff <= 0) return "Resetting soon";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m until reset`;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#AE75DA"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("settings")}</ThemedText>
        </View>

        <View style={styles.content}>
          <View style={styles.optionsContainer}>
            {/* Ad Watch Count Display */}
            {isLoggedIn && userId === "68c9565dad96c1064ad9f2f0" && (
              <ThemedView style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <Ionicons name="eye-outline" size={24} color="#AE75DA" />
                  <ThemedText style={styles.statsLabel}>
                    {t("rewardedAdsWatched")}
                  </ThemedText>
                  <ThemedText style={styles.statsValue}>
                    {adWatchCount}
                  </ThemedText>
                </View>
                <ThemedText style={styles.statsSubtext}>
                  {t("resetsAtTime", { time: "4:00 AM (GMT+8)" })} •{" "}
                  {formatRemainingTime()}
                </ThemedText>
              </ThemedView>
            )}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => router.push("/settings/social-preferences")}
            >
              <Ionicons name="share-social-outline" size={24} color="#AE75DA" />
              <ThemedText style={styles.optionText}>
                {t("socialPreferences")}
              </ThemedText>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={styles.optionItem}
              onPress={() => router.push("/settings/sensor")}
            >
              <Ionicons name="radio-outline" size={24} color="#AE75DA" />
              <ThemedText style={styles.optionText}>{t("sensor")}</ThemedText>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => router.push("/settings/language")}
            >
              <Ionicons name="language" size={24} color="#AE75DA" />
              <ThemedText style={styles.optionText}>
                {t("appLanguage")}
              </ThemedText>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
            {isLoggedIn && (
              <>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => router.push("/settings/blocked-user")}
                >
                  <Ionicons name="person-remove" size={24} color="#AE75DA" />
                  <ThemedText style={styles.optionText}>
                    {t("blockedUsers")}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>
                {userId === "68c9565dad96c1064ad9f2f0" && (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={handleShowRewardAd}
                  >
                    <Ionicons name="gift-outline" size={24} color="#AE75DA" />
                    <ThemedText style={styles.optionText}>
                      {t("watchRewardAd")}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.dangerOptionItem}
                  onPress={() => router.push("/settings/delete-account")}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                  <ThemedText style={styles.dangerOptionText}>
                    {t("deleteAccount")}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
  },
  dangerOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  dangerOptionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: "#FF6B6B",
  },
  // New styles for stats display
  statsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(174, 117, 218, 0.3)",
    backgroundColor: "rgba(174, 117, 218, 0.05)",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#AE75DA",
  },
  statsSubtext: {
    fontSize: 12,
    marginLeft: 36, // Aligns with text after icon
    opacity: 0.7,
  },
});
