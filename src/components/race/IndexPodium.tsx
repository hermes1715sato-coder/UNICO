import clsx from "clsx";
import type { Entry, PublicIndex } from "@/lib/types";
import { HorseshoeGauge } from "@/components/brand/HorseshoeGauge";
import { HorseNoBox } from "./parts";

/**
 * 指数上位3頭 (無料の総合UNICO指数のみ)。
 * 蹄鉄ゲージで指数の大きさを示す。勝率ではない。
 * スマホ: 1位を横長カード + 2・3位を2列 / PC: 3列
 */
export function IndexPodium({ entries, index }: { entries: Entry[]; index: PublicIndex[] }) {
  const byId = new Map(entries.map((e) => [e.horseId, e]));
  const top = [...index]
    .sort((a, b) => a.rank - b.rank)
    .map((i) => ({ idx: i, entry: byId.get(i.horseId) }))
    .filter((r): r is { idx: PublicIndex; entry: Entry } => !!r.entry && !r.entry.scratched)
    .slice(0, 3);
  if (top.length === 0) return null;
  const best = top[0].idx.score;

  return (
    <ol aria-label="UNICO指数 上位3頭" className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.18fr_1fr_1fr] sm:gap-3">
      {top.map(({ idx, entry: e }) => {
        const first = idx.rank === 1;
        const gap = Math.round((best - idx.score) * 10) / 10;
        return (
          <li
            key={e.horseId}
            className={clsx(
              "edge-silver relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]",
              first && "edge-gold col-span-2 sm:col-span-1",
            )}
          >
            <div
              className={clsx(
                "flex h-full sm:justify-between",
                first ? "items-center gap-3 p-3.5 sm:flex-col sm:items-stretch sm:gap-0 sm:p-4" : "flex-col p-3 sm:p-4",
              )}
            >
              {/* 順位 (枠なし細数字) + 差 */}
              <div className={clsx("flex items-start justify-between", first && "sm:w-full max-sm:hidden")}>
                <PodiumRank rank={idx.rank} />
                <span className="num pt-1 text-[11.5px] text-ink-2">
                  {first ? (
                    <span className="font-semibold tracking-[0.14em] text-[#8a7650]">TOP</span>
                  ) : (
                    <>
                      1位差 <span className="text-ink">−{gap.toFixed(1)}</span>
                    </>
                  )}
                </span>
              </div>

              <div className={clsx("flex justify-center", first ? "sm:-mt-1" : "-mt-1")}>
                <Gauge score={idx.score} first={first} />
              </div>

              <div className={clsx("min-w-0", first ? "flex-1 sm:mt-1" : "mt-0.5")}>
                {first && (
                  <div className="mb-2 flex items-center justify-between sm:hidden">
                    <PodiumRank rank={1} />
                    <span className="num text-[11px] font-semibold tracking-[0.14em] text-[#8a7650]">TOP</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <HorseNoBox no={e.horseNo} frame={e.frame} size={first ? "lg" : "md"} plate />
                  <div className="min-w-0">
                    <p className={clsx("font-bold leading-tight text-ink", first ? "text-[16px] sm:text-[17px]" : "text-[14px] sm:text-[14.5px]")}>
                      {e.name}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] leading-snug text-ink-2">
                      {e.jockey}
                      <span className="mx-1 text-silver" aria-hidden>
                        ·
                      </span>
                      {e.sex}
                      <span className="num">{e.age}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 蹄鉄ゲージ + 中央の指数値。値はコンテナ幅に比例 (cqw) させ、蹄鉄の脚と重ならない大きさに抑える。
 */
function Gauge({ score, first }: { score: number; first: boolean }) {
  return (
    <span
      className={clsx(
        "@container relative inline-block",
        first ? "size-[112px] sm:size-[128px] lg:size-[136px]" : "size-[92px] sm:size-[104px] lg:size-[112px]",
      )}
    >
      <HorseshoeGauge score={score} highlight={first} showValue={false} size={100} className="size-full" />
      <span className="absolute inset-x-0 top-[30%] flex flex-col items-center leading-none" aria-hidden>
        <span className={clsx("num text-[17cqw] tracking-[-0.04em] text-ink", first ? "font-bold" : "font-semibold")}>
          {score.toFixed(1)}
        </span>
        <span className="num mt-[5cqw] text-[11px] font-semibold tracking-[0.2em] text-accent-silver">UNICO</span>
      </span>
    </span>
  );
}

function PodiumRank({ rank }: { rank: number }) {
  return (
    <span className="inline-flex items-baseline gap-1" aria-label={`指数${rank}位`}>
      <span className="num text-[30px] font-extralight leading-none tracking-[-0.06em] text-ink">{rank}</span>
      <span className="text-[11px] font-medium leading-none text-ink-2">位</span>
      <span className="num ml-1 text-[11px] font-semibold tracking-[0.16em] text-accent-silver">
        {rank === 1 ? "1ST" : rank === 2 ? "2ND" : "3RD"}
      </span>
    </span>
  );
}
