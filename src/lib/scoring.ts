/* =========================================================
   UNICO指数 計算エンジン (指数計算専用。買い目生成とは分離)
   正式配点 (Ver.2.0)。各項目 0-100 を加重平均。
   出走取消・騎手変更・当日馬場などで再計算できるよう純関数で実装。
   ========================================================= */
import type { IndexBreakdown, IndexFactor, PublicIndex } from "./types";

export const INDEX_VERSION = "v2.0";

export const INDEX_WEIGHTS: Record<IndexFactor, number> = {
  ability: 0.2,
  recent: 0.06,
  aptitude: 0.1,
  pace: 0.1,
  workout: 0.1,
  stable: 0.08,
  jockey: 0.15,
  drawWeight: 0.06,
  pedigree: 0.15,
};

export const INDEX_FACTOR_LABELS: Record<IndexFactor, string> = {
  ability: "基礎能力",
  recent: "近走内容",
  aptitude: "コース・距離・馬場適性",
  pace: "展開",
  workout: "追い切り",
  stable: "陣営AI",
  jockey: "騎手",
  drawWeight: "枠順・斤量",
  pedigree: "血統",
};

/** 表示順 (配点の大きい順) */
export const INDEX_FACTOR_ORDER: IndexFactor[] = [
  "ability",
  "jockey",
  "pedigree",
  "aptitude",
  "pace",
  "workout",
  "stable",
  "recent",
  "drawWeight",
];

export function computeUnicoIndex(b: IndexBreakdown): number {
  let total = 0;
  for (const k of Object.keys(INDEX_WEIGHTS) as IndexFactor[]) {
    total += clamp(b[k], 0, 100) * INDEX_WEIGHTS[k];
  }
  return Math.round(total * 10) / 10;
}

/** 出走取消馬を除外して順位付け */
export function rankIndex(
  rows: { horseId: string; breakdown: IndexBreakdown; scratched?: boolean }[],
): PublicIndex[] {
  const scored = rows
    .filter((r) => !r.scratched)
    .map((r) => ({ horseId: r.horseId, score: computeUnicoIndex(r.breakdown) }))
    .sort((a, b) => b.score - a.score);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// 重みの合計が 1.0 であることを保証
const sum = Object.values(INDEX_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(sum - 1) > 1e-9) {
  throw new Error(`UNICO index weights must sum to 1.0 (got ${sum})`);
}
