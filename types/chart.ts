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
  createdAt?: Date;
  updatedAt?: Date;
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
