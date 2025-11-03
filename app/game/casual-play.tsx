import {
  AuthAPI,
  getCasualQuizQuestions,
  submitCasualScore,
} from "@/api/client";
import {
  preloadInterstitialAd,
  showInterstitialAd,
} from "@/components/InterstitialAdComponent";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { fetchDataImmediately } from "@/context/GameQueryProvider";
import { useLocalization } from "@/context/LocalizationContext";
import { useShowAds } from "@/hooks/useShowAds";
import { QuizQuestion } from "@/types/game";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CasualGamePlayScreen() {
  const { mode } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const audioPlayer = useAudioPlayer(currentAudioUrl);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<{
    [key: string]: boolean;
  }>({});
  const insets = useSafeAreaInsets();
  const { showAds } = useShowAds(false);
  const { t } = useLocalization();

  // Audio status states
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Game mode selection states
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [gameMode, setGameMode] = useState<"visual" | "audio" | null>(null);
  const [categoryType, setCategoryType] = useState<
    "all" | "level" | "genre" | "version" | "chart_type" | null
  >(null);
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [showSubCategorySelection, setShowSubCategorySelection] =
    useState(false);
  const [notEnoughQuestions, setNotEnoughQuestions] = useState(false);

  // Carousel reference for visual mode
  const carouselRef = useRef<any>(null);

  // To show correct answer before proceeding
  const [showingCorrectAnswer, setShowingCorrectAnswer] = useState(false);

  // Add these state variables for tracking player status
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  // Add these state variables for crystal tracking
  const [crystalsEarned, setCrystalsEarned] = useState(0);
  const [dailyCrystalsEarned, setDailyCrystalsEarned] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(50);

  const [loadedImageCount, setLoadedImageCount] = useState(0);

  // Categories
  const genres = [
    { display: "POPS＆アニメ", value: "POPS＆アニメ" },
    { display: "NICONICO＆ボーカロイド", value: "niconico＆ボーカロイド" },
    { display: "東方Project", value: "東方Project" },
    { display: "ゲーム&バラエティー", value: "ゲーム＆バラエティ" },
    { display: "MAIMAI", value: "maimai" },
    { display: "オンゲキ＆CHUNITHM", value: "オンゲキ＆CHUNITHM" },
  ];

  const levels = [
    "15",
    "14+",
    "14",
    "13+",
    "13",
    "12+",
    "12",
    "11+",
    "11",
    "10+",
    "10",
    "9+",
    "9",
    "8+",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
    "1",
  ];

  const versions = [
    { display: "CiRCLE", value: "CiRCLE" },
    { display: "PRiSM+ (彩)", value: "PRiSM+" },
    { display: "PRiSM (鏡)", value: "PRiSM" },
    { display: "BUDDiES+ (宴)", value: "BUDDiES+" },
    { display: "BUDDiES (双)", value: "BUDDiES" },
    { display: "FESTiVAL+ (祝)", value: "FESTiVAL+" },
    { display: "FESTiVAL (祭)", value: "FESTiVAL" },
    { display: "UNiVERSE+ (星)", value: "UNiVERSE+" },
    { display: "UNiVERSE (宙)", value: "UNiVERSE" },
    { display: "Splash+ (煌)", value: "Splash+" },
    { display: "Splash (爽)", value: "Splash" },
    { display: "でらっくす+ (華)", value: "でらっくす+" },
    { display: "でらっくす (熊)", value: "でらっくす" },
    { display: "FiNALE (輝)", value: "FiNALE" },
    { display: "MiLK+ (雪)", value: "MiLK+" },
    { display: "MiLK (白)", value: "MiLK" },
    { display: "MURASAKI+ (菫)", value: "MURASAKI+" },
    { display: "MURASAKI (紫)", value: "MURASAKI" },
    { display: "PiNK+ (櫻)", value: "PiNK+" },
    { display: "PiNK (桃)", value: "PiNK" },
    { display: "ORANGE+ (暁)", value: "ORANGE+" },
    { display: "ORANGE (橙)", value: "ORANGE" },
    { display: "GreeN+ (檄)", value: "GreeN+" },
    { display: "GreeN (超)", value: "GreeN" },
    { display: "maimai+ (真)", value: "maimai+" },
    { display: "maimai (真)", value: "maimai" },
  ];

  useEffect(() => {
    if (showAds) {
      preloadInterstitialAd();
    }
  }, [showAds]);

  // Update the effect that handles audio URL changes
  useEffect(() => {
    if (!loading && questions.length > 0 && gameMode === "audio") {
      setIsAudioLoading(true);
      setCurrentAudioUrl(questions[currentQuestionIndex]?.audioUrl || null);

      const timer = setTimeout(() => {
        if (audioPlayer) {
          audioPlayer.seekTo(0);
          audioPlayer.play();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, questions, loading, gameMode, audioPlayer]);

  // Add this useEffect to track audio status changes
  useEffect(() => {
    if (!playerStatus) return;

    if (playerStatus.isLoaded && isAudioLoading) {
      setIsAudioLoading(false);
    }

    setIsAudioPlaying(playerStatus.playing);
  }, [playerStatus]);

  // Function to preload images
  const preloadImages = async (urls: string[]) => {
    setLoadedImageCount(0);

    // Instead of waiting for all promises to complete at once,
    // track each one individually
    const preloadPromises = urls.map((url) =>
      Image.prefetch(url)
        .then(() => {
          setLoadedImageCount((prev) => prev + 1);
          return { url, loaded: true };
        })
        .catch(() => {
          // Count failed loads too, to avoid getting stuck
          setLoadedImageCount((prev) => prev + 1);
          return { url, loaded: false };
        })
    );

    try {
      const results = await Promise.all(preloadPromises);
      // Convert the results to the expected format
      const loadedImages = results.reduce((obj, item) => {
        if (item.loaded) obj[item.url] = true;
        return obj;
      }, {} as { [key: string]: boolean });

      setPreloadedImages(loadedImages);
    } catch (error) {
      console.error("Error preloading images:", error);
    }
  };

  // Update effect to track image loading status
  useEffect(() => {
    if (
      imageUrls.length > 0 &&
      Object.keys(preloadedImages).length === imageUrls.length
    ) {
      setIsImageLoading(false);
    }
  }, [preloadedImages, imageUrls]);

  // Handle answer selection
  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedAnswer(answer);
    setShowingCorrectAnswer(true);

    setTimeout(() => {
      if (answer === currentQuestion.correctAnswer) {
        handleCorrectAnswer();
      } else {
        // Vibrate when answer is wrong
        Vibration.vibrate(300);

        // In casual mode, we don't end the game for wrong answers
        // just show the correct answer and continue after delay
        setTimeout(() => {
          setShowingCorrectAnswer(false);
          moveToNextQuestion();
        }, 2000);
      }
    }, 1000);
  };

  const handleCorrectAnswer = () => {
    const newScore = score + 1;
    setScore(newScore);
    setShowingCorrectAnswer(false);
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);

      // Update the audio URL for the next question
      if (gameMode === "audio" && audioUrls[nextIndex]) {
        setCurrentAudioUrl(audioUrls[nextIndex]);
      }
      // Advance the carousel for visual mode
      else if (gameMode === "visual" && carouselRef.current) {
        try {
          carouselRef.current.scrollTo({ index: nextIndex, animated: true });
        } catch (error) {
          console.log("Error scrolling carousel:", error);
        }
      }
    } else {
      // Game over when we've gone through all questions
      handleGameOver();
    }
  };

  const handleGameOver = async () => {
    setGameOver(true);

    // Add submission of score for crystal rewards when score is 5 or more
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();
      if (isLoggedIn && score >= 5) {
        // Submit score to earn crystals but don't track game scores
        const response = await submitCasualScore(score);

        // Set crystal values - add this line to reset crystalsEarned to 0 if not earned
        setCrystalsEarned(response.crystalsEarned || 0);
        if (response.crystalsEarned > 0) {
          setDailyCrystalsEarned(response.dailyCrystalsEarned);
          setDailyLimit(response.dailyLimit);
        }

        // Refresh global crystal status
        await fetchDataImmediately("crystalStatus");
      } else {
        // Make sure crystalsEarned is 0 for users with score < 5
        setCrystalsEarned(0);
      }
    } catch (error) {
      console.error("Error submitting casual score:", error);
      // Ensure crystalsEarned is 0 in case of error
      setCrystalsEarned(0);
    }

    if (showAds) {
      setTimeout(() => {
        showInterstitialAd(() => {});
      }, 1000);
    }
  };

  const playAgain = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameOver(false);
    setSelectedAnswer(null);

    // For casual mode, we go back to mode selection
    setShowModeSelection(true);
    setGameMode(null);
    setCategoryType(null);
    setSubCategory(null);
    setShowSubCategorySelection(false);
  };

  // Update the playAudio function to toggle between play and pause
  const playAudio = () => {
    if (!audioPlayer) return;

    // If audio is currently playing, pause it
    if (isAudioPlaying) {
      audioPlayer.pause();
    } else {
      // If audio is not playing, play it from the beginning
      audioPlayer.seekTo(0);
      audioPlayer.play();
    }
  };

  // Handle game mode selection
  const selectGameMode = (selected: "visual" | "audio") => {
    setGameMode(selected);
    setCategoryType(null);
  };

  // Handle category selection
  const selectCategory = (
    selected: "all" | "level" | "genre" | "version" | "chart_type"
  ) => {
    setCategoryType(selected);

    if (selected === "all") {
      setSubCategory(null);
      setShowSubCategorySelection(false);
      setShowModeSelection(false);
      loadQuestionsWithParams(gameMode || "visual", selected, null);
    } else {
      setShowSubCategorySelection(true);
    }
  };

  // Handle subcategory selection
  const selectSubCategory = (selected: string) => {
    console.log(selected);
    setSubCategory(selected);
    setShowSubCategorySelection(false);
    setShowModeSelection(false);

    // Use the selected value directly instead of waiting for state to update
    loadQuestionsWithParams(
      gameMode || "visual",
      categoryType || "all",
      selected
    );
  };

  const loadQuestionsWithParams = async (
    modeParam: "visual" | "audio",
    categoryTypeParam: "all" | "level" | "genre" | "version" | "chart_type",
    subCategoryParam: string | null
  ) => {
    // Existing function implementation
    try {
      setLoading(true);
      setNotEnoughQuestions(false);

      try {
        const quizData = await getCasualQuizQuestions(
          modeParam,
          categoryTypeParam === "all" ? undefined : categoryTypeParam,
          subCategoryParam
        );

        setQuestions(quizData);

        // Store all audio URLs if in audio mode
        if (modeParam === "audio" && quizData.length > 0) {
          const urls = quizData.map((q) => q.audioUrl || "");
          setAudioUrls(urls);
          setCurrentAudioUrl(quizData[0].audioUrl);
        }
        // Store all image URLs if in visual mode
        else if (modeParam === "visual" && quizData.length > 0) {
          const urls = quizData.map((q) => q.thumbnailUrl || "");
          setImageUrls(urls);
          setIsImageLoading(true);
          preloadImages(urls);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading questions:", error);

        // Check if the error is due to not enough questions
        if (error.response && error.response.status === 400) {
          setNotEnoughQuestions(true);
        } else {
          Alert.alert(
            "Error",
            "Failed to load quiz questions. Please try again."
          );
          router.back();
        }

        setLoading(false);
      }
    } catch (error) {
      console.error("Error in loadQuestions:", error);
      setLoading(false);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  // Render mode selection screen
  const renderModeSelection = () => (
    <ThemedView style={[styles.container, styles.centered]}>
      <ThemedText style={styles.title}>{t("chooseGameMode")}</ThemedText>

      <View style={styles.selectionContainer}>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            gameMode === "visual" && styles.selectedButton,
          ]}
          onPress={() => selectGameMode("visual")}
        >
          <Ionicons
            name="image"
            size={24}
            color={gameMode === "visual" ? "#fff" : "#696FC7"}
          />
          <ThemedText
            style={styles.buttonText}
            lightColor={gameMode === "visual" ? "#fff" : "#696FC7"}
            darkColor="white"
          >
            {t("visualMode")}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.selectionButton,
            gameMode === "audio" && styles.selectedButton,
          ]}
          onPress={() => selectGameMode("audio")}
        >
          <Ionicons
            name="musical-notes"
            size={24}
            color={gameMode === "audio" ? "#fff" : "#696FC7"}
          />
          <ThemedText
            style={styles.buttonText}
            lightColor={gameMode === "audio" ? "#fff" : "#696FC7"}
            darkColor="white"
          >
            {t("audioMode")}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {gameMode && (
        <>
          <ThemedText style={styles.title}>{t("chooseCategory")}</ThemedText>

          <View style={styles.categoryContainer}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                categoryType === "all" && styles.selectedButton,
              ]}
              onPress={() => selectCategory("all")}
            >
              <ThemedText
                style={[styles.buttonText]}
                lightColor={categoryType === "all" ? "#fff" : "#696FC7"}
                darkColor="white"
              >
                {t("allSongs")}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryButton,
                categoryType === "level" && styles.selectedButton,
              ]}
              onPress={() => selectCategory("level")}
            >
              <ThemedText
                style={[styles.buttonText]}
                lightColor={categoryType === "level" ? "#fff" : "#696FC7"}
                darkColor="white"
              >
                {t("byLevel")}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryButton,
                categoryType === "genre" && styles.selectedButton,
              ]}
              onPress={() => selectCategory("genre")}
            >
              <ThemedText
                style={[styles.buttonText]}
                lightColor={categoryType === "genre" ? "#fff" : "#696FC7"}
                darkColor="white"
              >
                {t("byGenre")}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryButton,
                categoryType === "version" && styles.selectedButton,
              ]}
              onPress={() => selectCategory("version")}
            >
              <ThemedText
                style={[styles.buttonText]}
                lightColor={categoryType === "version" ? "#fff" : "#696FC7"}
                darkColor="white"
              >
                {t("byVersion")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                categoryType === "chart_type" && styles.selectedButton,
              ]}
              onPress={() => selectCategory("chart_type")}
            >
              <ThemedText
                style={[styles.buttonText]}
                lightColor={categoryType === "chart_type" ? "#fff" : "#696FC7"}
                darkColor="white"
              >
                {t("byChartType")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.backButton, { marginTop: 24 }]}
        onPress={() => router.back()}
      >
        <ThemedText style={{ color: "#696FC7", fontWeight: "bold" }}>
          {t("backToMenu")}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  // Render subcategory selection modal
  const renderSubCategorySelection = () => (
    <Modal
      visible={showSubCategorySelection}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSubCategorySelection(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSubCategorySelection(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedText style={styles.modalTitle}>
            {t("select")}{" "}
            {categoryType === "level"
              ? t("level")
              : categoryType === "genre"
              ? t("genre")
              : t("version")}
          </ThemedText>

          <ScrollView style={styles.modalScroll}>
            {categoryType === "level" &&
              levels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={styles.modalItem}
                  onPress={() => selectSubCategory(level)}
                >
                  <ThemedText>{level}</ThemedText>
                </TouchableOpacity>
              ))}

            {categoryType === "genre" &&
              genres.map((genre) => (
                <TouchableOpacity
                  key={genre.value}
                  style={styles.modalItem}
                  onPress={() => selectSubCategory(genre.value)}
                >
                  <ThemedText>{genre.display}</ThemedText>
                </TouchableOpacity>
              ))}

            {categoryType === "version" &&
              versions.map((version) => (
                <TouchableOpacity
                  key={version.value}
                  style={styles.modalItem}
                  onPress={() => selectSubCategory(version.value)}
                >
                  <ThemedText>{version.display}</ThemedText>
                </TouchableOpacity>
              ))}
            {categoryType === "chart_type" && (
              <>
                <TouchableOpacity
                  style={[styles.modalItem]}
                  onPress={() => selectSubCategory("standard")}
                >
                  <View style={[styles.chartTypeOption]}>
                    <View style={styles.standardLabel}>
                      <ThemedText style={styles.standardLabelText}>
                        スタンダード
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectSubCategory("deluxe")}
                >
                  <View style={styles.chartTypeOption}>
                    <View style={styles.deluxeLabel}>
                      <ThemedText style={styles.deluxeLabelText}>
                        <ThemedText
                          style={[styles.deluxeLabelText, { color: "#FF0000" }]}
                        >
                          で
                        </ThemedText>
                        <ThemedText
                          style={[styles.deluxeLabelText, { color: "#FF8C00" }]}
                        >
                          ら
                        </ThemedText>
                        <ThemedText
                          style={[styles.deluxeLabelText, { color: "#FFD93D" }]}
                        >
                          っ
                        </ThemedText>
                        <ThemedText
                          style={[styles.deluxeLabelText, { color: "#7ADAA5" }]}
                        >
                          く
                        </ThemedText>
                        <ThemedText
                          style={[styles.deluxeLabelText, { color: "#3396D3" }]}
                        >
                          す
                        </ThemedText>
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowSubCategorySelection(false)}
          >
            <ThemedText style={{ color: "#fff" }}>{t("cancel")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </TouchableOpacity>
    </Modal>
  );

  // Show loading screen
  if (loading && !showModeSelection) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#696FC7" />
        <ThemedText style={{ marginTop: 16 }}>{t("loadingQuestions")}</ThemedText>
      </ThemedView>
    );
  }

  // Show mode selection screen
  if (showModeSelection) {
    return (
      <>
        {renderModeSelection()}
        {renderSubCategorySelection()}
      </>
    );
  }

  // Show error message when not enough questions
  if (notEnoughQuestions) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
        <ThemedText
          style={{ fontSize: 18, marginVertical: 16, textAlign: "center" }}
        >
          {t("notEnoughQuestionsAvailable")}
        </ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#696FC7" }]}
          onPress={playAgain}
        >
          <ThemedText style={styles.buttonText}>
            {t("tryAnotherCategory")}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Game over screen
  if (gameOver) {
    // Determine performance level
    let performanceText = t("miss");
    let performanceColor = "#F44336";

    if (score === 10) {
      performanceText = t("allPerfect");
      performanceColor = "#ED3F27";
    } else if (score >= 7) {
      performanceText = t("great");
      performanceColor = "#FEB21A";
    } else if (score >= 5) {
      performanceText = t("good");
      performanceColor = "#4CAF50";
    } else if (score >= 1) {
      performanceText = t("bad");
      performanceColor = "#696FC7";
    }

    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons
          name={
            score === 10
              ? "trophy"
              : score >= 7
              ? "star"
              : score >= 5
              ? "checkmark-circle"
              : score >= 1
              ? "remove-circle"
              : "close-circle"
          }
          size={80}
          color={performanceColor}
        />
        <ThemedText style={[styles.gameOverTitle, { color: performanceColor }]}>
          {performanceText}
        </ThemedText>
        <ThemedText style={styles.scoreText}>
          {t("yourScore")}: {score}/{questions.length}
        </ThemedText>

        {crystalsEarned > 0 && (
          <View style={styles.crystalContainer}>
            <Image
              source={require("@/assets/images/crystal.png")}
              style={{ height: 40, width: 20 }}
            />
            <ThemedText style={styles.crystalText}>
              +{crystalsEarned} {t("crystalsEarned")}
            </ThemedText>
          </View>
        )}
        {dailyCrystalsEarned > 0 && (
          <ThemedText style={styles.dailyCrystalText}>
            {dailyCrystalsEarned}/{dailyLimit} {t("dailyCrystalsEarned")}
          </ThemedText>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#696FC7" }]}
            onPress={playAgain}
          >
            <ThemedText style={styles.buttonText}>{t("playAgain")}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#AA60C8" }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>{t("backToMenu")}</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Game play screen
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#696FC7" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <ThemedText style={styles.progressText}>
            {t("question")} {currentQuestionIndex + 1}/{questions.length}
          </ThemedText>
          <ThemedText style={styles.scoreText}>{t("score")}: {score}</ThemedText>
        </View>
        {/* Add width to match the back button */}
        <View style={{ width: 40 }}></View>
      </View>

      <View style={styles.questionContainer}>
        {gameMode === "audio" ? (
          <>
            <View style={styles.audioContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={playAudio}
                disabled={isAudioLoading}
              >
                {isAudioLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#696FC7" />
                    <ThemedText style={styles.playButtonText}>
                      {t("loadingAudio")}
                    </ThemedText>
                  </>
                ) : isAudioPlaying ? (
                  <>
                    <Ionicons name="pause-circle" size={80} color="#696FC7" />
                    <ThemedText style={styles.playButtonText}>{t("pause")}</ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="play-circle" size={80} color="#696FC7" />
                    <ThemedText style={styles.playButtonText}>
                      {t("playAudio")}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {isImageLoading && currentQuestionIndex === 0 ? (
              <View style={styles.audioContainer}>
                <ActivityIndicator size="large" color="#696FC7" />
                <ThemedText style={styles.playButtonText}>
                  {t("loadingImages")}... {loadedImageCount}/{imageUrls.length}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.carouselContainer}>
                <Carousel
                  ref={carouselRef}
                  loop={false}
                  width={250}
                  height={250}
                  data={questions}
                  scrollAnimationDuration={300}
                  onSnapToItem={(index) => {}}
                  defaultIndex={currentQuestionIndex}
                  enabled={false}
                  renderItem={({ item, index }) => (
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                  )}
                />
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.answersContainer}>
        {currentQuestion?.choices?.map((choice: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              selectedAnswer !== null &&
              choice === currentQuestion.correctAnswer
                ? styles.correctAnswer
                : selectedAnswer === choice &&
                  choice !== currentQuestion.correctAnswer
                ? styles.wrongAnswer
                : {},
              ((gameMode === "audio" && isAudioLoading) ||
                (gameMode === "visual" && isImageLoading)) &&
                styles.disabledButton,
            ]}
            onPress={() => handleAnswer(choice)}
            disabled={
              selectedAnswer !== null ||
              (gameMode === "audio" && isAudioLoading) ||
              (gameMode === "visual" && isImageLoading)
            }
          >
            <ThemedText
              style={[
                styles.answerButtonText,
                ((gameMode === "audio" && isAudioLoading) ||
                  (gameMode === "visual" && isImageLoading)) &&
                  styles.disabledButtonText,
              ]}
            >
              {choice}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
  },
  backIcon: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    alignItems: "center",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scoreText: {
    fontSize: 16,
  },
  questionContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 24,
  },
  thumbnail: {
    width: 250,
    height: 250,
    marginBottom: 16,
    borderRadius: 12,
  },
  answersContainer: {
    gap: 12,
  },
  answerButton: {
    padding: 16,
    backgroundColor: "#7D8597",
    borderRadius: 12,
  },
  answerButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  correctAnswer: {
    backgroundColor: "#4CAF50",
  },
  wrongAnswer: {
    backgroundColor: "#F44336",
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 10,
    paddingTop: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    // color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  playButton: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  audioContainer: {
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(105, 111, 199, 0.1)",
    borderRadius: 12,
    marginBottom: 16,
  },
  carouselContainer: {
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(105, 111, 199, 0.1)",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  disabledButton: {
    backgroundColor: "#7D8597AA",
    opacity: 0.7,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  // Mode selection styles
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  selectionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  selectionButton: {
    padding: 16,
    backgroundColor: "rgba(105, 111, 199, 0.1)",
    borderRadius: 12,
    width: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedButton: {
    backgroundColor: "#696FC7",
  },
  categoryContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  categoryButton: {
    padding: 16,
    backgroundColor: "rgba(105, 111, 199, 0.1)",
    borderRadius: 12,
    alignItems: "center",
  },
  backButton: {
    padding: 12,
    backgroundColor: "rgba(105, 111, 199, 0.1)",
    borderRadius: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 16,
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F44336",
    alignItems: "center",
  },
  crystalContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  crystalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4C8BF5",
    marginLeft: 8,
  },
  dailyCrystalText: {
    marginTop: 6,
    fontSize: 14,
    color: "#888",
  },
  chartTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
  },
  standardLabel: {
    backgroundColor: "#4BAEEA",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  standardLabelText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  deluxeLabel: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  deluxeLabelText: {
    fontWeight: "bold",
    fontSize: 20,
  },
});
