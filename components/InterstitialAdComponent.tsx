import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads";

// Define ad unit IDs
const adUnitId = TestIds.INTERSTITIAL;

// Basic interstitial ad function
export function showInterstitial(onClose = () => {}) {
  const interstitialAd = InterstitialAd.createForAdRequest(adUnitId);

  // Add event handlers
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
    (error) => {
      console.error("Interstitial ad error:", error);
      onClose(); // Call onClose even if there was an error
    }
  );

  // Load the ad
  interstitialAd.load();

  // Return unsubscribe function to clean up listeners
  return () => {
    unsubscribeLoaded();
    unsubscribeClosed();
    unsubscribeError();
  };
}

// Ad with cooldown (to avoid showing ads too frequently)
let lastAdShownTime = 0;
const AD_COOLDOWN = 60000; // 1 minute cooldown

export function showInterstitialWithCooldown(onClose = () => {}) {
  const now = Date.now();

  if (now - lastAdShownTime < AD_COOLDOWN) {
    // Skip ad if within cooldown period
    onClose();
    return () => {};
  }

  return showInterstitial(() => {
    lastAdShownTime = Date.now();
    onClose();
  });
}
