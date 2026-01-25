// InterstitialAdImpl.tsx
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads";
import { Platform } from "react-native";

// Define a type for the preloaded ad
interface PreloadedAd {
  ad: InterstitialAd;
  unsubscribe: () => void;
}

// Keep track of a preloaded ad
let preloadedAd: PreloadedAd | null = null;
let isLoading = false;
let lastAdShownTime = 0;
let actionCount = 0;

// Ad frequency settings
const AD_COOLDOWN = 180000; // 3 minute cooldown between ads
const ACTIONS_BETWEEN_ADS = 4; // Require at least 4 actions between ads

const adUnitId = Platform.select({
  ios: "ca-app-pub-7106153117550777/6330997877", // Replace with your iOS interstitial ad unit ID
  default: "", // Fallback to test ID
});

// Actual implementation of preload
export function preloadInterstitialAdImpl() {
  if (preloadedAd || isLoading) return;

  console.log("Preloading interstitial ad");
  isLoading = true;

  const interstitialAd = InterstitialAd.createForAdRequest(adUnitId);

  const unsubscribeLoaded = interstitialAd.addAdEventListener(
    AdEventType.LOADED,
    () => {
      console.log("Interstitial ad preloaded successfully");
      preloadedAd = {
        ad: interstitialAd,
        unsubscribe: () => {
          unsubscribeLoaded();
          unsubscribeError();
        },
      };
      isLoading = false;
    }
  );

  const unsubscribeError = interstitialAd.addAdEventListener(
    AdEventType.ERROR,
    (error) => {
      console.error("Error preloading ad:", error);
      isLoading = false;
      // Clean up on error
      unsubscribeLoaded();
      unsubscribeError();
    }
  );

  interstitialAd.load();
}

// Actual implementation of showing the ad
export function showInterstitialAdImpl(onClose = () => {}) {
  const now = Date.now();
  actionCount++;

  // Skip if we showed an ad recently (cooldown) or not enough actions yet
  if (now - lastAdShownTime < AD_COOLDOWN || actionCount < ACTIONS_BETWEEN_ADS) {
    console.log(`Ad skipped (cooldown: ${now - lastAdShownTime < AD_COOLDOWN}, actions: ${actionCount}/${ACTIONS_BETWEEN_ADS})`);
    onClose();
    preloadInterstitialAdImpl(); // Preload for next time
    return;
  }

  // Reset action counter when showing ad
  actionCount = 0;

  // If we have a preloaded ad ready
  if (preloadedAd) {
    console.log("Showing preloaded interstitial ad");

    const unsubscribeClosed = preloadedAd.ad.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log("Preloaded ad closed");
        lastAdShownTime = Date.now();
        unsubscribeClosed();
        onClose();
        preloadedAd = null;
        // Preload next ad immediately
        preloadInterstitialAdImpl();
      }
    );

    preloadedAd.ad.show();
    preloadedAd.unsubscribe();
  } else {
    // No preloaded ad available, just continue and try to preload for next time
    console.log("No preloaded ad available, continuing without showing ad");
    onClose();
    preloadInterstitialAdImpl();
  }
}

// Original function for compatibility
export function showInterstitialImpl(onClose = () => {}) {
  const interstitialAd = InterstitialAd.createForAdRequest(
    TestIds.INTERSTITIAL
  );

  const unsubscribeLoaded = interstitialAd.addAdEventListener(
    AdEventType.LOADED,
    () => {
      interstitialAd.show();
    }
  );

  const unsubscribeClosed = interstitialAd.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      onClose();
    }
  );

  const unsubscribeError = interstitialAd.addAdEventListener(
    AdEventType.ERROR,
    () => {
      onClose();
    }
  );

  interstitialAd.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeClosed();
    unsubscribeError();
  };
}
