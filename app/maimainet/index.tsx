import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import WebView from "react-native-webview";
import { Image } from "expo-image";

export default function MaimaiNetScreen() {
  const [defaultRegion, setDefaultRegion] = useState("international");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const popupWebViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();

  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = 100;

  useEffect(() => {
    const checkDefaultRegion = async () => {
      const data = await AsyncStorage.getItem("defaultRegion");
      if (data) {
        const defaultRegionData = JSON.parse(data);
        setDefaultRegion(defaultRegionData);
      }
    };
    checkDefaultRegion();
  }, []);

  const { t } = useLocalization();

  const goBack = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  const goForward = useCallback(() => {
    webViewRef.current?.goForward();
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      // Only allow swiping in valid directions
      if (event.translationX > 0 && canGoBack) {
        translateX.value = event.translationX;
      } else if (event.translationX < 0 && canGoForward) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      "worklet";
      if (event.translationX > SWIPE_THRESHOLD && canGoBack) {
        scheduleOnRN(goBack);
      } else if (event.translationX < -SWIPE_THRESHOLD && canGoForward) {
        scheduleOnRN(goForward);
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    });

  // Left indicator (for going back)
  const leftIndicatorStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: progress,
      transform: [
        { translateX: interpolate(progress, [0, 1], [-50, 0]) },
        { scale: interpolate(progress, [0, 1], [0.5, 1]) },
      ],
    };
  });

  // Right indicator (for going forward)
  const rightIndicatorStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: progress,
      transform: [
        { translateX: interpolate(progress, [0, 1], [50, 0]) },
        { scale: interpolate(progress, [0, 1], [0.5, 1]) },
      ],
    };
  });

  // Optional: subtle page shift effect
  const contentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
            [-20, 0, 20],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const runMaiTools = useCallback(() => {
    const script = `
      (function(d){
        if(["https://maimaidx.jp","https://maimaidx-eng.com"].indexOf(d.location.origin)>=0){
          var s=d.createElement("script");
          s.src="https://myjian.github.io/mai-tools/scripts/all-in-one.js?t="+Math.floor(Date.now()/60000);
          d.body.append(s);
        }
      })(document);
      true; // Required for iOS
    `;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  // Handle when mai-tools script tries to open a new tab
  const handleOpenWindow = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    if (nativeEvent.targetUrl) {
      setPopupUrl(nativeEvent.targetUrl);
    }
  }, []);

  // Handle messages FROM the main WebView (maimai DX NET)
  // These are responses from the mai-tools script that need to go to the popup
  const handleMainWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "BRIDGE_TO_POPUP" && popupWebViewRef.current) {
        // Forward message to popup WebView
        const script = `
          window.postMessage(${JSON.stringify(data.payload)}, "*");
          true;
        `;
        popupWebViewRef.current.injectJavaScript(script);
      }
    } catch (e) {
      // Not a bridge message, ignore
    }
  }, []);

  // Handle messages FROM the popup WebView (rating-calculator)
  // These are requests that need to go to the main WebView
  const handlePopupWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "BRIDGE_TO_MAIN" && webViewRef.current) {
        // Forward message to main WebView - simulate it coming from myjian.github.io
        const script = `
          (function() {
            var event = new MessageEvent('message', {
              data: ${JSON.stringify(data.payload)},
              origin: 'https://myjian.github.io',
              source: window
            });
            // Dispatch to any listeners
            window.dispatchEvent(event);
            // Also try the ratingCalcMsgListener directly if it exists
            if (window.ratingCalcMsgListener) {
              window.ratingCalcMsgListener(event);
            }
          })();
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (e) {
      // Not a bridge message, ignore
    }
  }, []);

  // Script injected into the MAIN WebView to intercept postMessage calls to the popup
  const mainBridgeScript = `
    (function() {
      if (window.__mainBridgeInstalled) return;
      window.__mainBridgeInstalled = true;
      
      // Store the original postMessage
      const originalPostMessage = window.postMessage.bind(window);
      
      // Create a fake "source" object that intercepts postMessage from mai-tools
      // When mai-tools calls e.source.postMessage(data, origin), we forward to React Native
      const createFakeSource = function() {
        return {
          postMessage: function(data, origin) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'BRIDGE_TO_POPUP',
                payload: data
              }));
            }
          }
        };
      };
      
      // Patch the event listener to inject our fake source
      const originalAddEventListener = window.addEventListener.bind(window);
      window.addEventListener = function(type, listener, options) {
        if (type === 'message') {
          const wrappedListener = function(event) {
            // Create a new event with a fake source that bridges to React Native
            const fakeEvent = {
              data: event.data,
              origin: event.origin,
              source: createFakeSource()
            };
            listener(fakeEvent);
          };
          return originalAddEventListener(type, wrappedListener, options);
        }
        return originalAddEventListener(type, listener, options);
      };
    })();
    true;
  `;

  // Script injected into the POPUP WebView to bridge messages back to main
  const popupBridgeScript = `
    (function() {
      if (window.__popupBridgeInstalled) return;
      window.__popupBridgeInstalled = true;
      
      // Create a fake opener that forwards postMessage to React Native
      window.opener = {
        postMessage: function(data, origin) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'BRIDGE_TO_MAIN',
              payload: data
            }));
          }
        }
      };
      
      // Also override parent.postMessage in case it's used
      if (!window.parent || window.parent === window) {
        window.parent = {
          postMessage: function(data, origin) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'BRIDGE_TO_MAIN',
                payload: data
              }));
            }
          }
        };
      }
    })();
    true;
  `;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerBackButtonDisplayMode: "minimal",
          gestureEnabled: false,
          headerRight: () => (
            <Pressable
              onPress={runMaiTools}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                // paddingHorizontal: 15,
              })}
            >
              <Image
                source={require("@/assets/images/toolbox.svg")}
                style={[
                  styles.toolboxIcon,
                  { tintColor: colorScheme === "dark" ? "white" : "black" },
                ]}
              />
            </Pressable>
          ),
        }}
      />
      <GestureDetector gesture={panGesture}>
        <View style={styles.gestureContainer}>
          {/* Left indicator (back) */}
          {canGoBack && (
            <Animated.View
              style={[
                styles.indicator,
                styles.leftIndicator,
                leftIndicatorStyle,
              ]}
            >
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </Animated.View>
          )}

          {/* Right indicator (forward) */}
          {canGoForward && (
            <Animated.View
              style={[
                styles.indicator,
                styles.rightIndicator,
                rightIndicatorStyle,
              ]}
            >
              <Ionicons name="chevron-forward" size={28} color="#fff" />
            </Animated.View>
          )}

          <Animated.View style={[styles.webViewContainer, contentStyle]}>
            <WebView
              ref={webViewRef}
              source={{
                uri:
                  defaultRegion === "japan"
                    ? "https://maimaidx.jp"
                    : "https://maimaidx-eng.com",
              }}
              style={styles.webView}
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              setSupportMultipleWindows={true}
              javaScriptCanOpenWindowsAutomatically={true}
              onOpenWindow={handleOpenWindow}
              onMessage={handleMainWebViewMessage}
              injectedJavaScript={mainBridgeScript}
              onNavigationStateChange={(navState) => {
                setCanGoBack(navState.canGoBack);
                setCanGoForward(navState.canGoForward);
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error("WebView error:", nativeEvent);
              }}
            />
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Popup WebView for mai-tools new tab */}
      <Modal
        visible={!!popupUrl}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPopupUrl(null)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colorScheme === "dark" ? "#000" : "#fff" },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: colorScheme === "dark" ? "#333" : "#eee",
              },
            ]}
          >
            <Pressable
              onPress={() => setPopupUrl(null)}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={28}
                color={colorScheme === "dark" ? "white" : "black"}
              />
            </Pressable>
          </View>
          {popupUrl && (
            <WebView
              ref={popupWebViewRef}
              source={{ uri: popupUrl }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={handlePopupWebViewMessage}
              injectedJavaScriptBeforeContentLoaded={popupBridgeScript}
            />
          )}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureContainer: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    width: "100%",
    height: "100%",
  },
  indicator: {
    position: "absolute",
    top: "50%",
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  leftIndicator: {
    left: 10,
  },
  rightIndicator: {
    right: 10,
  },
  toolboxIcon: {
    width: 25,
    height: 25,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
});
