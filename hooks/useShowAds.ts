import { useAds } from '@/context/AdContext';
import { SHOW_ADS } from '@/constants/adsConfig';

export function useShowAds(_isInTabBar: boolean = false) {
  const { adsRemoved, temporaryAdRemoval } = useAds();

  const showAds = SHOW_ADS && !adsRemoved && !temporaryAdRemoval;

  return {
    showAds,
  };
}
