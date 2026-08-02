import { jpToRank } from "@/constants/skillCeilingOptions";
import type { SkillCeilingSpec } from "@/types/recommendations";
import type { Chart, Difficulty } from "@/types/chart";

function difficultyUnderCeiling(
  diff: Difficulty,
  spec: SkillCeilingSpec
): boolean {
  const jp = diff.level.jp;
  const rank = jpToRank(jp);
  const t = diff.type;

  // if (t === "basic" || t === "advanced" || t === "expert") {
  //   return rank <= spec.maxExpertRank;
  // }
  if (t === "basic" || t === "advanced") return false;
  if (t === "expert") return rank <= spec.maxExpertRank;
  
  if (t === "master" || t === "remaster") {
    return spec.includeMaster && rank <= spec.maxMasterRank;
  }
  return false;
}

export function chartHasEligibleDifficulty(
  chart: Chart,
  spec: SkillCeilingSpec
): boolean {
  const versions = [chart.deluxe, chart.standard].filter(Boolean);
  for (const v of versions) {
    for (const diff of v!.difficulties || []) {
      if (difficultyUnderCeiling(diff, spec)) return true;
    }
  }
  return false;
}

export interface RepresentativePick {
  version: "standard" | "deluxe";
  difficulty: Difficulty;
  rank: number;
}

/** Hardest difficulty under ceiling (prefer deluxe on tie) for tags / display */
export function getRepresentativeDifficulty(
  chart: Chart,
  spec: SkillCeilingSpec
): RepresentativePick | null {
  let best: RepresentativePick | null = null;

  const consider = (version: "standard" | "deluxe", diff: Difficulty) => {
    if (!difficultyUnderCeiling(diff, spec)) return;
    const rank = jpToRank(diff.level.jp);
    if (
      !best ||
      rank > best.rank ||
      (rank === best.rank && version === "deluxe" && best.version === "standard")
    ) {
      best = { version, difficulty: diff, rank };
    }
  };

  if (chart.standard?.difficulties) {
    for (const d of chart.standard.difficulties) {
      consider("standard", d);
    }
  }
  if (chart.deluxe?.difficulties) {
    for (const d of chart.deluxe.difficulties) {
      consider("deluxe", d);
    }
  }

  return best;
}
