import Constants from "expo-constants";

// Detect if we're running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

export const SHOW_ADS = !isExpoGo; // Auto-disable for Expo Go
// export const SHOW_ADS = true

// Mock ad components and functions to use when in Expo Go
export const mockAdComponents = {
  // For testing with no ads
  showRewardedAd: (onRewarded = (reward?: any) => {}, onClose = () => {}) => {
    console.log("Mock rewarded ad would show here");
    onRewarded({ amount: 1, type: "testing_reward" });
    onClose();
    return () => {};
  },

  showInterstitialAd: (onClose = () => {}) => {
    console.log("Mock interstitial ad would show here");
    onClose();
  },

  preloadInterstitialAd: () => {
    console.log("Mock interstitial ad would preload here");
  },
};
