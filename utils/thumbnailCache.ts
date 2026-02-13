import AsyncStorage from "@react-native-async-storage/async-storage";

const THUMBNAIL_CACHE_KEY = "thumbnail_cache";

export type ThumbnailData = { image: string; id: string };

export const ThumbnailCache = {
  // Get cached thumbnails
  async get(): Promise<Record<string, ThumbnailData>> {
    try {
      const data = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  // Save thumbnails to cache (merges with existing)
  async save(thumbnails: Record<string, ThumbnailData>): Promise<void> {
    try {
      const existing = await this.get();
      const merged = { ...existing, ...thumbnails };
      await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(merged));
    } catch (error) {
      console.error("Error saving thumbnail cache:", error);
    }
  },

  // Clear all cached thumbnails
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(THUMBNAIL_CACHE_KEY);
  },

  // Get cache size (approximate KB)
  async getSize(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
      return data ? Math.round(data.length / 1024) : 0;
    } catch {
      return 0;
    }
  },

  // Get count of cached thumbnails
  async getCount(): Promise<number> {
    try {
      const data = await this.get();
      return Object.keys(data).length;
    } catch {
      return 0;
    }
  },
};
