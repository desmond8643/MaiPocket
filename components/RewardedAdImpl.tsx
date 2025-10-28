import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { Platform } from "react-native";

const adUnitId = Platform.select({
  ios: "ca-app-pub-7106153117550777/4794554924", // Replace with your iOS interstitial ad unit ID
  default: "", // Fallback to test ID
});
export function showRewardedAdImpl(
  onRewarded = (reward?: any) => {},
  onClose = () => {}
) {
  const rewardedAd = RewardedAd.createForAdRequest(adUnitId);

  const unsubscribeLoaded = rewardedAd.addAdEventListener(
    RewardedAdEventType.LOADED,
    () => {
      rewardedAd.show();
    }
  );

  const unsubscribeEarnedReward = rewardedAd.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    (reward) => {
      onRewarded(reward);
    }
  );

  const unsubscribeClosed = rewardedAd.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      onClose();
    }
  );

  rewardedAd.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeEarnedReward();
    unsubscribeClosed();
  };
}
