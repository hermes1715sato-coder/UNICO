import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import type { HorseProDetail, ProRaceAnalysis } from "@/lib/pro/types";
import { SectionHeading } from "@/components/ui";
import { HorseNoBox } from "@/components/race/parts";

const ZONES = ["先頭", "好位", "中団", "後方"] as const;

function zoneOf(pos: number, n: number) {
  if (pos <= Math.max(1, Math.round(n * 0.15))) return 0;
  if (pos <= Math.ceil(n * 0.4)) return 1;
  if (pos <= Math.ceil(n * 0.7)) return 2;
  return 3;
}

const PACE_LEVEL = { スロー: 0, ミドル: 1, ハイ: 2 } as const;

/** 03 展開予想: ペース + 隊列 (序盤 → 4角) */
export function PaceSection({ a }: { a: ProRaceAnalysis }) {
  const runners = a.horses.filter((h) => !h.scratched);
  const n = Math.max(runners.length, 1);
  const top3 = new Set(runners.slice(0, 3).map((h) => h.horseNo));
  const level = PACE_LEVEL[a.paceForecast.pace];

  return (
    <section aria-labelledby="pro-pace-title">
      <SectionHeading id="pro-pace-title" index="03" en="PACE FORECAST" title="展開予想" pro />
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4 border-b border-line px-4 py-3">
          <div>
            <p className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">PACE</p>
            <p className="text-[20px] font-bold leading-tight text-ink">{a.paceForecast.pace}</p>
          </div>
          {/* 3段階メーター */}
          <div className="flex-1" aria-hidden>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className={clsx("h-1.5 flex-1 rounded-full", i <= level ? (i === 2 ? "bg-gold" : "bg-accent-silver") : "bg-silver-surface")} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-ink-2">
              <span>スロー</span>
              <span>ミドル</span>
              <span>ハイ</span>
            </div>
          </div>
        </div>

        <div className="px-3 pt-3 pb-2 sm:px-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-ink-2">
            <span className="inline-flex items-center gap-1">
              <ArrowLeft size={12} strokeWidth={1.8} aria-hidden />
              進行方向
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-[3px] border border-gold" aria-hidden />
              当日指数 上位3頭
            </span>
          </div>
          <Formation label="序盤" en="EARLY" horses={runners} pick={(h) => h.pace.expectedEarly} n={n} top3={top3} />
          <Formation label="4角" en="CORNER 4" horses={runners} pick={(h) => h.pace.expectedLate} n={n} top3={top3} />
        </div>

        <p className="border-t border-line px-4 py-3 text-[13.5px] leading-relaxed text-ink">{a.paceForecast.comment}</p>
        {a.paceForecast.leaders.length > 0 && (
          <p className="border-t border-line px-4 py-2.5 text-[12.5px] text-ink-2">
            逃げ・先行想定：
            <span className="num font-semibold text-ink">{a.paceForecast.leaders.join("・")}</span>
          </p>
        )}
      </div>
    </section>
  );
}

function Formation({
  label,
  en,
  horses,
  pick,
  n,
  top3,
}: {
  label: string;
  en: string;
  horses: HorseProDetail[];
  pick: (h: HorseProDetail) => number;
  n: number;
  top3: Set<number>;
}) {
  const zones: HorseProDetail[][] = [[], [], [], []];
  // 想定位置の順に並べた序列 (同位置は馬番順) でゾーン分けし、隊列の偏りを避ける
  [...horses]
    .sort((x, y) => pick(x) - pick(y) || x.horseNo - y.horseNo)
    .forEach((h, i) => zones[zoneOf(i + 1, n)].push(h));
  return (
    <div className="mb-2">
      <p className="mb-1 flex items-baseline gap-1.5">
        <span className="text-[12px] font-bold text-ink">{label}</span>
        <span className="num text-[11px] font-semibold tracking-[0.14em] text-accent-silver">{en}</span>
      </p>
      <div className="relative grid grid-cols-4 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
        {zones.map((z, i) => (
          <div key={ZONES[i]} className={clsx("min-h-[64px] px-1 py-1.5", i === 0 ? "bg-silver-surface/70" : "bg-surface-2/70")}>
            <p className="mb-1 text-center text-[11px] font-medium text-ink-2">{ZONES[i]}</p>
            <ul className="flex flex-wrap justify-center gap-1">
              {z.map((h) => (
                <li key={h.horseNo} title={`${h.horseNo} ${h.name}（${h.pace.style}）`} className={clsx("rounded-[8px]", top3.has(h.horseNo) && "ring-1 ring-gold ring-offset-1 ring-offset-surface")}>
                  <HorseNoBox no={h.horseNo} frame={h.frame} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
