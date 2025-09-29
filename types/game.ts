export interface QuizQuestion {
  id: string;
  thumbnailUrl: string;
  choices: string[];
  correctAnswer: string;
}

export interface UserScore {
  id: string;
  userId: string;
  username: string;
  mode: 'normal' | 'hard';
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
} 