/* =========================================================
   無料ワイド予想 生成 (買い目生成層。指数計算とは分離)
   無料版は印 (◎○▲△☆) を出さない。
   ========================================================= */
import type { Entry, FreeWidePick, IndexBreakdown, PublicIndex } from "../types";
import { INDEX_FACTOR_LABELS } from "../scoring";

export function buildFreeWide(
  entries: Entry[],
  index: PublicIndex[],
  breakdowns: Record<string, IndexBreakdown>,
): FreeWidePick | null {
  if (index.length < 5) return null;
  // 上位指数の差が小さい (混戦) なら4頭BOX、そうでなければ3頭BOX
  const gap = index[0].score - index[3].score;
  const type: FreeWidePick["type"] = gap < 4 ? "box4" : "box3";
  const n = type === "box4" ? 4 : 3;
  const horses = index.slice(0, n).map((ix) => {
    const e = entries.find((x) => x.horseId === ix.horseId)!;
    return { horseNo: e.horseNo, name: e.name, reason: reasonFor(breakdowns[ix.horseId]) };
  });
  horses.sort((a, b) => a.horseNo - b.horseNo);
  return { type, horses, points: n === 4 ? 6 : 3 };
}

function reasonFor(b: IndexBreakdown): string {
  const top = (Object.entries(b) as [keyof IndexBreakdown, number][])
    .sort((x, y) => y[1] - x[1])
    .slice(0, 2)
    .map(([k]) => INDEX_FACTOR_LABELS[k]);
  return `${top[0]}と${top[1]}の評価が高い`;
}
