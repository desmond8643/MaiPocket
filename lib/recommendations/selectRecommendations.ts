import type {
  RecommendationProfileV1,
  SkillCeilingSpec,
} from "@/types/recommendations";
import type { Chart } from "@/types/chart";
import {
  chartHasEligibleDifficulty,
  getRepresentativeDifficulty,
} from "./eligibility";

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bpmBucket(bpm: number | undefined): string {
  if (bpm == null || Number.isNaN(bpm)) return "unknown";
  return `${Math.floor(bpm / 10) * 10}`;
}

function affinityScore(
  chart: Chart,
  tags: string[],
  profile: RecommendationProfileV1
): number {
  let s = 0;
  for (const tag of tags) {
    s += profile.tagCounts[tag] ?? 0;
  }
  const cat = chart.category ?? "";
  if (cat) s += (profile.categoryCounts[cat] ?? 0) * 2;
  const bucket = bpmBucket(chart.bpm);
  if (bucket !== "unknown") {
    s += profile.bpmBucketCounts[bucket] ?? 0;
  }
  return s;
}

export interface SelectRecommendationsOptions {
  count?: number;
  seed: number;
  explorationWeight?: number;
}

/**
 * Picks charts under skill ceiling; blends affinity (tags/category/BPM) with exploration.
 */
export function selectRecommendations(
  charts: Chart[],
  spec: SkillCeilingSpec,
  profile: RecommendationProfileV1,
  options: SelectRecommendationsOptions
): Chart[] {
  const count = options.count ?? 20;
  const explorationWeight = options.explorationWeight ?? 6;
  const rng = mulberry32(options.seed);

  const eligible = charts.filter((c) => chartHasEligibleDifficulty(c, spec));
  if (eligible.length === 0) return [];

  const scored = eligible.map((chart) => {
    const rep = getRepresentativeDifficulty(chart, spec);
    const tags = rep?.difficulty.tags ?? [];
    const base = affinityScore(chart, tags, profile);
    const noise = rng() * explorationWeight;
    return { chart, key: base + noise };
  });

  scored.sort((a, b) => b.key - a.key);

  const out: Chart[] = [];
  const seen = new Set<string>();
  for (const row of scored) {
    if (out.length >= count) break;
    if (seen.has(row.chart._id)) continue;
    seen.add(row.chart._id);
    out.push(row.chart);
  }

  // If still short (many dupes — shouldn't happen), fill randomly
  if (out.length < count) {
    const rng2 = mulberry32(options.seed + 7919);
    const pool = eligible.filter((c) => !seen.has(c._id));
    while (out.length < count && pool.length > 0) {
      const i = Math.floor(rng2() * pool.length);
      const c = pool.splice(i, 1)[0];
      out.push(c);
    }
  }

  return out;
}
