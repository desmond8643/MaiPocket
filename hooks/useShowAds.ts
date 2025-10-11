// import { useAds } from '@/context/AdContext';
// import { ViewStyle } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// /**
//  * Custom hook to manage ad visibility and styling
//  * @param isInTabBar Whether the component is inside a tab bar screen
//  * @returns Object with showAds boolean and dynamic styles for ad containers
//  */
// export function useShowAds(isInTabBar: boolean = false) {
//   const { adsRemoved, temporaryAdRemoval } = useAds();
//   const insets = useSafeAreaInsets();
  
//   // Determine if ads should be shown
//   const showAds = !adsRemoved && !temporaryAdRemoval;

//   // Create dynamic styles for ad containers
//   const dynamicStyles = {
//     bottomAdContainer: {
//       position: 'absolute',
//       bottom: isInTabBar ? 49 + insets.bottom : insets.bottom, // 49 is standard tab bar height
//       left: 0,
//       right: 0,
//       zIndex: 999,
//       alignItems: 'center',
//     } as ViewStyle,
//   };

//   return {
//     showAds,
//     dynamicStyles,
//   };
// } 

// hooks/useShowAds.ts
import { useAds } from '@/context/AdContext';
import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHOW_ADS } from '@/constants/adsConfig';

export function useShowAds(isInTabBar: boolean = false) {
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const insets = useSafeAreaInsets();
  
  // Determine if ads should be shown - check config flag first
  const showAds = SHOW_ADS && !adsRemoved && !temporaryAdRemoval;

  // Create dynamic styles for ad containers
  const dynamicStyles = {
    bottomAdContainer: {
      position: 'absolute',
      bottom: isInTabBar ? 49 + insets.bottom : insets.bottom,
      left: 0,
      right: 0,
      zIndex: 999,
      alignItems: 'center',
    } as ViewStyle,
  };

  return {
    showAds,
    dynamicStyles,
  };
}