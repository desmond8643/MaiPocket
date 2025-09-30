import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useLocalSearchParams, router } from "expo-router";
import React, { useState, useEffect } from "react";
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
import { AuthAPI, getQuizQuestions, submitScore } from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { QuizQuestion } from "@/types/game";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { preloadInterstitialAd, showInterstitialAd } from "@/components/InterstitialAdComponent";
import { useShowAds } from "@/hooks/useShowAds";

// import { User } from "@/types/user"; // Import your User type
// const [user, setUser] = useState<User | null>(null);
// const [isLoading, setIsLoading] = useState(true);

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
  const insets = useSafeAreaInsets();
  const { showAds } = useShowAds(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (loading || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, gameOver, currentQuestionIndex]);

  useEffect(() => {
    if (showAds) {
      preloadInterstitialAd();
    }
  }, [showAds]);

  const loadQuestions = async () => {
    try {
      const modeStr = Array.isArray(mode) ? mode[0] : mode;
      const quizData = await getQuizQuestions(modeStr);
      setQuestions(quizData);

      // Load saved scores to get the current streak
      const savedScoresStr = await AsyncStorage.getItem("songQuizScores");
      const savedScores = savedScoresStr
        ? JSON.parse(savedScoresStr)
        : {
            normal: { highScore: 0, currentStreak: 0 },
            hard: { highScore: 0, currentStreak: 0 },
          };
      const modeKey = modeStr === "hard" ? "hard" : "normal";
      const currentStreak = savedScores[modeKey].currentStreak || 0;
      setAccumulatedScore(currentStreak);

      setLoading(false);
      setTimeLeft(15);
    } catch (error) {
      console.error("Error loading questions:", error);
      Alert.alert("Error", "Failed to load quiz questions. Please try again.");
      router.back();
    }
  };

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedAnswer(answer);

    setTimeout(() => {
      if (answer === currentQuestion.correctAnswer) {
        handleCorrectAnswer();
      } else {
        // Vibrate when answer is wrong
        Vibration.vibrate(300);
        handleGameOver();
      }
    }, 1000);
  };

  const handleCorrectAnswer = () => {
    const newScore = score + 1;
    setScore(newScore);
    setAccumulatedScore(accumulatedScore + 1);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(15);
      setSelectedAnswer(null);
    } else {
      // Pass the correct score to handleGameOver
      handleGameOver(true, newScore);
    }
  };

  const updateScores = async (completed = false, finalScore = score) => {
    // Update local scores
    try {
      const savedScoresStr = await AsyncStorage.getItem("songQuizScores");
      const savedScores = savedScoresStr
        ? JSON.parse(savedScoresStr)
        : {
            normal: { highScore: 0, currentStreak: 0 },
            hard: { highScore: 0, currentStreak: 0 },
          };

      const modeStr = Array.isArray(mode) ? mode[0] : mode;
      const modeKey = modeStr === "hard" ? "hard" : "normal";

      // Fix: Use the raw score without adding previous streak
      const rawScore = finalScore;

      // Always add current score to streak before potentially resetting
      const updatedStreak = savedScores[modeKey].currentStreak + rawScore;

      // If completed, keep the updated streak
      // Otherwise reset the streak to 0 for next game (after updating the streak)
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

      await AsyncStorage.setItem("songQuizScores", JSON.stringify(savedScores));

      const isLoggedIn = await AuthAPI.isLoggedIn();
      // Update server scores if logged in
      // if (isLoggedIn) {
      //   const modeStr = Array.isArray(mode) ? mode[0] : mode;
      //   // Pass the raw score and new streak separately
      //   await submitScore(modeStr, rawScore, newStreak);
      // }
      if (isLoggedIn) {
        const modeStr = Array.isArray(mode) ? mode[0] : mode;
        // Send both the accumulated streak (for high score) and new streak (for next game)
        await submitScore(modeStr, rawScore, updatedStreak, newStreak);
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const handleGameOver = async (completed = false, finalScore = score) => {
    if (showAds) {
      showInterstitialAd(() => {
        setGameOver(true);
        updateScores(completed, finalScore);
      });
    } else {
      setGameOver(true);
      updateScores(completed, finalScore);
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
        <ThemedText style={[
          styles.gameOverTitle,
          { color: score === questions.length ? "#ED3F27" : "#696FC7" }
        ]}>
          {score === questions.length ? "All Perfect" : "You Lose..."}
        </ThemedText>
        <ThemedText style={styles.scoreText}>
          Your Score: {score}/{questions.length}
        </ThemedText>
        <ThemedText style={styles.scoreText}>
          Current Streak 🔥: {accumulatedScore}
        </ThemedText>
        <ThemedText style={[styles.scoreText, styles.bestScoreText]}>
          Best Score: {bestScore} {isNewRecord && <ThemedText style={{color: '#4CAF50'}}>(New Record!)</ThemedText>}
        </ThemedText>

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
          <ThemedText style={[
            styles.timerText,
            timeLeft <= 5 && styles.timerTextWarning
          ]}>
            {timeLeft}
          </ThemedText>
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Image
          source={{ uri: currentQuestion.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="contain"
        />
        {/* <ThemedText style={styles.questionText}>What is this song?</ThemedText> */}
      </View>

      <View style={styles.answersContainer}>
        {currentQuestion.choices.map((choice: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              selectedAnswer === choice &&
                (choice === currentQuestion.correctAnswer
                  ? styles.correctAnswer
                  : styles.wrongAnswer),
            ]}
            onPress={() => handleAnswer(choice)}
            disabled={selectedAnswer !== null}
          >
            <ThemedText style={styles.answerButtonText}>{choice}</ThemedText>
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
});
