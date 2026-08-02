import {
  INTRO_ONBOARDING_DISMISSED_KEY,
  RECOMMENDATION_PROFILE_KEY,
} from "@/constants/recommendationStorageKeys";
import type {
  RecommendationProfileV1,
  SkillCeilingOptionId,
} from "@/types/recommendations";
import { DEFAULT_RECOMMENDATION_PROFILE } from "@/types/recommendations";
import AsyncStorage from "@react-native-async-storage/async-storage";

function normalizeProfile(raw: unknown): RecommendationProfileV1 {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_RECOMMENDATION_PROFILE };
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return { ...DEFAULT_RECOMMENDATION_PROFILE };
  return {
    version: 1,
    skillCeilingOptionId: (o.skillCeilingOptionId as SkillCeilingOptionId | null) ?? null,
    tagCounts: { ...(typeof o.tagCounts === "object" && o.tagCounts ? o.tagCounts : {}) } as Record<
      string,
      number
    >,
    categoryCounts: {
      ...(typeof o.categoryCounts === "object" && o.categoryCounts
        ? o.categoryCounts
        : {}),
    } as Record<string, number>,
    bpmBucketCounts: {
      ...(typeof o.bpmBucketCounts === "object" && o.bpmBucketCounts
        ? o.bpmBucketCounts
        : {}),
    } as Record<string, number>,
  };
}

export async function loadRecommendationProfile(): Promise<RecommendationProfileV1> {
  try {
    const raw = await AsyncStorage.getItem(RECOMMENDATION_PROFILE_KEY);
    if (!raw) return { ...DEFAULT_RECOMMENDATION_PROFILE };
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_RECOMMENDATION_PROFILE };
  }
}

export async function saveRecommendationProfile(
  profile: RecommendationProfileV1
): Promise<void> {
  await AsyncStorage.setItem(RECOMMENDATION_PROFILE_KEY, JSON.stringify(profile));
}

export async function setSkillCeilingOption(
  optionId: SkillCeilingOptionId
): Promise<RecommendationProfileV1> {
  const current = await loadRecommendationProfile();
  const next: RecommendationProfileV1 = {
    ...current,
    skillCeilingOptionId: optionId,
  };
  await saveRecommendationProfile(next);
  return next;
}

export async function loadIntroOnboardingDismissed(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(INTRO_ONBOARDING_DISMISSED_KEY);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

export async function setIntroOnboardingDismissed(): Promise<void> {
  await AsyncStorage.setItem(INTRO_ONBOARDING_DISMISSED_KEY, "1");
}
