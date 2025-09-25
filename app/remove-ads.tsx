import { showInterstitial } from '@/components/InterstitialAdComponent';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAds } from '@/context/AdContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RemoveAdsScreen() {
  const { removeAdsTemporarily, removeAdsPermanently, restorePurchases } = useAds();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const watchLongAdForTemporaryRemoval = () => {
    setLoading(true);
    
    // Show a rewarded ad (we'll use interstitial for now)
    showInterstitial(async () => {
      await removeAdsTemporarily();
      setLoading(false);
      Alert.alert(
        "Ads Removed Temporarily",
        "Thanks for watching! Ads have been removed for 24 hours.",
        [{ text: "Great!", onPress: () => router.back() }]
      );
    });
  };

  const purchasePermanentAdRemoval = async () => {
    setLoading(true);
    
    // This would be replaced with actual in-app purchase logic
    Alert.alert(
      "In-App Purchase",
      "Would you like to remove ads permanently for HKD $30?",
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
          } 
        },
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => {
            setLoading(false);
          }
        }
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} />
        </TouchableOpacity>
        <ThemedText type="title">Remove Ads</ThemedText>
      </View>
      
      <ThemedView style={styles.content}>
        <ThemedView style={styles.optionCard}>
          <ThemedText type="subtitle">Watch Ad</ThemedText>
          <ThemedText style={styles.description}>
            Watch a video ad to remove all ads for 24 hours.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.button, styles.watchAdButton]} 
            onPress={watchLongAdForTemporaryRemoval}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>Watch Ad</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.optionCard}>
          <ThemedText type="subtitle">Remove Ads Forever</ThemedText>
          <ThemedText style={styles.description}>
            One-time payment of HKD $30 to permanently remove all ads.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.button, styles.purchaseButton]} 
            onPress={purchasePermanentAdRemoval}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>Purchase (HKD $30)</ThemedText>
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
  },
  watchAdButton: {
    backgroundColor: '#5C6BC0',
  },
  purchaseButton: {
    backgroundColor: '#9944DD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    padding: 12,
  },
  restoreText: {
    textDecorationLine: 'underline',
  },
}); 