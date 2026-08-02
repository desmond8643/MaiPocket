import { bpmBucket } from "@/lib/recommendations/selectRecommendations";
import { loadRecommendationProfile, saveRecommendationProfile } from "@/lib/recommendations/profileStorage";

const BUMP_TAG = 1;
const BUMP_CATEGORY = 1;
const BUMP_BPM = 1;
const MAX_ENTRIES_PER_MAP = 80;

function trimMap(map: Record<string, number>, maxKeys: number): Record<string, number> {
  const keys = Object.keys(map);
  if (keys.length <= maxKeys) return map;
  keys.sort((a, b) => (map[b] ?? 0) - (map[a] ?? 0));
  const next: Record<string, number> = {};
  for (let i = 0; i < maxKeys; i++) {
    const k = keys[i];
    next[k] = map[k];
  }
  return next;
}

export interface RecordChartViewInput {
  chartId: string;
  category?: string;
  bpm?: number;
  tags: string[];
}

/** Updates local affinity from a chart view (difficulty row). */
export async function recordChartView(input: RecordChartViewInput): Promise<void> {
  const profile = await loadRecommendationProfile();
  const tagCounts = { ...profile.tagCounts };
  for (const tag of input.tags) {
    if (!tag) continue;
    tagCounts[tag] = (tagCounts[tag] ?? 0) + BUMP_TAG;
  }

  const categoryCounts = { ...profile.categoryCounts };
  if (input.category) {
    categoryCounts[input.category] =
      (categoryCounts[input.category] ?? 0) + BUMP_CATEGORY;
  }

  const bpmBucketCounts = { ...profile.bpmBucketCounts };
  const bucket = bpmBucket(input.bpm);
  if (bucket !== "unknown") {
    bpmBucketCounts[bucket] = (bpmBucketCounts[bucket] ?? 0) + BUMP_BPM;
  }

  const next = {
    ...profile,
    tagCounts: trimMap(tagCounts, MAX_ENTRIES_PER_MAP),
    categoryCounts: trimMap(categoryCounts, MAX_ENTRIES_PER_MAP),
    bpmBucketCounts: trimMap(bpmBucketCounts, MAX_ENTRIES_PER_MAP),
  };
  await saveRecommendationProfile(next);
}
