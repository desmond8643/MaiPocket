// import { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';
// import { SHOW_ADS } from '@/constants/adsConfig';
// // Define a type for the preloaded ad
// interface PreloadedAd {
//   ad: InterstitialAd;
//   unsubscribe: () => void;
// }

// // Keep track of a preloaded ad
// let preloadedAd: PreloadedAd | null = null;
// let isLoading = false;
// let lastAdShownTime = 0;
// const AD_COOLDOWN = 60000; // 1 minute cooldown

// // Preload an ad so it's ready when needed
// export function preloadInterstitialAd() {
//   if (preloadedAd || isLoading) return;
  
//   console.log("Preloading interstitial ad");
//   isLoading = true;
  
//   const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);
  
//   const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
//     console.log("Interstitial ad preloaded successfully");
//     preloadedAd = {
//       ad: interstitialAd,
//       unsubscribe: () => {
//         unsubscribeLoaded();
//         unsubscribeError();
//       }
//     };
//     isLoading = false;
//   });
  
//   const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
//     console.error("Error preloading ad:", error);
//     isLoading = false;
//     // Clean up on error
//     unsubscribeLoaded();
//     unsubscribeError();
//   });
  
//   interstitialAd.load();
// }

// // Show a preloaded ad or directly navigate if not available
// export function showInterstitialAd(onClose = () => {}) {
//   const now = Date.now();
  
//   // Skip if we showed an ad recently (cooldown)
//   if (now - lastAdShownTime < AD_COOLDOWN) {
//     console.log("Ad skipped due to cooldown period");
//     onClose();
//     preloadInterstitialAd(); // Preload for next time
//     return;
//   }
  
//   // If we have a preloaded ad ready
//   if (preloadedAd) {
//     console.log("Showing preloaded interstitial ad");
    
//     const unsubscribeClosed = preloadedAd.ad.addAdEventListener(AdEventType.CLOSED, () => {
//       console.log("Preloaded ad closed");
//       lastAdShownTime = Date.now();
//       unsubscribeClosed();
//       onClose();
//       preloadedAd = null;
//       // Preload next ad immediately
//       preloadInterstitialAd();
//     });
    
//     preloadedAd.ad.show();
//     preloadedAd.unsubscribe();
//   } else {
//     // No preloaded ad available, just continue and try to preload for next time
//     console.log("No preloaded ad available, continuing without showing ad");
//     onClose();
//     preloadInterstitialAd();
//   }
// }

// // Keep original function for compatibility
// export function showInterstitial(onClose = () => {}) {
//   const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);
  
//   const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
//     interstitialAd.show();
//   });
  
//   const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
//     onClose();
//   });
  
//   const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
//     onClose();
//   });
  
//   interstitialAd.load();
  
//   return () => {
//     unsubscribeLoaded();
//     unsubscribeClosed();
//     unsubscribeError();
//   };
// }

// import { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';
// import { SHOW_ADS } from '@/constants/adsConfig';

// // Define a type for the preloaded ad
// interface PreloadedAd {
//   ad: InterstitialAd;
//   unsubscribe: () => void;
// }

// // Keep track of a preloaded ad
// let preloadedAd: PreloadedAd | null = null;
// let isLoading = false;
// let lastAdShownTime = 0;
// const AD_COOLDOWN = 60000; // 1 minute cooldown

// // Preload an ad so it's ready when needed
// export function preloadInterstitialAd() {
//   // Skip all ad operations if ads are disabled
//   if (!SHOW_ADS) return;
  
//   if (preloadedAd || isLoading) return;
  
//   console.log("Preloading interstitial ad");
//   isLoading = true;
  
//   const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);
  
//   const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
//     console.log("Interstitial ad preloaded successfully");
//     preloadedAd = {
//       ad: interstitialAd,
//       unsubscribe: () => {
//         unsubscribeLoaded();
//         unsubscribeError();
//       }
//     };
//     isLoading = false;
//   });
  
