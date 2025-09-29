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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthAPI, getQuizQuestions, submitScore } from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { QuizQuestion } from "@/types/quiz";
import { User } from "@/types/user"; // Import your User type

export default function GamePlayScreen() {
  const { mode } = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds per question
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleGameOver = async (completed = false, finalScore = score) => {
    setGameOver(true);

    // Update local scores
    try {
      const savedScoresStr = await AsyncStorage.getItem("songQuizScores");
      const savedScores = savedScoresStr
        ? JSON.parse(savedScoresStr)
        : {
            normal: { highScore: 0, currentStreak: 0 },
            hard: { highScore: 0, currentStreak: 0 },
          };

      const modeKey = mode === "hard" ? "hard" : "normal";

      // Fix: Use the raw score without adding previous streak
      const rawScore = finalScore;

      // Always add current score to streak before potentially resetting
      const updatedStreak = savedScores[modeKey].currentStreak + rawScore;

      // If completed, keep the updated streak
      // Otherwise reset the streak to 0 for next game (after updating the streak)
      const newStreak = completed ? updatedStreak : 0;

      // Update high score
      const newHighScore = Math.max(savedScores[modeKey].highScore, updatedStreak);

      savedScores[modeKey] = {
        highScore: newHighScore,
        currentStreak: newStreak,
      };

      await AsyncStorage.setItem("songQuizScores", JSON.stringify(savedScores));

      const isLoggedIn = await AuthAPI.isLoggedIn();
      // Update server scores if logged in
      if (isLoggedIn) {
        const modeStr = Array.isArray(mode) ? mode[0] : mode;
        // Pass the raw score and new streak separately
        await submitScore(modeStr, rawScore, newStreak);
      }
    } catch (error) {
      console.error("Error saving score:", error);
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
        <ThemedText style={styles.gameOverTitle}>
          {score === questions.length ? "All Perfect" : "You Lose..."}
        </ThemedText>
        <ThemedText style={styles.scoreText}>
          Your Score: {score}/{questions.length}
        </ThemedText>
        <ThemedText style={styles.scoreText}>
          Total Score: {accumulatedScore}
        </ThemedText>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#696FC7" }]}
            onPress={playAgain}
          >
            <ThemedText style={styles.buttonText}>Play Again</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#F75270" }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>Back to Menu</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        {/* <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#696FC7" />
        </TouchableOpacity> */}
        <View></View>
        <View style={styles.progressContainer}>
          <ThemedText style={styles.progressText}>
            Question {currentQuestionIndex + 1}/{questions.length}
          </ThemedText>
          <ThemedText style={styles.scoreText}>
            Score: {score} (Total: {accumulatedScore})
          </ThemedText>
        </View>
        <View style={styles.timerContainer}>
          <ThemedText style={styles.timerText}>{timeLeft}</ThemedText>
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
    borderRadius: 20,
    backgroundColor: "#F75270",
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
    backgroundColor: "#696FC7",
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
});
