import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SHOW_ADS } from "@/constants/adsConfig";
import { AdProvider } from "@/context/AdContext";
import { GameQueryProvider } from "@/context/GameQueryProvider";
import * as Updates from "expo-updates";
import { AppState } from "react-native";

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
    if (loaded && SHOW_ADS) {
      // Only preload interstitial ad if ads are enabled
      import("@/components/InterstitialAdComponent").then(
        ({ preloadInterstitialAd }) => {
          preloadInterstitialAd();
        }
      );

      // Initialize ads only if they're enabled
      import("react-native-google-mobile-ads").then(
        ({ default: mobileAds }) => {
          mobileAds()
            .initialize()
            .then(() => {
              console.log("Google Mobile Ads SDK initialized");
            });
        }
      );
    }
  }, [loaded]);

  useEffect(() => {
    let lastActiveTime = Date.now();

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        const currentTime = Date.now();
        const timeInBackground = currentTime - lastActiveTime;

        // If app was in background for more than 4 hours (14400000 ms)
        if (timeInBackground > 14400000) {
          // Reload the app
          try {
            Updates.reloadAsync();
          } catch (error) {
            console.log("Error reloading app:", error);
          }
        }
      } else if (nextAppState === "background") {
        lastActiveTime = Date.now();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GameQueryProvider>
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
            <Stack.Screen
              name="auth/register"
              options={{ headerShown: false }}
            />
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
            <Stack.Screen name="game/index" options={{ headerShown: false }} />
            <Stack.Screen
              name="game/play"
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="game/leaderboard"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="game/casual-play"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="shop/index" options={{ headerShown: false }} />
            <Stack.Screen
              name="settings/delete-account"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/blocked-user"
              options={{ headerShown: false }}
            />
          </Stack>
        </GestureHandlerRootView>
      </AdProvider>
    </GameQueryProvider>
  );
}
