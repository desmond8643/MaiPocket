export interface QuizQuestion {
  id: string;
  thumbnailUrl: string;
  choices: string[];
  correctAnswer: string;
  questionType: 'thumbnail' | 'screenshot'; // Type is now required
}

export interface UserScore {
  id: string;
  userId: string;
  username: string;
  mode: 'visual' | 'audio'; // Updated mode types
  highScore: number;
  currentStreak: number;
  lastPlayed: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  highScore: number;
  avatarUrl?: string;
  displayName: string
} 