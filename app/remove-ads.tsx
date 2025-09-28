import { showRewardedAd } from "@/components/RewardedAd";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAds } from "@/context/AdContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RemoveAdsScreen() {
  const { removeAdsTemporarily, removeAdsPermanently, restorePurchases, temporaryAdRemoval, temporaryAdRemovalEndTime } = useAds();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  
  // Use the temporaryAdRemovalEndTime from context directly
  useEffect(() => {
    if (!temporaryAdRemoval || !temporaryAdRemovalEndTime) {
      setRemainingTime("");
      return;
    }
    
    const calculateRemainingTime = () => {
      const now = Date.now();
      const diff = temporaryAdRemovalEndTime - now;
      
      if (diff <= 0) {
        setRemainingTime("Expired");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setRemainingTime(`${hours}h ${minutes}m`);
    };
    
    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 60000);
    
    return () => clearInterval(interval);
  }, [temporaryAdRemoval, temporaryAdRemovalEndTime]);

  const watchLongAdForTemporaryRemoval = () => {
    setLoading(true);

    // Use rewarded ad instead of interstitial
    showRewardedAd(
      async () => {
        await removeAdsTemporarily();
        setLoading(false);
        Alert.alert(
          "Ads Removed Temporarily",
          "Thanks for watching! Ads have been removed for 24 hours.",
          [{ text: "Great!", onPress: () => router.back() }]
        );
      },
      () => {
        setLoading(false);
      }
    );
  };

  const purchasePermanentAdRemoval = async () => {
    setLoading(true);

    // This would be replaced with actual in-app purchase logic
    Alert.alert(
      "In-App Purchase",
      "Would you like to remove ads permanently for HKD $28?",
      [
        {
          text: "Yes",
          onPress: async () => {
            // This is where you'd implement the actual IAP
            // For now, just simulate a successful purchase
            await removeAdsPermanently();
            setLoading(false);
            Alert.alert(
              "Purchase Successful",
              "Thank you for your purchase! Ads have been permanently removed.",
              [{ text: "Great!", onPress: () => router.back() }]
            );
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleRestorePurchase = async () => {
    setLoading(true);
    const restored = await restorePurchases();
    setLoading(false);

    if (restored) {
      Alert.alert(
        "Purchase Restored",
        "Your ad-free experience has been restored!",
        [{ text: "Great!", onPress: () => router.back() }]
      );
    } else {
      Alert.alert(
        "No Purchase Found",
        "We couldn't find any previous purchase to restore.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          {/* <IconSymbol name="chevron.left" size={24} /> */}
          <Ionicons name="arrow-back" size={24} color="#AE75DA" />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
          Remove Ads
        </ThemedText>
      </View>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.optionCard}>
          <ThemedText type="subtitle">Watch Ad</ThemedText>
          <ThemedText style={styles.description}>
            {temporaryAdRemoval 
              ? `Ads are currently removed. Time remaining: ${remainingTime}`
              : "Watch a video ad to remove all ads for 24 hours."}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.watchAdButton,
              temporaryAdRemoval && styles.disabledButton
            ]}
            onPress={watchLongAdForTemporaryRemoval}
            disabled={loading || temporaryAdRemoval}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {temporaryAdRemoval ? "Active" : "Watch Ad"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.optionCard}>
          <ThemedText type="subtitle">Remove Ads Forever</ThemedText>
          <ThemedText style={styles.description}>
            One-time payment of HKD $28 to permanently remove all ads.
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, styles.purchaseButton]}
            onPress={purchasePermanentAdRemoval}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>
                Purchase (HKD $28)
              </ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <ThemedText style={styles.restoreText}>Restore Purchase</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>
    </View>
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
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 24,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  description: {
    marginBottom: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  watchAdButton: {
    backgroundColor: "#5C6BC0",
  },
  purchaseButton: {
    backgroundColor: "#9944DD",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  restoreButton: {
    alignItems: "center",
    padding: 12,
  },
  restoreText: {
    textDecorationLine: "underline",
  },
  disabledButton: {
    backgroundColor: "#8a8a8a",
    opacity: 0.7,
  },
});