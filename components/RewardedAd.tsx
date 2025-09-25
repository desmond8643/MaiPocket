import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

export function showRewardedAd(onRewarded = (reward?: any) => {}, onClose = () => {}) {
  const rewardedAd = RewardedAd.createForAdRequest(TestIds.REWARDED);
  
  // Use RewardedAdEventType.LOADED instead of AdEventType.LOADED
  const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedAd.show();
  });
  
  const unsubscribeEarnedReward = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
    onRewarded(reward);
  });
  
  const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    onClose();
  });
  
  // Load the ad
  rewardedAd.load();
  
  // Return unsubscribe function
  return () => {
    unsubscribeLoaded();
    unsubscribeEarnedReward();
    unsubscribeClosed();
  };
}