import { AuthAPI, NotificationAPI } from "@/api/client";
import { BannerAdComponent } from "@/components/BannerAdComponent";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useAds } from "@/context/AdContext";
import { fetchDataImmediately } from "@/context/GameQueryProvider";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getFCMToken } from "@/utils/useFCMToken";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { getMessaging, onTokenRefresh } from "@react-native-firebase/messaging";
import { getApp } from "@react-native-firebase/app";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const showAdsSection = !adsRemoved; // Only hide for permanent removal
  const showActualAds = !adsRemoved && !temporaryAdRemoval;

  const dynamicStyles = {
    bottomAdContainer: {
      ...styles.bottomAdContainer,
      bottom: 49 + insets.bottom, // Standard tab bar height (49) + bottom inset
    },
  };

  const [socialFeedPreference, setSocialFeedPreference] = useState("facebook");
  const { t } = useLocalization();

  const loadPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(
        "socialFeedPreference"
      );
      if (savedPreference) {
        setSocialFeedPreference(savedPreference);
      }
    } catch (error) {
      console.error("Error loading social feed preference:", error);
    }
  };

  useEffect(() => {
    const preloadData = async () => {
      try {
        setIsDataLoading(true);
        // Check if user is logged in
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          // Preload crystal status and game scores if logged in
          await Promise.all([
            fetchDataImmediately("crystalStatus"),
            fetchDataImmediately("gameScores"),
            fetchDataImmediately("threeLifeDayPassStatus"),
          ]);
          console.log("Preloaded all game data");
        }
      } catch (error) {
        console.error("Error preloading data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    preloadData();
  }, []);

  // This will run both on initial mount AND whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPreference();

      const refreshData = async () => {
        try {
          const userData = await AsyncStorage.getItem("userData");
          if (userData) {
            // Load all data in parallel for better performance
            await Promise.all([
              fetchDataImmediately("crystalStatus"),
              fetchDataImmediately("gameScores"),
              fetchDataImmediately("threeLifeDayPassStatus"),
            ]);
            console.log("Refreshed all game data on home screen focus");
          }
        } catch (error) {
          console.error("Error refreshing data:", error);
        }
      };

      refreshData();

      return () => {}; // cleanup function
    }, [])
  );

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData);
    };

    checkLoginStatus();
  }, []);

  // Add this useEffect in your HomeScreen component
  useEffect(() => {
    const initializeFCM = async () => {
      const loggedIn = await AuthAPI.isLoggedIn();
      if (loggedIn) {
        const token = await getFCMToken();
        if (token) {
          await NotificationAPI.sendFCMToken(token);
        }

        // Listen for token refresh using modular API
        const app = getApp();
        const messaging = getMessaging(app);

        const unsubscribe = onTokenRefresh(messaging, async (newToken) => {
          const stillLoggedIn = await AuthAPI.isLoggedIn();
          if (stillLoggedIn) {
            await NotificationAPI.sendFCMToken(newToken);
          }
        });

        // Cleanup on unmount
        return () => unsubscribe();
      }
    };

    initializeFCM();
  }, []);

  return (
    <View style={styles.container}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
        headerImage={
          <Image
            source={require("@/assets/images/milk.png")}
            style={styles.reactLogo}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <Image
            source={require("@/assets/images/maipocket-logo.png")}
            style={styles.titleLogo}
          />
        </ThemedView>

        <TouchableOpacity
          style={{ ...styles.featureContainer, backgroundColor: "#696FC7" }}
          onPress={() => router.push("/charts")}
        >
          <View style={styles.featureTitleContainer}>
            <ThemedText
              type="subtitle"
              style={{ color: "white", marginTop: 8 }}
            >
              {t("browseSongCharts")}
            </ThemedText>
            <Ionicons name="musical-note-outline" size={48} color="white" />
          </View>
          <View style={styles.featureDescription}>
            <ThemedText style={{ color: "white" }}>
              {t("exploreSongs")}
            </ThemedText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.featureContainer, backgroundColor: "#FF9500" }}
          onPress={() => router.push("/timeline")}
        >
          <View style={styles.featureTitleContainer}>
            <ThemedText
              type="subtitle"
              style={{ color: "white", marginTop: 8 }}
            >
              {t("timeline")}
            </ThemedText>
            <Ionicons name="time-outline" size={48} color="white" />
          </View>
          <View style={styles.featureDescription}>
            <ThemedText style={{ color: "white" }}>
              {t("viewNewReleases")}
            </ThemedText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.featureContainer, backgroundColor: "#4CAF50" }}
          onPress={() => router.push("/game")}
          disabled={isLoggedIn && isDataLoading}
        >
          <View style={styles.featureTitleContainer}>
            <ThemedText
              type="subtitle"
              style={{ color: "white", marginTop: 8 }}
            >
              {t("songQuizGame")}
            </ThemedText>

            <Ionicons name="game-controller-outline" size={48} color="white" />
          </View>
          <View style={styles.featureDescription}>
            {isLoggedIn && isDataLoading && (
              <ActivityIndicator size="small" color="white" />
            )}
            <ThemedText style={{ color: "white" }}>
              {isLoggedIn && isDataLoading
                ? // ? "Loading..."
                  t("loading")
                : t("testKnowledge")}
            </ThemedText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.featureContainer, backgroundColor: "#F75270" }}
          onPress={() => router.push("/profile")}
        >
          <View style={styles.featureTitleContainer}>
            <ThemedText
              type="subtitle"
              style={{ color: "white", marginTop: 8 }}
            >
              {t("yourProfile")}
            </ThemedText>
            <Ionicons name="person-outline" size={48} color="white" />
          </View>
          <View style={styles.featureDescription}>
            <ThemedText style={{ color: "white" }}>
              {t("manageAccount")}
            </ThemedText>
          </View>
        </TouchableOpacity>
        
        {(isLoggedIn || !adsRemoved) && (
          <TouchableOpacity
            style={{ ...styles.featureContainer, backgroundColor: "#AA60C8" }}
            onPress={() => router.push("/shop")}
            disabled={isLoggedIn && isDataLoading}
          >
            <View style={styles.featureTitleContainer}>
              <ThemedText
                type="subtitle"
                style={{ color: "white", marginTop: 8 }}
              >
                {t("shop")}
              </ThemedText>

              <Ionicons name="bag-outline" size={48} color="white" />
            </View>
            <View style={styles.featureDescription}>
              {isLoggedIn && isDataLoading && (
                <ActivityIndicator size="small" color="white" />
              )}
              <ThemedText style={{ color: "white" }}>
                {isLoggedIn && isDataLoading
                  ? t("loading")
                  : t("unlockFeatures")}
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}
        {socialFeedPreference !== "off" && (
          <ThemedView
            style={{ ...styles.featureContainer, paddingHorizontal: 0 }}
          >
            <ThemedText type="subtitle">{t("recentUpdates")}</ThemedText>
            <ThemedText>{t("stayUpdated")}</ThemedText>
            <View style={{ ...styles.socialFeedContainer }}>
              {socialFeedPreference === "twitter" ? (
                <WebView
                  source={{
                    uri: "https://x.com/maimai_official",
                  }}
                  style={styles.socialFeedWebView}
                  userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error("WebView error:", nativeEvent);
                  }}
                />
              ) : (
                <WebView
                  source={{ uri: "https://www.facebook.com/maimaiDX" }}
                  style={styles.socialFeedWebView}
                  userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error("WebView error:", nativeEvent);
                  }}
                />
              )}
            </View>
          </ThemedView>
        )}
        <ThemedView style={styles.copyrightContainer}>
          <TouchableOpacity
            style={[
              styles.copyrightButton,
              {
                backgroundColor: Colors[colorScheme ?? "light"].background,
                borderColor: "#9944DD",
              },
            ]}
            onPress={() => router.push("/copyright")}
          >
            <ThemedText style={styles.copyrightButtonText}>
              {t("copyrightNotice")}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ParallaxScrollView>
      {/* Bottom ad - above tab bar, only if ads aren't removed */}
      {showActualAds && (
        <View style={dynamicStyles.bottomAdContainer}>
          <BannerAdComponent />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  featureContainer: {
    gap: 8,
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureDescription: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 2,
    borderRadius: 8,
    opacity: 80,
    gap: 8,
  },
  featureTitleContainer: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  reactLogo: {
    height: 250,
    width: 290,
    bottom: 0,
    right: 0,
    position: "absolute",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  titleLogo: {
    height: 45,
    width: 200,
  },
  copyrightContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  copyrightButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  copyrightButtonText: {
    fontSize: 12,
  },
  bottomAdContainer: {
    position: "absolute",
    bottom: 80, // Adjust this value based on your tab bar height
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
  },
  socialFeedContainer: {
    height: 600,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
  },
  socialFeedWebView: {
    width: "100%",
    height: "100%",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
});
