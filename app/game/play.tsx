import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useLocalSearchParams, router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  View,
  ActivityIndicator,
  Alert,
  Vibration,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthAPI,
  getQuizQuestions,
  getUserStreak,
  submitScore,
} from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { QuizQuestion } from "@/types/game";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  preloadInterstitialAd,
  showInterstitialAd,
} from "@/components/InterstitialAdComponent";
import { useShowAds } from "@/hooks/useShowAds";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import Carousel from "react-native-reanimated-carousel";
import { Dimensions } from "react-native";
import { fetchDataImmediately, queryClient } from "@/context/GameQueryProvider";

export default function GamePlayScreen() {
  const { mode } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds per question
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  // Add this state to store preloaded players
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const audioPlayer = useAudioPlayer(currentAudioUrl);
  // Add this new state to store image URLs
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<{
    [key: string]: boolean;
  }>({});
  const insets = useSafeAreaInsets();
  const { showAds } = useShowAds(false);

  // Add these states to track audio status
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Add this to track player status
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  // Add this state for the carousel reference
  const carouselRef = useRef<any>(null);
  // const { width } = Dimensions.get("window");

  // Add a new state variable around line 40 (with the other state variables)
  const [showingCorrectAnswer, setShowingCorrectAnswer] = useState(false);

  // Add these state variables for crystal tracking
  const [crystalsEarned, setCrystalsEarned] = useState(0);
  const [dailyCrystalsEarned, setDailyCrystalsEarned] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(50);

  useEffect(() => {
    loadQuestions();
  }, []);

  // Add a useEffect to track audio status changes
  useEffect(() => {
    if (!playerStatus) return;

    if (playerStatus.isLoaded && isAudioLoading) {
      setIsAudioLoading(false);
    }

    setIsAudioPlaying(playerStatus.playing);

    // Start timer only when audio starts playing in audio mode
    if (mode === "audio" && playerStatus.playing && timeLeft === 15) {
      // Timer starts automatically when isAudioPlaying becomes true
    }
  }, [playerStatus]);

  // Modify your timer effect to only start when audio is playing in audio mode
  // or when images are fully loaded in visual mode
  useEffect(() => {
    if (loading || gameOver || showingCorrectAnswer) return; // Add showingCorrectAnswer check here

    // For audio mode, only start timer when audio is playing
    if (mode === "audio" && !isAudioPlaying && timeLeft === 15) {
      return; // Don't start timer yet
    }

    // For visual mode, only start timer when images are loaded
    if (mode === "visual" && isImageLoading && timeLeft === 15) {
      return; // Don't start timer yet
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    loading,
    gameOver,
    currentQuestionIndex,
    isAudioPlaying,
    isImageLoading,
    showingCorrectAnswer,
  ]); // Add showingCorrectAnswer dependency

  useEffect(() => {
    if (showAds) {
      preloadInterstitialAd();
    }
  }, [showAds]);

  // Update the effect that handles audio URL changes
  useEffect(() => {
    if (!loading && questions.length > 0 && mode === "audio") {
      // Set loading state to true when changing audio URL
      setIsAudioLoading(true);
      setCurrentAudioUrl(questions[currentQuestionIndex]?.audioUrl || null);

      // Add a small delay to ensure the audio URL is set before playing
      const timer = setTimeout(() => {
        if (audioPlayer) {
          audioPlayer.seekTo(0);
          audioPlayer.play();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, questions, loading, mode, audioPlayer]);

  // Add this function after the loadQuestions function
  const preloadImages = async (urls: string[]) => {
    const preloadPromises = urls.map((url) => Image.prefetch(url));
    try {
      await Promise.all(preloadPromises);
      // Mark all images as preloaded
      const loadedImages = urls.reduce((obj, url) => {
        obj[url] = true;
        return obj;
      }, {} as { [key: string]: boolean });

      setPreloadedImages(loadedImages);
    } catch (error) {
      console.error("Error preloading images:", error);
    }
  };

  // Update the loadQuestions function to preload images
  const loadQuestions = async () => {
    try {
      const modeStr = Array.isArray(mode) ? mode[0] : mode || "visual";
      const quizData = await getQuizQuestions(modeStr);

      setQuestions(quizData);

      // Store all audio URLs if in audio mode
      if (modeStr === "audio" && quizData.length > 0) {
        const urls = quizData.map((q) => q.audioUrl || "");
        setAudioUrls(urls);

        // Set current audio URL for immediate play
        setCurrentAudioUrl(quizData[0].audioUrl);
      }
      // Store all image URLs if in visual mode
      else if (modeStr === "visual" && quizData.length > 0) {
        const urls = quizData.map((q) => q.thumbnailUrl || "");
        setImageUrls(urls);

        // Set loading state to true while images are preloading
        setIsImageLoading(true);

        // Start preloading all images
        preloadImages(urls);
      }

      // Check if user is logged in
      const isLoggedIn = await AuthAPI.isLoggedIn();

      if (isLoggedIn) {
        try {
          // Fetch streak from server
          const userScores = await getUserStreak(modeStr);
          setAccumulatedScore(userScores.currentStreak);
          setBestScore(userScores.highScore);
        } catch (error) {
          console.error("Error fetching user streak from server:", error);
          // Fallback to local storage
          fallbackToLocalStorage(modeStr);
        }
      } else {
        // Not logged in, use local storage
        fallbackToLocalStorage(modeStr);
      }

      setLoading(false);
      setTimeLeft(15);
    } catch (error) {
      console.error("Error loading questions:", error);
      Alert.alert("Error", "Failed to load quiz questions. Please try again.");
      router.back();
    }
  };

  // Add a new effect to track image loading status
  useEffect(() => {
    if (
      imageUrls.length > 0 &&
      Object.keys(preloadedImages).length === imageUrls.length
    ) {
      setIsImageLoading(false);
    }
  }, [preloadedImages, imageUrls]);

  // Helper function for local storage fallback
  const fallbackToLocalStorage = async (modeStr: string) => {
    const storageKey = "songQuizScores";
    const savedScoresStr = await AsyncStorage.getItem(storageKey);
    if (savedScoresStr) {
      const savedScores = JSON.parse(savedScoresStr);
      const modeKey = modeStr === "hard" ? "hard" : "normal";
      const currentStreak = savedScores[modeKey].currentStreak || 0;
      setAccumulatedScore(currentStreak);
    }
  };

  // Modify the handleAnswer function to set this state
  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedAnswer(answer);

    setTimeout(() => {
      if (answer === currentQuestion.correctAnswer) {
        handleCorrectAnswer();
      } else {
        // Vibrate when answer is wrong
        Vibration.vibrate(300);

        // Set the flag to prevent timer countdown
        setShowingCorrectAnswer(true);

        // Add delay before game over to show the correct answer
        setTimeout(() => {
          setShowingCorrectAnswer(false); // Reset the flag
          handleGameOver();
        }, 2000); // 2 second delay to show the correct answer
      }
    }, 1000);
  };

  const handleCorrectAnswer = () => {
    const newScore = score + 1;
    const newAccumulatedScore = accumulatedScore + 1;
    setScore(newScore);
    setAccumulatedScore(newAccumulatedScore);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeLeft(15);
      setSelectedAnswer(null);

      // Update the audio URL for the next question
      if (mode === "audio" && audioUrls[nextIndex]) {
        setCurrentAudioUrl(audioUrls[nextIndex]);
      }
      // Advance the carousel for visual mode
      else if (mode === "visual" && carouselRef.current) {
        try {
          carouselRef.current.scrollTo({ index: nextIndex, animated: true });
        } catch (error) {
          console.log("Error scrolling carousel:", error);
          // Fallback - just update the index state
        }
      }
    } else {
      // Pass the correct score to handleGameOver
      handleGameOver(true, newScore, newAccumulatedScore);
    }
  };

  const updateScores = async (
    completed = false,
    finalScore = score,
    finalAccumulated = accumulatedScore
  ) => {
    try {
      const modeStr = Array.isArray(mode) ? mode[0] : mode;
      const isLoggedIn = await AuthAPI.isLoggedIn();
      const rawScore = finalScore;

      if (isLoggedIn) {
        // For logged-in users, send score to server and get updated values
        const updatedStreak = finalAccumulated; // Use the current accumulated score
        const newStreak = completed ? updatedStreak : 0;

        // Submit score to server
        const serverResponse = await submitScore(
          modeStr,
          rawScore,
          updatedStreak,
          newStreak
        );

        // Update local state with server values
        setBestScore(serverResponse.highScore);
        setIsNewRecord(updatedStreak > bestScore);

        // Add this to handle crystal rewards
        if (serverResponse.crystalsEarned > 0) {
          setCrystalsEarned(serverResponse.crystalsEarned);
          setDailyCrystalsEarned(serverResponse.dailyCrystalsEarned);
          setDailyLimit(serverResponse.dailyLimit);
        }
        await fetchDataImmediately("gameScores");
        await fetchDataImmediately("crystalStatus");
      } else {
        // For non-logged in users, use local storage
        const storageKey = "songQuizScores";
        const savedScoresStr = await AsyncStorage.getItem(storageKey);
        const savedScores = savedScoresStr
          ? JSON.parse(savedScoresStr)
          : {
              visual: { highScore: 0, currentStreak: 0 },
            };

        const modeKey = modeStr === "visual" ? "visual" : "audio";
        const updatedStreak = finalAccumulated;
        const newStreak = completed ? updatedStreak : 0;

        // Store current best score
        const currentHighScore = savedScores[modeKey].highScore;
        // Update high score
        const newHighScore = Math.max(currentHighScore, updatedStreak);

        // Set state for display
        setBestScore(newHighScore);
        // Check if we have a new record
        setIsNewRecord(updatedStreak > currentHighScore);

        savedScores[modeKey] = {
          highScore: newHighScore,
          currentStreak: newStreak,
        };

        await AsyncStorage.setItem(storageKey, JSON.stringify(savedScores));
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const handleGameOver = async (
    completed = false,
    finalScore = score,
    finalAccumulated = accumulatedScore
  ) => {
    setGameOver(true);

    updateScores(completed, finalScore, finalAccumulated);

    if (showAds) {
      setTimeout(() => {
        showInterstitialAd(() => {});
      }, 1000);
    }
  };

  const playAgain = () => {
    setLoading(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameOver(false);
    setSelectedAnswer(null);
    loadQuestions();
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

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#696FC7" />
        <ThemedText style={{ marginTop: 16 }}>Loading questions...</ThemedText>
      </ThemedView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (gameOver) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons
          name={score === questions.length ? "trophy" : "sad"}
          size={80}
          color="#F75270"
        />
        <ThemedText
          style={[
            styles.gameOverTitle,
            { color: score === questions.length ? "#ED3F27" : "#696FC7" },
          ]}
        >
          {score === questions.length ? "All Perfect" : "You Lose..."}
        </ThemedText>
        <ThemedText style={styles.scoreText}>
          Your Score: {score}/{questions.length}
        </ThemedText>
        <ThemedText style={styles.scoreText}>
          Current Streak🔥: {accumulatedScore}
        </ThemedText>
        <ThemedText style={[styles.scoreText, styles.bestScoreText]}>
          Best Score: {bestScore}{" "}
          {isNewRecord && (
            <ThemedText style={{ color: "#4CAF50" }}>(New Record!)</ThemedText>
          )}
        </ThemedText>
        {/* Add this section to display crystal rewards */}
        {crystalsEarned > 0 && (
          <View style={styles.crystalRewardContainer}>
            <Image
              source={require("@/assets/images/crystal.png")}
              style={{ height: 40, width: 20, marginRight: 8 }}
            />
            <ThemedText style={styles.crystalRewardText}>
              +{crystalsEarned} Crystals!
            </ThemedText>
          </View>
        )}
        {dailyCrystalsEarned > 0 && (
          <ThemedText style={styles.crystalDailyText}>
            {dailyCrystalsEarned}/{dailyLimit} daily crystals earned
          </ThemedText>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#696FC7" }]}
            onPress={playAgain}
          >
            <ThemedText style={styles.buttonText}>Play Again</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#AA60C8" }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>Back to Menu</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.timerPlaceholder}></View>
        <View style={styles.progressContainer}>
          <ThemedText style={styles.progressText}>
            Question {currentQuestionIndex + 1}/{questions.length}
          </ThemedText>
          <ThemedText style={styles.scoreText}>
            Score: {score} (Total: {accumulatedScore})
          </ThemedText>
        </View>
        <View style={styles.timerContainer}>
          <ThemedText
            style={[styles.timerText, timeLeft <= 5 && styles.timerTextWarning]}
          >
            {timeLeft}
          </ThemedText>
        </View>
      </View>

      <View style={styles.questionContainer}>
        {mode === "audio" ? (
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
                      Loading Audio...
                    </ThemedText>
                  </>
                ) : isAudioPlaying ? (
                  <>
                    <Ionicons name="pause-circle" size={80} color="#696FC7" />
                    <ThemedText style={styles.playButtonText}>Pause</ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="play-circle" size={80} color="#696FC7" />
                    <ThemedText style={styles.playButtonText}>
                      Play Audio
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
                  Loading Images...
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
                      resizeMode="cover"
                    />
                  )}
                />
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.answersContainer}>
        {currentQuestion.choices.map((choice: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              // Modified logic to show correct answer when any wrong answer is selected
              selectedAnswer !== null &&
              choice === currentQuestion.correctAnswer
                ? styles.correctAnswer
                : selectedAnswer === choice &&
                  choice !== currentQuestion.correctAnswer
                ? styles.wrongAnswer
                : {},
              // Add disabled style when buttons are disabled
              ((mode === "audio" && isAudioLoading) ||
                (mode === "visual" && isImageLoading)) &&
                styles.disabledButton,
            ]}
            onPress={() => handleAnswer(choice)}
            disabled={
              selectedAnswer !== null ||
              (mode === "audio" && isAudioLoading) ||
              (mode === "visual" && isImageLoading)
            }
          >
            <ThemedText
              style={[
                styles.answerButtonText,
                ((mode === "audio" && isAudioLoading) ||
                  (mode === "visual" && isImageLoading)) &&
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
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
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
  timerContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  timerTextWarning: {
    color: "#F75270",
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
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  answersContainer: {
    gap: 12,
  },
  answerButton: {
    padding: 16,
    backgroundColor: "#7D8597", // Changed to a neutral slate gray
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
    marginTop: 30, // Increase from 20
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
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  timerPlaceholder: {
    width: 40, // Match timer width
  },
  bestScoreText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#FEB21A",
  },
  newRecordContainer: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  newRecordText: {
    color: "white",
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
  crystalRewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: 'rgba(153, 68, 221, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 15,
  },
  crystalRewardText: {
    color: "#4C8BF5",
    fontWeight: "bold",
    fontSize: 18,
  },
  crystalDailyText: {
    marginTop: 6,
    fontSize: 14,
    color: "#888",
  },
  disabledButton: {
    backgroundColor: "#7D8597AA", // Add transparency to indicate disabled state
    opacity: 0.7,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
});
