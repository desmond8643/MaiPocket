export interface Difficulty {
  type: "basic" | "advanced" | "expert" | "master" | "remaster";
  level: {
    jp: number;
    international: number;
  };
  charter?: string;
  noteCount?: number;
  simai?: string
}

export interface ChartVersionDetails {
  versionReleased: string;
  difficulties: Difficulty[];
}

export interface Chart {
  _id: string;
  image: string;
  title: string;
  artist?: string;
  category?: string;
  releasedDate?: Date;
  bpm?: number;
  standard?: ChartVersionDetails | null;
  deluxe?: ChartVersionDetails | null;
  trillAnalysis?: TrillAnalysis | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Trill pattern types
export interface TrillDetail {
  length: number;
  positions: number[];
  bpm: number;
  effectiveDivision: number;
  timestamp: string;
  startTimeMs: number;
  trillLengthMs: number;
  notesPerSecond: number;
}

export interface DifficultyTrillAnalysis {
  version: "standard" | "deluxe";
  type: string;
  level: number;
  trillCount: number;
  longestTrill: number;
  fastestSpeed: number;
  fastestDivision: number;
  fastestBpm: number;
  trills: TrillDetail[];
}

export interface TrillAnalysis {
  hasTrills: boolean;
  difficulties: DifficultyTrillAnalysis[];
}

// Processed chart with trill data for list display
export interface TrillChartItem {
  _id: string;
  title: string;
  image: string;
  artist?: string;
  difficulties: DifficultyTrillAnalysis[];
  maxTrillLength: number;
  maxSpeed: number;
  totalTrillCount: number;
  highestLevel: number;
  fastestDivision: number;
  fastestBpm: number;
}

export interface Post {
  id: string;
  image?: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
  content: string;
  tags?: string[];
  likes: string[];
  anonymous: boolean;
  createdAt: string;
  updatedAt: string;
}