//   const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
//     console.error("Error preloading ad:", error);
//     isLoading = false;
//     // Clean up on error
//     unsubscribeLoaded();
//     unsubscribeError();
//   });
  
//   interstitialAd.load();
// }

// // Show a preloaded ad or directly navigate if not available
// export function showInterstitialAd(onClose = () => {}) {
//   // Skip ads and just call onClose if ads are disabled
//   if (!SHOW_ADS) {
//     onClose();
//     return;
//   }

//   const now = Date.now();
  
//   // Skip if we showed an ad recently (cooldown)
//   if (now - lastAdShownTime < AD_COOLDOWN) {
//     console.log("Ad skipped due to cooldown period");
//     onClose();
//     preloadInterstitialAd(); // Preload for next time
//     return;
//   }
  
//   // If we have a preloaded ad ready
//   if (preloadedAd) {
//     console.log("Showing preloaded interstitial ad");
    
//     const unsubscribeClosed = preloadedAd.ad.addAdEventListener(AdEventType.CLOSED, () => {
//       console.log("Preloaded ad closed");
//       lastAdShownTime = Date.now();
//       unsubscribeClosed();
//       onClose();
//       preloadedAd = null;
//       // Preload next ad immediately
//       preloadInterstitialAd();
//     });
    
//     preloadedAd.ad.show();
//     preloadedAd.unsubscribe();
//   } else {
//     // No preloaded ad available, just continue and try to preload for next time
//     console.log("No preloaded ad available, continuing without showing ad");
//     onClose();
//     preloadInterstitialAd();
//   }
// }

// // Keep original function for compatibility
// export function showInterstitial(onClose = () => {}) {
//   // Skip ads and just call onClose if ads are disabled
//   if (!SHOW_ADS) {
//     onClose();
//     return () => {};
//   }

//   const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);
  
//   const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
//     interstitialAd.show();
//   });
  
//   const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
//     onClose();
//   });
  
//   const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
//     onClose();
//   });
  
//   interstitialAd.load();
  
//   return () => {
//     unsubscribeLoaded();
//     unsubscribeClosed();
//     unsubscribeError();
//   };
// }

// InterstitialAdComponent.tsx
import { SHOW_ADS, mockAdComponents } from '@/constants/adsConfig';

// Keep track of a preloaded ad for native implementation
let isPreloadingReal = false;

// Wrapper for preloading interstitial ads
export function preloadInterstitialAd() {
  if (!SHOW_ADS) {
    return mockAdComponents.preloadInterstitialAd();
  }

  // Avoid multiple preload attempts
  if (isPreloadingReal) return;
  isPreloadingReal = true;

  // Dynamically import the real implementation
  import('./InterstitialAdImpl')
    .then(module => {
      module.preloadInterstitialAdImpl();
      isPreloadingReal = false;
    })
    .catch(error => {
      console.error('Error loading interstitial ad implementation:', error);
      isPreloadingReal = false;
      // No need for fallback as preload just prepares the ad
    });
}

// Wrapper for showing interstitial ads
export function showInterstitialAd(onClose = () => {}) {
  if (!SHOW_ADS) {
    return mockAdComponents.showInterstitialAd(onClose);
  }
  
  // Dynamically import the real implementation
  import('./InterstitialAdImpl')
    .then(module => module.showInterstitialAdImpl(onClose))
    .catch(error => {
      console.error('Error loading interstitial ad implementation:', error);
      // Fallback to mock if import fails
      mockAdComponents.showInterstitialAd(onClose);
    });
}

// For backward compatibility
export function showInterstitial(onClose = () => {}) {
  if (!SHOW_ADS) {
    onClose();
    return () => {};
  }

  // Dynamically import the real implementation
  return import('./InterstitialAdImpl')
    .then(module => module.showInterstitialImpl(onClose))
    .catch(error => {
      console.error('Error loading interstitial ad implementation:', error);
      // Fallback to just calling onClose if import fails
      onClose();
      return () => {};
    });
}