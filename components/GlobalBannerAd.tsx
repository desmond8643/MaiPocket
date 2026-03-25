import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useAds } from '@/context/AdContext';
import { SHOW_ADS } from '@/constants/adsConfig';
import { usePathname } from 'expo-router';

const { width } = Dimensions.get('window');
const isTablet = Platform.OS === 'ios' && (Platform.isPad || width >= 768);
export const BANNER_AD_HEIGHT = isTablet ? 90 : 50;

const BannerAdImpl = React.lazy(() => import('./BannerAdImpl'));

export function GlobalBannerAd() {
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const pathname = usePathname()

  if (!SHOW_ADS || adsRemoved || temporaryAdRemoval) {
    return null;
  }

  if (pathname === '/maimainet' || pathname.startsWith('/maimainet/')) {
    return null
  }

  return (
    <View style={[styles.container, { bottom: 0 }]}>
      <React.Suspense fallback={<View style={styles.placeholder} />}>
        <BannerAdImpl />
      </React.Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    height: BANNER_AD_HEIGHT,
  },
});
