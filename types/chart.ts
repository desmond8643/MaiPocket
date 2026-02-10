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
  movingTrillAnalysis?: MovingTrillAnalysis | null;
  spinAnalysis?: SpinAnalysis | null;
  jackAnalysis?: JackAnalysis | null;
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

// Moving Trill pattern types
export interface MovingTrillDetail {
  length: number;
  positions: number[];
  uniquePositions: number[];
  bpm: number;
  effectiveDivision: number;
  timestamp: string;
  startTimeMs: number;
  trillLengthMs: number;
  notesPerSecond: number;
}

export interface DifficultyMovingTrillAnalysis {
  version: "standard" | "deluxe";
  type: string;
  level: number;
  trillCount: number;
  longestTrill: number;
  fastestSpeed: number;
  fastestDivision: number;
  fastestBpm: number;
  trills: MovingTrillDetail[];
}

export interface MovingTrillAnalysis {
  hasMovingTrills: boolean;
  difficulties: DifficultyMovingTrillAnalysis[];
}

// Processed chart with moving trill data for list display
export interface MovingTrillChartItem {
  _id: string;
  title: string;
  image: string;
  artist?: string;
  difficulties: DifficultyMovingTrillAnalysis[];
  maxTrillLength: number;
  maxSpeed: number;
  totalTrillCount: number;
  highestLevel: number;
  fastestDivision: number;
  fastestBpm: number;
}

// Spin pattern types
export interface SpinDetail {
  length: number;
  positions: number[];
  direction: "cw" | "ccw"; // clockwise or counter-clockwise
  rotations: number;
  bpm: number;
  effectiveDivision: number;
  timestamp: string;
  startTimeMs: number;
  spinLengthMs: number;
  notesPerSecond: number;
}

export interface DifficultySpinAnalysis {
  version: "standard" | "deluxe";
  type: string;
  level: number;
  spinCount: number;
  longestSpin: number;
  longestRotations: number;
  fastestSpeed: number;
  fastestDivision: number;
  fastestBpm: number;
  spins: SpinDetail[];
}

export interface SpinAnalysis {
  hasSpins: boolean;
  difficulties: DifficultySpinAnalysis[];
}

// Processed chart with spin data for list display
export interface SpinChartItem {
  _id: string;
  title: string;
  image: string;
  artist?: string;
  difficulties: DifficultySpinAnalysis[];
  maxSpinLength: number;
  maxRotations: number;
  maxSpeed: number;
  totalSpinCount: number;
  highestLevel: number;
  fastestDivision: number;
  fastestBpm: number;
}

// Jack pattern types (single-button trills)
export interface JackDetail {
  length: number;
  position: number; // Single position (1-8)
  bpm: number;
  effectiveDivision: number;
  timestamp: string;
  startTimeMs: number;
  jackLengthMs: number;
  notesPerSecond: number;
}

export interface DifficultyJackAnalysis {
  version: "standard" | "deluxe";
  type: string;
  level: number;
  jackCount: number;
  longestJack: number;
  fastestSpeed: number;
  fastestDivision: number;
  fastestBpm: number;
  jacks: JackDetail[];
}

export interface JackAnalysis {
  hasJacks: boolean;
  difficulties: DifficultyJackAnalysis[];
}

// Processed chart with jack data for list display
export interface JackChartItem {
  _id: string;
  title: string;
  image: string;
  artist?: string;
  difficulties: DifficultyJackAnalysis[];
  maxJackLength: number;
  maxSpeed: number;
  totalJackCount: number;
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
