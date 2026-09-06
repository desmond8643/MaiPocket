import { Chart } from "@/types/chart";

function chartersOf(chart: Chart): string[] {
    return [
        ...(chart.standard?.difficulties ?? []),
        ...(chart.deluxe?.difficulties ?? []),
    ]
        .map((d) => d.charter)
        .filter((c): c is string => !!c);
}

export function chartMatchesQuery(chart: Chart, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (chart.title.toLowerCase().includes(q)) return true;
    if (chart.artist?.toLowerCase().includes(q)) return true;
    return chartersOf(chart).some((c) => c.toLowerCase().includes(q));
}

// export function matchingCharter(chart: Chart, query: string): string | null {
//   const q = query.trim().toLowerCase();
//   if (!q) return null;
//   if (chart.title.toLowerCase().includes(q)) return null;
//   if (chart.artist?.toLowerCase().includes(q)) return null;
//   return chartersOf(chart).find((c) => c.toLowerCase().includes(q)) ?? null;
// }
export function matchingCharters(chart: Chart, query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    if (chart.title.toLowerCase().includes(q)) return [];
    if (chart.artist?.toLowerCase().includes(q)) return [];

    const hits: { name: string; type: string; version: "standard" | "deluxe" }[] = [];
    for (const version of ["standard", "deluxe"] as const) {
        for (const d of chart[version]?.difficulties ?? []) {
            if (d.charter?.toLowerCase().includes(q)) {
                hits.push({ name: d.charter, type: d.type, version });
            }
        }
    }
    return hits;
}