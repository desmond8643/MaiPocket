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