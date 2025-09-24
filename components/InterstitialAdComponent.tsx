import {
    AdEventType,
    InterstitialAd,
    TestIds,
} from "react-native-google-mobile-ads";

// Define ad unit IDs
const adUnitId = TestIds.INTERSTITIAL;

// Basic interstitial ad function
export function showInterstitial(onClose = () => {}) {
  const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);
  let hasAdClosed = false;
  
  // Add loading timeout
  const timeoutId = setTimeout(() => {
    if (!hasAdClosed) {
      console.log('Ad loading timed out');
      onClose();
    }
  }, 10000); // 10 second timeout
  
  const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
    console.log('Interstitial ad loaded and ready to show');
    interstitialAd.show();
  });
  
  const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
    console.log('Ad closed');
    hasAdClosed = true;
    clearTimeout(timeoutId);
    onClose();
  });
  
  const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
    console.error('Ad error:', error);
    hasAdClosed = true;
    clearTimeout(timeoutId);
    onClose();
  });
  
  console.log('Starting to load interstitial ad');
  interstitialAd.load();
  
  return () => {
    clearTimeout(timeoutId);
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
