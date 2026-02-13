import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import {
  preloadInterstitialAd,
  showInterstitialAd,
} from "@/components/InterstitialAdComponent";
import { useLocalization } from "@/context/LocalizationContext";
import { useAds } from "@/context/AdContext";
import { ChartAPI } from "@/api/client";
import { ThumbnailCache, ThumbnailData } from "@/utils/thumbnailCache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

type ChartInfo = {
  title: string;
  chartType: "DX" | "Standard";
  difficulty: "Expert" | "Master" | "Re:Master";
  level: string;
  chartConstant: string;
  achievement: string;
  deluxeScore: string;
  comboStatus: "AP+" | "AP" | "FC+" | "FC" | "None";
  syncStatus: "FDX+" | "FDX" | "FS+" | "FS" | "None";
  thumbnail?: string;
  chartId?: string; // MongoDB _id for navigation to chart detail page
  idx?: string;
  genre?: string; // For duplicate title disambiguation
};

type GroupedCharts = {
  [chartConstant: string]: {
    [rank: string]: ChartInfo[];
  };
};

const RANK_ORDER = ["SSS+", "SSS", "SS+", "SS", "S+", "S", "AAA", "AA", "A", "BBB", "BB", "B", "C", "D", "None"];

function getChartBorderColor(chart: ChartInfo): string {
  // Border represents chart type only
  if (chart.chartType === "Standard") {
    return "#3468C0"; // Dark blue for Standard
  }
  return "#37B5B6"; // Light green for DX/Deluxe
}

function getDifficultyOverlayColor(difficulty: string): string {
  // Overlay represents difficulty
  switch (difficulty) {
    case "Expert":
      return "rgba(139, 0, 0, 0.75)"; // Dark red for Expert
    case "Re:Master":
      return "rgba(147, 112, 176, 0.75)"; // Light purple for Re:Master
    default:
      return "rgba(0, 0, 0, 0.7)";
  }
}

function getRankFromAchievement(achievement: string): string {
  const score = parseFloat(achievement.replace("%", ""));
  if (isNaN(score)) return "None";
  if (score >= 100.5) return "SSS+";
  if (score >= 100.0) return "SSS";
  if (score >= 99.5) return "SS+";
  if (score >= 99.0) return "SS";
  if (score >= 98.0) return "S+";
  if (score >= 97.0) return "S";
  if (score >= 94.0) return "AAA";
  if (score >= 90.0) return "AA";
  if (score >= 80.0) return "A";
  if (score >= 75.0) return "BBB";
  if (score >= 70.0) return "BB";
  if (score >= 60.0) return "B";
  if (score >= 50.0) return "C";
  if (score > 0) return "D";
  return "None";
}

type SortMode = "achievement" | "deluxeScore";

function getDeluxeStars(deluxeScore: string): { stars: number; color: string } | null {
  // Parse "2890 / 3040" or similar format
  const match = deluxeScore.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
  if (!match) return null;

  const current = parseInt(match[1].replace(/,/g, ""));
  const max = parseInt(match[2].replace(/,/g, ""));
  if (!max || isNaN(current)) return null;

  const ratio = current / max;

  // Define thresholds and corresponding star values
  const thresholds = [
    { min: 1.0, stars: 7 },
    { min: 0.99, stars: 6 },
    { min: 0.98, stars: 5.5 },
    { min: 0.97, stars: 5 },
    { min: 0.95, stars: 4 },
    { min: 0.93, stars: 3 },
    { min: 0.9, stars: 2 },
    { min: 0.85, stars: 1 },
    { min: 0, stars: 0 },
  ];

  // Find the base star tier
  const baseTier = thresholds.find((t) => ratio >= t.min) || thresholds[thresholds.length - 1];
  const baseTierIndex = thresholds.indexOf(baseTier);
  const nextTier = baseTierIndex > 0 ? thresholds[baseTierIndex - 1] : null;

  // Calculate interpolated star value within the tier
  let stars: number;
  if (!nextTier || ratio >= 1.0) {
    stars = baseTier.stars;
  } else {
    // Interpolate between tiers for decimal precision
    const tierRange = nextTier.min - baseTier.min;
    const starRange = nextTier.stars - baseTier.stars;
    const progress = (ratio - baseTier.min) / tierRange;
    stars = baseTier.stars + progress * starRange;
  }

  // Determine color based on star range
  let color: string;
  if (stars < 3) {
    color = "#90EE90"; // light green for 1-2 stars
  } else if (stars < 5) {
    color = "#FF6B6B"; // red for 3-4 stars
  } else {
    color = "#FFD700"; // yellow/gold for 5-7 stars
  }

  return { stars, color };
}

