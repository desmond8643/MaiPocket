import { Chart } from "@/types/chart";

export const DIFF_PARAM = {
  basic: 0,
  advanced: 1,
  expert: 2,
  master: 3,
  remaster: 4,
} as const;

export type SongJump = {
  title: string;
  wantDx: boolean;
  category: string;
  diff: number;
};

export function hasDiff(
  chart: Chart,
  version: "deluxe" | "standard",
  type: string
) {
  return !!chart[version]?.difficulties?.some((d) => d.type === type);
}

export function genreIdFromCategory(category: string): number {
  const s = (category || "").normalize("NFKC").toLowerCase();
  if (!s) return 99;
  if (s.includes("pops") || s.includes("アニメ")) return 101;
  if (
    s.includes("niconico") ||
    s.includes("vocaloid") ||
    s.includes("ボーカロイド")
  ) {
    return 102;
  }
  if (s.includes("東方") || s.includes("touhou")) return 103;
  if (s.includes("ゲーム") || s.includes("variety") || s.includes("バラエテ")) {
    return 104;
  }
  if (s.includes("ongeki") || s.includes("chunithm") || s.includes("オンゲキ")) {
    return 106;
  }
  if (s.includes("maimai")) return 105;
  return 99;
}

export function genreSearchUrl(origin: string, diff: number, genre = 99) {
  return `${origin}/maimai-mobile/record/musicGenre/search/?genre=${genre}&diff=${diff}`;
}

export function isOnGenreSearchPage(
  url: string,
  diff: number,
  genre = 99
) {
  return (
    url.includes("musicGenre/search/") &&
    url.includes(`genre=${genre}`) &&
    url.includes(`diff=${diff}`)
  );
}

export function findSongScript(jump: SongJump) {
  return `
    (function() {
      var wantTitle = ${JSON.stringify(jump.title)}.normalize("NFKC").replace(/\\s+/g, " ").trim();
      var wantDx = ${jump.wantDx};
      var wantGenre = ${JSON.stringify(jump.category || "")};
      var attempts = 0;
      var maxAttempts = 40;
      var lastCount = -1;
      var stableTicks = 0;

      function norm(s) {
        return (s || "").normalize("NFKC").replace(/\\s+/g, " ").trim();
      }

      function scoreRow(el) {
        return el.closest(".w_450.m_15.p_r.f_0");
      }

      function isDxRow(row) {
        if (!row) return true;
        if (row.id && row.id.indexOf("sta_") >= 0) return false;
        var kind = row.children[1];
        var src = (kind && (kind.src || kind.getAttribute("src"))) || "";
        if (src.indexOf("_standard") >= 0) return false;
        if (src.indexOf("music_dx") >= 0) return true;
        return true;
      }

      function genreOf(row) {
        var p = row;
        while (p) {
          var s = p.previousElementSibling;
          while (s) {
            if (s.classList && s.classList.contains("screw_block")) {
              return (s.textContent || "").trim();
            }
            s = s.previousElementSibling;
          }
          p = p.parentElement;
        }
        return "";
      }

      function search() {
        var blocks = document.querySelectorAll(".music_name_block");
        var hits = [];
        blocks.forEach(function(block) {
          var title = norm(block.innerText || block.textContent);
          if (title !== wantTitle) return;
          var row = scoreRow(block);
          if (!row) return;
          if (isDxRow(row) !== wantDx) return;
          hits.push(row);
        });

        if (hits.length > 1 && wantGenre) {
          var byGenre = hits.filter(function(c) { return genreOf(c) === wantGenre; });
          if (byGenre.length) hits = byGenre;
        }

        if (!hits.length) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "SONG_NOT_FOUND" }));
          return;
        }

        var match = hits[0];
        match.style.outline = "3px solid #FFD700";
        match.scrollIntoView({ behavior: "smooth", block: "center" });
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "SONG_FOUND" }));
      }

      function tryFind() {
        attempts++;
        var count = document.querySelectorAll(".music_name_block").length;
        if (count === 0 || count !== lastCount) {
          lastCount = count;
          stableTicks = 0;
          if (attempts < maxAttempts) {
            setTimeout(tryFind, 250);
            return;
          }
        } else {
          stableTicks++;
          if (stableTicks < 2 && attempts < maxAttempts) {
            setTimeout(tryFind, 250);
            return;
          }
        }
        search();
      }

      tryFind();
    })();
    true;
  `;
}
