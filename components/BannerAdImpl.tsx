import React from "react";
import { Platform } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

export default function BannerAdImpl() {
  const adUnitId = Platform.select({
    ios: "ca-app-pub-7106153117550777/5330249389", // Replace with your iOS banner ad unit ID
    default: "",
  });
  return (
    <BannerAd
      // unitId={TestIds.BANNER}
      unitId={adUnitId}
      size={BannerAdSize.BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  );
}
