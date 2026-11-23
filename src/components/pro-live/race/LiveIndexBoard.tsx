import clsx from "clsx";
import { Info } from "lucide-react";
import type { HorseProDetail, PaddockGrade, ProRaceAnalysis } from "@/lib/pro/types";
import { SectionHeading } from "@/components/ui";
import { HorseNoBox } from "@/components/race/parts";
import { deltaClass, jstHM, signed } from "./format";

/** 02 当日補正 UNICO指数 (前日 → 当日) */
export function LiveIndexBoard({ a }: { a: ProRaceAnalysis }) {
  const { phase } = a;
  const wAt = jstHM(phase.weightsAnnouncedAt);
  const pAt = jstHM(phase.paddockAt);
  const pending = !phase.weightsAnnounced;
  return (
    <section aria-labelledby="pro-live-index-title">
      <SectionHeading id="pro-live-index-title" index="02" en="LIVE UNICO INDEX" title="当日補正 UNICO指数" pro />
      <div className="edge-silver edge-gold overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="border-b border-line px-4 py-2.5 text-[12.5px] leading-relaxed text-ink-2">
          前日時点の指数に、当日の馬場・馬体重・パドック評価を反映した補正値です。並びは当日補正後の指数順。
          {!phase.weightsAnnounced && (
            <p className="mt-1.5 flex items-start gap-1.5 rounded-[8px] bg-info-bg px-2.5 py-1.5 text-[12.5px] text-info">
              <Info size={14} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden />
              <span>
                馬体重は <span className="num font-semibold">{wAt}</span> 頃、パドック評価は <span className="num font-semibold">{pAt}</span>{" "}
                頃に反映予定です。現在は前日時点の指数を表示しています。
              </span>
            </p>
          )}
        </div>

        {/* PC: テーブル */}
        <table className="hidden w-full border-collapse text-left md:table">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold text-ink-2">
              <th scope="col" className="py-2 pr-2 pl-4 font-semibold">順位</th>
              <th scope="col" className="px-2 py-2 font-semibold">馬</th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">前日</th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">当日補正</th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">馬体重</th>
              <th scope="col" className="py-2 pr-4 pl-2 text-center font-semibold">パドック</th>
            </tr>
          </thead>
          <tbody>
            {a.horses.map((h) => (
              <tr key={h.horseNo} className={clsx("border-b border-line last:border-b-0", h.scratched && "bg-surface-2/60 text-ink-2")}>
                <td className="py-2 pr-2 pl-4">
                  <RankCell h={h} />
                </td>
                <td className="px-2 py-2">
                  <span className="flex items-center gap-2.5">
                    <HorseNoBox no={h.horseNo} frame={h.frame} size="sm" muted={h.scratched} />
                    <span className="min-w-0">
                      <span className={clsx("block truncate text-[14px] font-semibold", h.scratched ? "text-ink-2 line-through" : "text-ink")}>{h.name}</span>
                      <span className="block text-[11.5px] text-ink-2">
                        {h.sexAge}・{h.jockeyName}・<span className="num">{h.weightCarried}</span>kg
                      </span>
                    </span>
                  </span>
                </td>
                <td className="num px-2 py-2 text-right text-[13px] text-ink-2">{h.scratched ? "—" : h.index.pre.toFixed(1)}</td>
                <td className="px-2 py-2 text-right">
                  {h.scratched ? (
                    <span className="text-[12px] font-semibold text-danger">出走取消</span>
                  ) : (
                    <span className="inline-flex items-baseline gap-2">
                      <span className="num text-[17px] font-semibold text-ink">{h.index.live.toFixed(1)}</span>
                      <span className={clsx("num w-9 text-left text-[12px] font-semibold", deltaClass(h.index.delta))}>{pending ? "" : signed(h.index.delta)}</span>
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-right">
                  <BodyWeight h={h} at={wAt} />
                </td>
                <td className="py-2 pr-4 pl-2 text-center">
                  <PaddockCell h={h} at={pAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* スマホ: 行カード */}
        <ol className="divide-y divide-line md:hidden">
          {a.horses.map((h) => (
            <li key={h.horseNo} className={clsx("flex items-center gap-2.5 px-3 py-2.5", h.scratched && "bg-surface-2/60")}>
              <RankCell h={h} />
              <HorseNoBox no={h.horseNo} frame={h.frame} size="sm" muted={h.scratched} />
              <div className="min-w-0 flex-1">
                <p className={clsx("truncate text-[14px] font-semibold leading-tight", h.scratched ? "text-ink-2 line-through" : "text-ink")}>{h.name}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-ink-2">
                  <span className="inline-flex items-center gap-1">
                    体重 <BodyWeight h={h} at={wAt} compact />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    パドック <PaddockCell h={h} at={pAt} compact />
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                {h.scratched ? (
                  <span className="text-[12px] font-semibold text-danger">取消</span>
                ) : (
                  <>
                    <p className="num text-[17px] font-semibold leading-none text-ink">{h.index.live.toFixed(1)}</p>
                    <p className="mt-1 text-[11px] leading-none text-ink-2">
                      <span className="num">{h.index.pre.toFixed(1)}</span>
                      <span className={clsx("num ml-1 font-semibold", deltaClass(h.index.delta))}>{pending ? "" : signed(h.index.delta)}</span>
                    </p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function RankCell({ h }: { h: HorseProDetail }) {
  if (h.scratched) return <span className="inline-block w-9 text-center text-[11px] text-ink-2">—</span>;
  const move = h.index.rankPre - h.index.rankLive;
  return (
    <span className="inline-flex w-9 shrink-0 flex-col items-center leading-none" aria-label={`当日${h.index.rankLive}位（前日${h.index.rankPre}位）`}>
      <span className={clsx("num text-[20px] font-light tracking-[-0.04em]", h.index.rankLive === 1 ? "text-gold-ink" : "text-ink")}>{h.index.rankLive}</span>
      <span className={clsx("num mt-0.5 text-[11px] font-semibold", move > 0 ? "text-ok" : move < 0 ? "text-danger" : "text-silver")}>
        {move > 0 ? `▲${move}` : move < 0 ? `▼${-move}` : "―"}
      </span>
    </span>
  );
}

function BodyWeight({ h, at, compact = false }: { h: HorseProDetail; at: string; compact?: boolean }) {
  if (h.scratched) return <span className="text-[12px]">—</span>;
  if (!h.bodyWeight) {
    return <span className={clsx("text-ink-2", compact ? "text-[11.5px]" : "text-[12px]")}>{compact ? `${at}頃` : `発表前（${at}頃）`}</span>;
  }
  const { value, diff } = h.bodyWeight;
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={clsx("num font-semibold text-ink", compact ? "text-[12px]" : "text-[14px]")}>{value}</span>
      <span className={clsx("num font-semibold", compact ? "text-[11px]" : "text-[12px]", Math.abs(diff) >= 10 ? "text-warn" : "text-ink-2")}>
        ({diff > 0 ? `+${diff}` : diff < 0 ? `−${-diff}` : "±0"})
      </span>
    </span>
  );
}

export const GRADE_STYLE: Record<PaddockGrade, string> = {
  S: "border-gold bg-surface text-gold-ink",
  A: "border-accent-silver bg-silver-surface text-ink",
  B: "border-line bg-surface text-ink-2",
  C: "border-line bg-surface-2 text-ink-2",
};

export function GradeChip({ grade, size = "md" }: { grade: PaddockGrade; size?: "sm" | "md" }) {
  return (
    <span
      className={clsx(
        "num inline-flex items-center justify-center rounded-[5px] border font-bold",
        size === "sm" ? "h-[18px] min-w-[18px] px-1 text-[11px]" : "h-6 min-w-6 px-1.5 text-[13px]",
        GRADE_STYLE[grade],
      )}
      aria-label={`パドック${grade}評価`}
    >
      {grade}
    </span>
  );
}

function PaddockCell({ h, at, compact = false }: { h: HorseProDetail; at: string; compact?: boolean }) {
  if (h.scratched) return <span className="text-[12px]">—</span>;
  if (!h.paddock) return <span className={clsx("text-ink-2", compact ? "text-[11.5px]" : "text-[12px]")}>{compact ? `${at}頃` : `${at}頃`}</span>;
  return <GradeChip grade={h.paddock.grade} size={compact ? "sm" : "md"} />;
}
