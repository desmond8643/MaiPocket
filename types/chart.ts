export interface Difficulty {
    type: 'basic' | 'advanced' | 'expert' | 'master' | 'remaster';
    level: number;
    charter?: string;
    noteCount?: number;
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