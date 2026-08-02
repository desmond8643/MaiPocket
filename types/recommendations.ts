/** Stored skill tier from onboarding / recommendations level picker */
export type SkillCeilingOptionId =
  | "expert_upto_11p"
  | "expert_upto_12"
  | "expert_upto_13"
  | "expert_upto_13p"
  | "master_upto_14"
  | "master_upto_14p";

export interface SkillCeilingSpec {
  maxExpertRank: number;
  includeMaster: boolean;
  maxMasterRank: number;
}

export interface RecommendationProfileV1 {
  version: 1;
  skillCeilingOptionId: SkillCeilingOptionId | null;
  tagCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  bpmBucketCounts: Record<string, number>;
}

export const DEFAULT_RECOMMENDATION_PROFILE: RecommendationProfileV1 = {
  version: 1,
  skillCeilingOptionId: null,
  tagCounts: {},
  categoryCounts: {},
  bpmBucketCounts: {},
};
