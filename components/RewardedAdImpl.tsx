import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

export function showRewardedAdImpl(onRewarded = (reward?: any) => {}, onClose = () => {}) {
  const rewardedAd = RewardedAd.createForAdRequest(TestIds.REWARDED);
  
  const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedAd.show();
  });
  
  const unsubscribeEarnedReward = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
    onRewarded(reward);
  });
  
  const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    onClose();
  });
  
  rewardedAd.load();
  
  return () => {
    unsubscribeLoaded();
    unsubscribeEarnedReward();
    unsubscribeClosed();
  };
}