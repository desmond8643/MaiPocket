import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AdProvider } from "@/context/AdContext";
import mobileAds, {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads";

// Define a type for the preloaded ad
interface PreloadedAd {
  ad: InterstitialAd;
  unsubscribe: () => void;
}

// Keep track of a preloaded ad
let preloadedAd: PreloadedAd | null = null;
let isLoading = false;
let lastAdShownTime = 0;
const AD_COOLDOWN = 60000; // 1 minute cooldown

// Preload an ad so it's ready when needed
export function preloadInterstitialAd() {
  if (preloadedAd || isLoading) return;

  console.log("Preloading interstitial ad");
  isLoading = true;

  const interstitialAd = InterstitialAd.createForAdRequest(
    TestIds.INTERSTITIAL
  );

  const unsubscribeLoaded = interstitialAd.addAdEventListener(
    AdEventType.LOADED,
    () => {
      console.log("Interstitial ad preloaded successfully");
      preloadedAd = {
        ad: interstitialAd,
        unsubscribe: () => {
          unsubscribeLoaded();
          unsubscribeError();
        },
      };
      isLoading = false;
    }
  );

  const unsubscribeError = interstitialAd.addAdEventListener(
    AdEventType.ERROR,
    (error) => {
      console.error("Error preloading ad:", error);
      isLoading = false;
      // Clean up on error
      unsubscribeLoaded();
      unsubscribeError();
    }
  );

  interstitialAd.load();
}

// Show a preloaded ad or directly navigate if not available
export function showInterstitialAd(onClose = () => {}) {
  const now = Date.now();

  // Skip if we showed an ad recently (cooldown)
  if (now - lastAdShownTime < AD_COOLDOWN) {
    console.log("Ad skipped due to cooldown period");
    onClose();
    preloadInterstitialAd(); // Preload for next time
    return;
  }

  // If we have a preloaded ad ready
  if (preloadedAd) {
    console.log("Showing preloaded interstitial ad");

    const unsubscribeClosed = preloadedAd.ad.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log("Preloaded ad closed");
        lastAdShownTime = Date.now();
        unsubscribeClosed();
        onClose();
        preloadedAd = null;
        // Preload next ad immediately
        preloadInterstitialAd();
      }
    );

    preloadedAd.ad.show();
    preloadedAd.unsubscribe();
  } else {
    // No preloaded ad available, just continue and try to preload for next time
    console.log("No preloaded ad available, continuing without showing ad");
    onClose();
    preloadInterstitialAd();
  }
}

// Keep original function for compatibility
export function showInterstitial(onClose = () => {}) {
  const interstitialAd = InterstitialAd.createForAdRequest(
    TestIds.INTERSTITIAL
  );

  const unsubscribeLoaded = interstitialAd.addAdEventListener(
    AdEventType.LOADED,
    () => {
      interstitialAd.show();
    }
  );

  const unsubscribeClosed = interstitialAd.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      onClose();
    }
  );

  const unsubscribeError = interstitialAd.addAdEventListener(
    AdEventType.ERROR,
    () => {
      onClose();
    }
  );

  interstitialAd.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeClosed();
    unsubscribeError();
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  useEffect(() => {
    if (loaded) {
      // Preload an interstitial ad after app is loaded
      import("@/components/InterstitialAdComponent").then(
        ({ preloadInterstitialAd }) => {
          preloadInterstitialAd();
        }
      );
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Initialize before rendering any ads
  mobileAds()
    .initialize()
    .then(() => {
      // SDK initialized
      console.log("Google Mobile Ads SDK initialized");
    });

  return (
    <AdProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor:
                colorScheme === "dark"
                  ? Colors.dark.background
                  : Colors.light.background,
            },
            headerTintColor:
              colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
            headerTitleStyle: {
              color:
                colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
            },
            contentStyle: {
              backgroundColor:
                colorScheme === "dark"
                  ? Colors.dark.background
                  : Colors.light.background,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="auth/verify" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth/forgot-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="auth/reset-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="settings/edit-profile"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="settings/change-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="remove-ads" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings/social-preferences"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="settings/index"
            options={{ headerShown: false }}
          />
        </Stack>
      </GestureHandlerRootView>
    </AdProvider>
  );
}
