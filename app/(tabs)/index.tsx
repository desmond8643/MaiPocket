import { BannerAdComponent } from "@/components/BannerAdComponent";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAds } from "@/context/AdContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { adsRemoved, temporaryAdRemoval } = useAds();

  const showAds = !adsRemoved && !temporaryAdRemoval;

  const dynamicStyles = {
    bottomAdContainer: {
      ...styles.bottomAdContainer,
      bottom: 49 + insets.bottom, // Standard tab bar height (49) + bottom inset
    },
  };

  const [socialFeedPreference, setSocialFeedPreference] = useState("facebook");

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

  // This will run both on initial mount AND whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPreference();
      return () => {}; // cleanup function
    }, [])
  );

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

        <ThemedView style={styles.featureContainer}>
          <ThemedText type="subtitle">Browse Song Charts</ThemedText>
          <ThemedText>
            Explore maimai songs by genre, level, or version. Find your favorite
            tracks and check their difficulties.
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: "#9944DD",
              },
            ]}
            onPress={() => router.push("/charts")}
          >
            <ThemedText style={styles.buttonText}>Browse Charts</ThemedText>
            <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.featureContainer}>
          <ThemedText type="subtitle">Your Profile</ThemedText>
          <ThemedText>
            Manage your account, track your favorite songs, and customize your
            experience.
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: "#9944DD",
              },
            ]}
            onPress={() => router.push("/profile")}
          >
            <ThemedText style={styles.buttonText}>View Profile</ThemedText>
            <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </ThemedView>

        {socialFeedPreference !== "off" && (
          <ThemedView style={styles.featureContainer}>
            <ThemedText type="subtitle">Recent Updates</ThemedText>
            <ThemedText>
              Stay updated with the latest maimai news and announcements.
            </ThemedText>
            <View style={styles.socialFeedContainer}>
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
                // Keep the Facebook implementation as before
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
        {showAds && (
          <ThemedView style={styles.featureContainer}>
            <ThemedText type="subtitle">Remove Ads</ThemedText>
            <ThemedText>
              Enjoy an ad-free experience by watching a video or making a
              one-time purchase.
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: "#9944DD",
                },
              ]}
              onPress={() => router.push("/remove-ads")}
            >
              <ThemedText style={styles.buttonText}>Remove Ads</ThemedText>
              <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </ThemedView>
        )}

        <ThemedView style={styles.copyrightContainer}>
          <TouchableOpacity
            style={[
              styles.copyrightButton,
              {
                backgroundColor: Colors[colorScheme ?? "light"].background,
                borderColor: "##9944DD",
              },
            ]}
            onPress={() => router.push("/copyright")}
          >
            <ThemedText style={styles.copyrightButtonText}>
              Copyright Notice
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ParallaxScrollView>
      {/* Bottom ad - above tab bar, only if ads aren't removed */}
      {showAds && (
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
    borderRadius: 12,
    borderWidth: 0,
    elevation: 0,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 4,
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
  topAdContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
  },
  bottomAdContainer: {
    position: "absolute",
    bottom: 80, // Adjust this value based on your tab bar height
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
  },
  testAdContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
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
  settingsIconContainer: {
    padding: 8,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  loadingText: {
    marginTop: 10,
  },
});
