import type { SkillCeilingOptionId, SkillCeilingSpec } from "@/types/recommendations";

/** Internal ordering: matches list.tsx level string logic (integer vs X+) */
export function jpToRank(jp: number): number {
  const base = Math.floor(jp);
  const fracRounded = Math.round((jp % 1) * 100) / 100;
  const plus = fracRounded >= 0.6 ? 1 : 0;
  return base * 2 + plus;
}

const RANK = {
  /** Expert 11+ (JP + charts use .6) */
  expert11p: jpToRank(11.6),
  /** Expert 12 (not 12+) */
  expert12: 12 * 2,
  /** Expert 13 (not 13+) */
  expert13: 13 * 2,
  /** Expert 13+ */
  expert13p: jpToRank(13.6),
  master14: 14 * 2,
  master14p: jpToRank(14.6),
} as const;

const NO_MASTER_CAP = 9999;

export const SKILL_CEILING_BY_OPTION: Record<
  SkillCeilingOptionId,
  SkillCeilingSpec
> = {
  expert_upto_11p: {
    maxExpertRank: RANK.expert11p,
    includeMaster: false,
    maxMasterRank: 0,
  },
  expert_upto_12: {
    maxExpertRank: RANK.expert12,
    includeMaster: true,
    maxMasterRank: RANK.expert12,
  },
  expert_upto_13: {
    maxExpertRank: RANK.expert13,
    includeMaster: true,
    maxMasterRank: RANK.expert13,
  },
  expert_upto_13p: {
    maxExpertRank: RANK.expert13p,
    includeMaster: true,
    maxMasterRank: RANK.expert13p,
  },
  master_upto_14: {
    maxExpertRank: NO_MASTER_CAP,
    includeMaster: true,
    maxMasterRank: RANK.master14,
  },
  master_upto_14p: {
    maxExpertRank: NO_MASTER_CAP,
    includeMaster: true,
    maxMasterRank: RANK.master14p,
  },
};

export const SKILL_CEILING_OPTION_ORDER: SkillCeilingOptionId[] = [
  "expert_upto_11p",
  "expert_upto_12",
  "expert_upto_13",
  "expert_upto_13p",
  "master_upto_14",
  "master_upto_14p",
];
