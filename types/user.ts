export interface User {
  username: string;
  _id: string;
  displayName: string;
  emailAddress: string;
  exp: number;
  role: string;
  isPro: boolean;
  crystals: number;
  lastLogin: Date;
  daysCheckedIn: number;
  currentAvatar: string;
  unlockedAvatars: string[];
}