function groupChartsByConstantAndRank(charts: ChartInfo[], sortBy: SortMode = "achievement"): GroupedCharts {
  const grouped: GroupedCharts = {};

  charts.forEach((chart) => {
    const constant = chart.chartConstant || "Unknown";
    const rank = getRankFromAchievement(chart.achievement);

    if (!grouped[constant]) {
      grouped[constant] = {};
    }
    if (!grouped[constant][rank]) {
      grouped[constant][rank] = [];
    }
    grouped[constant][rank].push({ ...chart });
  });

  // Sort charts within each rank group
  Object.keys(grouped).forEach((constant) => {
    Object.keys(grouped[constant]).forEach((rank) => {
      grouped[constant][rank].sort((a, b) => {
        if (sortBy === "deluxeScore") {
          // Parse deluxe score ratio for sorting
          const getDeluxeRatio = (ds: string): number => {
            const match = ds.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
            if (!match) return 0;
            const current = parseInt(match[1].replace(/,/g, ""));
            const max = parseInt(match[2].replace(/,/g, ""));
            return max ? current / max : 0;
          };
          return getDeluxeRatio(b.deluxeScore) - getDeluxeRatio(a.deluxeScore);
        } else {
          const scoreA = parseFloat(a.achievement.replace("%", "")) || 0;
          const scoreB = parseFloat(b.achievement.replace("%", "")) || 0;
          return scoreB - scoreA;
        }
      });
    });
  });

  return grouped;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THUMBNAIL_SIZE = (SCREEN_WIDTH - 48) / 5; // 5 columns with padding

// Set of song titles that have duplicates (same title, different songs)
const DUPLICATE_TITLES = new Set(["Link"]);

// Mapping for duplicate title songs: title + genre → MongoDB _id
// Genre is extracted from the detail page's .blue element
const DUPLICATE_TITLE_GENRE_MAP: Record<string, Record<string, string>> = {
  "Link": {
    "maimai": "68c1632dc90fa283e1713ce0",  // maimai original "Link"
    "default": "68c1632dc90fa283e1713cc3", // Other genre "Link" (POPS&ANIME, etc.)
  },
};

export default function MaimaiNetScreen() {
  const [defaultRegion, setDefaultRegion] = useState("international");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [chartData, setChartData] = useState<ChartInfo[] | null>(null);
  const [groupedChartData, setGroupedChartData] = useState<GroupedCharts | null>(null);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("achievement");
  const webViewRef = useRef<WebView>(null);
  const popupWebViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { adsRemoved, temporaryAdRemoval } = useAds();
  const showAds = !adsRemoved && !temporaryAdRemoval;

  const isOnMusicLevelPage = currentUrl.includes(
    "maimai-mobile/record/musicLevel/search/?level="
  );

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

  // Re-group chart data when sort mode changes
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      setGroupedChartData(groupChartsByConstantAndRank(chartData, sortMode));
    }
  }, [sortMode, chartData]);

  // Preload an interstitial ad when the component mounts
  useEffect(() => {
    if (showAds) {
      preloadInterstitialAd();
    }
  }, [showAds]);

  const goBack = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  const goForward = useCallback(() => {
    webViewRef.current?.goForward();
  }, []);

  const handleChartPress = useCallback((chart: ChartInfo) => {
    if (chart.chartId) {
      if (showAds) {
        showInterstitialAd(() => {
          setChartData(null); // Close the modal
          router.push({
            pathname: "/charts/[id]",
            params: { id: chart.chartId },
          });
        });
      } else {
        setChartData(null); // Close the modal
        router.push({
          pathname: "/charts/[id]",
          params: { id: chart.chartId },
        })
      }
    }
  }, [router, showAds]);

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

  const fetchChartData = useCallback(() => {
    // First inject mai-tools
    const maiToolsScript = `
      (function(d){
        if(["https://maimaidx.jp","https://maimaidx-eng.com"].indexOf(d.location.origin)>=0){
          var s=d.createElement("script");
          s.src="https://myjian.github.io/mai-tools/scripts/all-in-one.js?t="+Math.floor(Date.now()/60000);
          d.body.append(s);
        }
      })(document);
      true;
    `;
    webViewRef.current?.injectJavaScript(maiToolsScript);

    // Poll for mai-tools to finish, then extract
    // Pass duplicate titles list to the script
    const duplicateTitlesArray = JSON.stringify([...DUPLICATE_TITLES]);
    const extractScript = `
      (function() {
        const DUPLICATE_TITLES = new Set(${duplicateTitlesArray});
        let attempts = 0;
        const maxAttempts = 20; // 20 * 250ms = 5 seconds max
        
        function checkAndExtract() {
          attempts++;
          // Check if mai-tools has updated the levels (they'll have decimals like "14.7" instead of "14")
          const levelBlocks = document.querySelectorAll('.music_lv_block');
          const hasChartConstants = Array.from(levelBlocks).some(el => el.textContent.includes('.'));
          
          if (hasChartConstants || attempts >= maxAttempts) {
            extractCharts();
          } else {
            setTimeout(checkAndExtract, 250);
          }
        }
        
        // Fetch genre from detail page for duplicate title songs
        async function fetchGenreFromDetailPage(idx) {
          try {
            const baseUrl = window.location.origin;
            const detailUrl = baseUrl + '/maimai-mobile/record/musicDetail/?idx=' + encodeURIComponent(idx);
            const response = await fetch(detailUrl, { credentials: 'include' });
            const html = await response.text();
            
            // Parse the HTML to extract genre from .blue element
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const blueEl = doc.querySelector('.basic_block .blue');
            if (blueEl) {
              // Get text content, removing any img tags
              const genre = blueEl.textContent?.trim() || '';
              return genre;
            }
            return '';
          } catch (err) {
            console.error('Error fetching genre:', err);
            return '';
          }
        }
        
        async function extractCharts() {
          const charts = [];
          const chartDivs = document.querySelectorAll('.music_master_score_back, .music_expert_score_back, .music_remaster_score_back');
          
          // First pass: collect all chart data
          const chartDataList = [];
          chartDivs.forEach(function(div) {
            const title = div.querySelector('.music_name_block')?.textContent?.trim() || '';
            const level = div.querySelector('.music_lv_block')?.textContent?.trim() || '';
            const achievement = div.querySelector('.music_score_block.w_112')?.textContent?.trim() || '';
            const deluxeScoreEl = div.querySelector('.music_score_block.w_190');
            const deluxeScore = deluxeScoreEl ? deluxeScoreEl.textContent?.trim() : '';
            
            // Chart type
            const kindIcon = div.querySelector('.music_kind_icon');
            const chartType = kindIcon && kindIcon.src.includes('music_dx') ? 'DX' : 'Standard';
            
            // Difficulty from container class
            const containerClass = div.className;
            let difficulty = 'Master';
            if (containerClass.includes('remaster')) difficulty = 'Re:Master';
            else if (containerClass.includes('expert')) difficulty = 'Expert';
            
            // Combo/sync status from icons
            const icons = div.querySelectorAll('img.h_30');
            let comboStatus = 'None';
            let syncStatus = 'None';
            
            icons.forEach(function(img) {
              const src = img.src;
              if (src.includes('app.png')) comboStatus = 'AP+';
              else if (src.includes('_ap.png')) comboStatus = 'AP';
              else if (src.includes('fcp.png')) comboStatus = 'FC+';
              else if (src.includes('_fc.png')) comboStatus = 'FC';
              
              if (src.includes('fdxp.png')) syncStatus = 'FDX+';
              else if (src.includes('fdx.png')) syncStatus = 'FDX';
              else if (src.includes('fsp.png')) syncStatus = 'FS+';
              else if (src.includes('fs.png')) syncStatus = 'FS';
            });
            
            const chartConstant = level;
            const idx = div.querySelector('input[name="idx"]')?.value || '';
            
            chartDataList.push({
              title, chartType, difficulty, level,
              chartConstant,
              achievement, deluxeScore, comboStatus, syncStatus,
              idx,
              needsGenre: DUPLICATE_TITLES.has(title) && idx
            });
          });
          
          // Second pass: fetch genres for duplicate titles (in parallel)
          const genrePromises = chartDataList.map(async (chart) => {
            if (chart.needsGenre) {
              const genre = await fetchGenreFromDetailPage(chart.idx);
              return { ...chart, genre };
            }
            return chart;
          });
          
          const chartsWithGenres = await Promise.all(genrePromises);
          
          // Clean up and send
          const finalCharts = chartsWithGenres.map(({ needsGenre, ...chart }) => chart);
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CHART_DATA',
            payload: finalCharts
          }));
        }
        
        checkAndExtract();
      })();
      true;
    `;

    // Small delay to let mai-tools script start loading
    setTimeout(() => {
      webViewRef.current?.injectJavaScript(extractScript);
    }, 500);
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
  const handleMainWebViewMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "CHART_DATA") {
        const charts: ChartInfo[] = data.payload;
        setChartData(charts);
        setIsLoadingThumbnails(true);

        // Fetch thumbnails for all charts (cache-first approach)
        try {
          // Helper to get chart ID from genre map
          const getChartIdFromGenre = (title: string, genre?: string): string | null => {
            const genreMap = DUPLICATE_TITLE_GENRE_MAP[title];
            if (!genreMap) return null;
            // Try exact genre match first, then fall back to default
            return genreMap[genre || ""] || genreMap["default"] || null;
          };

          // Separate charts with duplicate titles (need id-based lookup) from regular charts
          const duplicateChartIds = new Set<string>();
          const regularTitles = new Set<string>();

          charts.forEach((chart) => {
            console.log(chart);
            // Check if this is a duplicate title chart with genre resolved
            const chartId = getChartIdFromGenre(chart.title, chart.genre);
            if (chartId) {
              duplicateChartIds.add(chartId);
            } else {
              regularTitles.add(chart.title);
            }
          });

          const uniqueTitles = [...regularTitles];
          const uniqueIds = [...duplicateChartIds];

          console.log("Duplicate title chart IDs:", uniqueIds);

          // Check cache first (cache stores both by title and by _id with "id:" prefix)
          const cachedThumbnails = await ThumbnailCache.get();
          const uncachedTitles = uniqueTitles.filter(
            (t) => !cachedThumbnails[t]
          );
          const uncachedIds = uniqueIds.filter(
            (id) => !cachedThumbnails[`id:${id}`]
          );

          let thumbnailMap = { ...cachedThumbnails };

          // Fetch uncached thumbnails from API
          if (uncachedTitles.length > 0 || uncachedIds.length > 0) {
            if (uncachedIds.length > 0) {
              // Use the new API that supports both titles and ids
              const result = await ChartAPI.getThumbnailsWithIds(uncachedTitles, uncachedIds);

              // Save title-based thumbnails
              if (Object.keys(result.byTitle).length > 0) {
                await ThumbnailCache.save(result.byTitle);
                thumbnailMap = { ...thumbnailMap, ...result.byTitle };
              }

              // Save id-based thumbnails with "id:" prefix
              if (Object.keys(result.byId).length > 0) {
                const idThumbnails: Record<string, { image: string; id: string }> = {};
                Object.entries(result.byId).forEach(([id, data]) => {
                  idThumbnails[`id:${id}`] = data;
                });
                await ThumbnailCache.save(idThumbnails);
                thumbnailMap = { ...thumbnailMap, ...idThumbnails };
              }
            } else {
              // Only titles to fetch, use simpler API
              const freshThumbnails = await ChartAPI.getThumbnails(uncachedTitles);
              await ThumbnailCache.save(freshThumbnails);
              thumbnailMap = { ...thumbnailMap, ...freshThumbnails };
            }
          }

          // Merge thumbnails into chart data
          const chartsWithThumbnails = charts.map((chart) => {
            // For duplicate title charts, use id-based lookup via genre
            const genreChartId = getChartIdFromGenre(chart.title, chart.genre);
            if (genreChartId) {
              const data = thumbnailMap[`id:${genreChartId}`];
              return {
                ...chart,
                thumbnail: data?.image || undefined,
                chartId: data?.id || genreChartId,
              };
            }
            // For regular charts, use title-based lookup
            const data = thumbnailMap[chart.title];
            return {
              ...chart,
              thumbnail: data?.image || undefined,
              chartId: data?.id || undefined,
            };
          });

          setChartData(chartsWithThumbnails);
          setGroupedChartData(groupChartsByConstantAndRank(chartsWithThumbnails, sortMode));
        } catch (err) {
          console.error("Error fetching thumbnails:", err);
          // Still group even without thumbnails
          setGroupedChartData(groupChartsByConstantAndRank(charts, sortMode));
        } finally {
          setIsLoadingThumbnails(false);
        }
        return;
      }

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
  }, [sortMode]);

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
            <View style={styles.headerButtons}>
              {isOnMusicLevelPage && (
                <Pressable
                  onPress={fetchChartData}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <Image
                    source={require("@/assets/images/sparkles.svg")}
                    style={[
                      styles.toolboxIcon,
                      { tintColor: colorScheme === "dark" ? "white" : "black" },
                    ]}
                  />
                </Pressable>
              )}
              <Pressable
                onPress={runMaiTools}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
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
            </View>
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
                setCurrentUrl(navState.url || "");
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

      {/* Chart Data Modal */}
      <Modal
        visible={!!chartData}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setChartData(null);
          setGroupedChartData(null);
        }}
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
            <ThemedText style={styles.modalTitle}>
              {t("chartData")}
            </ThemedText>
            {/* Sort Mode Toggle */}
            <View style={styles.sortToggle}>
              <Pressable
                onPress={() => setSortMode("achievement")}
                style={[
                  styles.sortToggleButton,
                  sortMode === "achievement" && styles.sortToggleButtonActive,
                  { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                ]}
              >
                <ThemedText
                  style={[
                    styles.sortToggleText,
                    sortMode === "achievement" && styles.sortToggleTextActive,
                  ]}
                >
                  %
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setSortMode("deluxeScore")}
                style={[
                  styles.sortToggleButton,
                  sortMode === "deluxeScore" && styles.sortToggleButtonActive,
                  { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                ]}
              >
                <ThemedText
                  style={[
                    styles.sortToggleText,
                    sortMode === "deluxeScore" && styles.sortToggleTextActive,
                  ]}
                >
                  ✦
                </ThemedText>
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                setChartData(null);
                setGroupedChartData(null);
              }}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={28}
                color={colorScheme === "dark" ? "white" : "black"}
              />
            </Pressable>
          </View>

          {isLoadingThumbnails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={styles.loadingText}>
                Loading thumbnails...
              </ThemedText>
            </View>
          ) : groupedChartData ? (
            <ScrollView style={styles.chartList}>
              {Object.keys(groupedChartData)
                .sort((a, b) => parseFloat(b) - parseFloat(a))
                .map((chartConstant) => {
                  const rankGroups = groupedChartData[chartConstant];
                  // Get the minimum rank achieved across all charts for this level
                  // If any chart is unplayed, display nothing
                  const hasUnplayed = rankGroups["None"]?.length > 0;
                  const worstRank = RANK_ORDER
                    .filter(rank => rank !== "None" && rankGroups[rank]?.length > 0)
                    .pop() || "";
                  const displayRank = hasUnplayed ? "" : worstRank;

                  return (
                    <View key={chartConstant} style={styles.levelSection}>
                      <View style={styles.levelHeader}>
                        <ThemedText style={styles.levelTitle}>
                          {chartConstant}
                        </ThemedText>
                        {displayRank !== "" && (
                          <ThemedText style={[
                            styles.levelRank,
                            {
                              color: displayRank.includes("SSS") ? "#FFD700" :
                                displayRank.includes("SS") ? "#C0C0C0" :
                                  displayRank.includes("S") ? "#CD7F32" : "#888"
                            }
                          ]}>
                            {displayRank}
                          </ThemedText>
                        )}
                      </View>

                      {RANK_ORDER.filter((rank) => rankGroups[rank]?.length > 0).map((rank) => {
                        return <View key={rank} style={styles.rankSection}>
                          <ThemedText style={styles.rankLabel}>{rank}</ThemedText>
                          <View style={styles.thumbnailGrid}>
                            {rankGroups[rank].map((chart, index) => {

                              return <TouchableOpacity
                                key={`${chart.title}-${chart.chartType}-${index}`}
                                style={[
                                  styles.thumbnailContainer,
                                  {
                                    borderWidth: 4,
                                    borderColor: getChartBorderColor(chart),
                                  }
                                ]}
                                onPress={() => handleChartPress(chart)}
                                disabled={!chart.chartId}
                                activeOpacity={chart.chartId ? 0.7 : 1}
                              >
                                {chart.thumbnail ? (
                                  <Image
                                    source={{ uri: chart.thumbnail }}
                                    style={styles.thumbnail}
                                    contentFit="cover"
                                  />
                                ) : (
                                  <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                                    <ThemedText style={styles.placeholderText} numberOfLines={2}>
                                      {chart.title.slice(0, 10)}
                                    </ThemedText>
                                  </View>
                                )}

                                {/* Badges overlay */}
                                <View style={styles.badgesContainer}>
                                  {chart.comboStatus !== "None" && (
                                    <View style={[
                                      styles.badge,
                                      styles.comboBadge,
                                      { backgroundColor: chart.comboStatus.includes("AP") ? "#FF9900" : "#00FF00" }
                                    ]}>
                                      <ThemedText style={styles.badgeText}>
                                        {chart.comboStatus.replace("+", "+")}
                                      </ThemedText>
                                    </View>
                                  )}
                                  {/* Sync badge */}
                                  {chart.syncStatus !== "None" && (
                                    <View style={[
                                      styles.badge,
                                      chart.syncStatus.includes("FDX") ? styles.fdxBadge : styles.fsBadge
                                    ]}>
                                      <ThemedText style={styles.badgeText}>
                                        {chart.syncStatus}
                                      </ThemedText>
                                    </View>
                                  )}
                                </View>
                                {/* Score overlay */}
                                <View style={[styles.scoreOverlay, { backgroundColor: getDifficultyOverlayColor(chart.difficulty) }]}>
                                  {sortMode === "deluxeScore" ? (
                                    (() => {
                                      const starData = getDeluxeStars(chart.deluxeScore);
                                      if (!starData) return <ThemedText style={styles.scoreText}>-</ThemedText>;
                                      return (
                                        <ThemedText style={[styles.scoreText, { color: starData.color }]}>
                                          ✦ {starData.stars.toFixed(2)}
                                        </ThemedText>
                                      );
                                    })()
                                  ) : (
                                    chart.achievement && (
                                      <ThemedText style={styles.scoreText}>
                                        {parseFloat(chart.achievement.replace("%", "")).toFixed(4)}
                                      </ThemedText>
                                    )
                                  )}
                                </View>
                              </TouchableOpacity>
                            })}
                          </View>
                        </View>
                      })}
                    </View>
                  );
                })}
            </ScrollView>
          ) : (
            <View style={styles.loadingContainer}>
              <ThemedText>No chart data available</ThemedText>
            </View>
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
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
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  sortToggle: {
    flexDirection: "row",
    marginRight: 12,
  },
  sortToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
  sortToggleButtonActive: {
    backgroundColor: "#982598",
  },
  sortToggleText: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.6,
  },
  sortToggleTextActive: {
    color: "#fff",
    opacity: 1,
  },
  chartList: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  levelSection: {
    marginBottom: 24,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  levelRank: {
    fontSize: 16,
    fontWeight: "600",
  },
  rankSection: {
    marginBottom: 12,
  },
  rankLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    opacity: 0.7,
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  placeholderThumbnail: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 8,
    textAlign: "center",
    padding: 2,
  },
  badgesContainer: {
    position: "absolute",
    top: 2,
    left: 2,
    flexDirection: "row",
    gap: 2,
  },
  badge: {
    paddingHorizontal: 3,
    // paddingVertical: 1,
    borderRadius: 2,
  },
  comboBadge: {
    backgroundColor: "#00FF00",
  },
  syncBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#9932CC",
  },
  fsBadge: {
    backgroundColor: '#0AC4E0', // blue
  },
  fdxBadge: {
    backgroundColor: '#F97316', // orange
  },
  badgeText: {
    fontSize: 7,
    fontWeight: "700",
    color: "#000",
  },
  scoreOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 1,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chartItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  chartDetails: {
    gap: 2,
  },
  chartDetailText: {
    fontSize: 14,
    opacity: 0.8,
  },
});
