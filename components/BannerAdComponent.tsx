// import React from 'react';
// import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
// import { SHOW_ADS } from '@/constants/adsConfig';

// export function BannerAdComponent() {
//   if (!SHOW_ADS) return null;
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
import { View } from 'react-native';
import { SHOW_ADS } from '@/constants/adsConfig';

const BannerAdImpl = React.lazy(() => import('./BannerAdImpl'));

export function BannerAdComponent() {
  if (!SHOW_ADS) return null;

  return (
    <React.Suspense fallback={<View />}>
      <BannerAdImpl />
    </React.Suspense>
  );
}

