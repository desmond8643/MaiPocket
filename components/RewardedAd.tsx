// import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

// export function showRewardedAd(onRewarded = (reward?: any) => {}, onClose = () => {}) {
//   const rewardedAd = RewardedAd.createForAdRequest(TestIds.REWARDED);
  
//   // Use RewardedAdEventType.LOADED instead of AdEventType.LOADED
//   const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
//     rewardedAd.show();
//   });
  
//   const unsubscribeEarnedReward = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
//     onRewarded(reward);
//   });
  
//   const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
//     onClose();
//   });
  
//   // Load the ad
//   rewardedAd.load();
  
//   // Return unsubscribe function
//   return () => {
//     unsubscribeLoaded();
//     unsubscribeEarnedReward();
//     unsubscribeClosed();
//   };
// }
// import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
// import { SHOW_ADS } from '@/constants/adsConfig';

// export function showRewardedAd(onRewarded = (reward?: any) => {}, onClose = () => {}) {
//   // Skip all ad operations if ads are disabled
//   if (!SHOW_ADS) {
//     // When ads are disabled, immediately call onRewarded with a default reward
//     // This ensures the user still gets the reward during testing
//     onRewarded({ amount: 1, type: 'testing_reward' });
//     onClose();
//     return () => {};
//   }

//   const rewardedAd = RewardedAd.createForAdRequest(TestIds.REWARDED);
  
//   // Use RewardedAdEventType.LOADED instead of AdEventType.LOADED
//   const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
//     rewardedAd.show();
//   });
  
//   const unsubscribeEarnedReward = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
//     onRewarded(reward);
//   });
  
//   const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
//     onClose();
//   });
  
//   // Load the ad
//   rewardedAd.load();
  
//   // Return unsubscribe function
//   return () => {
//     unsubscribeLoaded();
//     unsubscribeEarnedReward();
//     unsubscribeClosed();
//   };
// }
import { SHOW_ADS, mockAdComponents } from '@/constants/adsConfig';

// Export the mock implementation for Expo Go
export function showRewardedAd(onRewarded = (reward?: any) => {}, onClose = () => {}) {
  if (!SHOW_ADS) {
    return mockAdComponents.showRewardedAd(onRewarded, onClose);
  }
  
  // Dynamically import the real implementation only when needed
  return import('./RewardedAdImpl')
    .then(module => module.showRewardedAdImpl(onRewarded, onClose))
    .catch(error => {
      console.error('Error loading rewarded ad implementation:', error);
      // Fallback to mock if import fails
      return mockAdComponents.showRewardedAd(onRewarded, onClose);
    });
}