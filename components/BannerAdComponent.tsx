// import React from 'react';
// import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// export function BannerAdComponent() {
//   // Use test ID during development
//   const adUnitId = TestIds.BANNER;
  
//   return (
//     <BannerAd
//       unitId={adUnitId}
//       size={BannerAdSize.BANNER}
//       requestOptions={{
//         requestNonPersonalizedAdsOnly: true,
//       }}
//     />
//   );
// }

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export function BannerAdComponent() {
  // Use test ID during development
  const adUnitId = TestIds.BANNER;
  
  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 999,
  },
});