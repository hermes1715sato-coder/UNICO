import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import type { IndexFactor } from "@/lib/types";
import { INDEX_FACTOR_LABELS, INDEX_FACTOR_ORDER } from "@/lib/scoring";
import type { RacePredictionView } from "@/lib/predictions/view";
import { SectionHeading } from "@/components/ui";
import { HorseNoBox } from "@/components/race/parts";
import type { FrameOf } from "./parts";
import { UnicornMark } from "@/components/brand/UnicornMark";

const SHORT: Record<IndexFactor, string> = {
  ability: "能力",
  recent: "近走",
  aptitude: "適性",
  pace: "展開",
  workout: "追切",
  stable: "陣営",
  jockey: "騎手",
  drawWeight: "枠斤",
  pedigree: "血統",
};

/** 値 (0-100) → シルバーの濃淡。テーマ追従のため color-mix でトークンを薄める */
function tone(v: number) {
  const p = Math.max(0, Math.min(1, (v - 35) / 60));
  return `color-mix(in oklab, var(--color-accent-silver) ${Math.round(6 + p * 66)}%, var(--color-surface))`;
}

/** PRO 詳細UNICO指数分析 (9項目の内訳)。非PROは鍵付きの案内のみ */
export function ProAnalysisSection({
  analysis,
  frameOf,
  index = "04",
  raceId,
}: {
  analysis: RacePredictionView["proAnalysis"];
  frameOf: FrameOf;
  index?: string;
  /** 指定するとPRO分析ページ (/pro/race/[id]) への導線を表示 */
  raceId?: string;
}) {
  return (
    <section aria-labelledby="pro-analysis-title">
      <SectionHeading id="pro-analysis-title" index={index} en="PRO ANALYSIS" title="詳細UNICO指数分析" pro />
      {analysis.state === "locked" ? (
        <Locked raceId={raceId} />
      ) : analysis.state === "not_ready" || !analysis.horses ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-surface px-4 py-5 text-[13.5px] text-ink-2">
          指数の分析完了後に、項目別の内訳を表示します。
        </div>
      ) : (
        <>
          <Matrix horses={analysis.horses} frameOf={frameOf} />
          {raceId && <ProPageLink raceId={raceId} />}
        </>
      )}
    </section>
  );
}

function Matrix({ horses, frameOf }: { horses: NonNullable<RacePredictionView["proAnalysis"]["horses"]>; frameOf: FrameOf }) {
  return (
    <div className="edge-silver edge-gold overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
      <p className="border-b border-line px-4 py-2.5 text-[12.5px] leading-relaxed text-ink-2">
        指数順。各項目 0〜100。濃いほど高評価です（血統・騎手・展開・追い切り・陣営AI など9項目）。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[328px] border-collapse text-center">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="sticky left-0 z-[1] bg-surface py-2 pr-1 pl-3 text-left text-[11px] font-semibold text-ink-2">
                馬
              </th>
              {INDEX_FACTOR_ORDER.map((f) => (
                <th key={f} scope="col" title={INDEX_FACTOR_LABELS[f]} className="px-0 py-2 text-[11px] font-semibold text-ink-2">
                  {SHORT[f]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horses.map((h, i) => (
              <tr key={h.horseNo} className="border-b border-line last:border-b-0">
                <th scope="row" className="sticky left-0 z-[1] bg-surface py-1.5 pr-1 pl-3 text-left font-normal">
                  <span className="flex items-center gap-2">
                    <span className="num w-4 text-right text-[11px] text-ink-2">{i + 1}</span>
                    <HorseNoBox no={h.horseNo} frame={frameOf[h.horseNo]} size="sm" />
                    <span className="hidden max-w-[9.5rem] truncate text-[13px] font-semibold text-ink md:inline">{h.name}</span>
                  </span>
                </th>
                {INDEX_FACTOR_ORDER.map((f) => {
                  const v = Math.round(h.breakdown[f]);
                  return (
                    <td key={f} className="p-[2px]">
                      <span
                        className="num flex h-7 min-w-[26px] items-center justify-center rounded-[5px] text-[12px] font-semibold text-ink"
                        style={{ background: tone(v) }}
                        aria-label={`${INDEX_FACTOR_LABELS[f]} ${v}`}
                      >
                        {v}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 border-t border-line px-4 py-3 text-[11px] text-ink-2 sm:grid-cols-5">
        {INDEX_FACTOR_ORDER.map((f) => (
          <div key={f} className="flex gap-1">
            <dt className="shrink-0 font-semibold text-ink">{SHORT[f]}</dt>
            <dd className="min-w-0 truncate">{INDEX_FACTOR_LABELS[f]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** PRO会員向け: レース別 PRO 分析ページへの導線 */
function ProPageLink({ raceId }: { raceId: string }) {
  return (
    <Link
      href={`/pro/race/${raceId}`}
      className="edge-silver edge-gold group mt-3 flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 shadow-[var(--shadow-card)] transition-colors hover:border-gold/60"
    >
      <span className="silver-plate flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]">
        <UnicornMark size={18} tone="gold" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-ink">PRO分析ページを開く</span>
        <span className="block text-[12.5px] leading-snug text-ink-2">当日補正指数・馬体重・パドック・展開・陣営AI・血統・騎手・追い切り</span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-gold-ink transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function Locked({ raceId }: { raceId?: string }) {
  return (
    <div className="edge-silver edge-gold relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
      <div aria-hidden className="brushed grid select-none grid-cols-9 gap-1 px-4 py-4 blur-[2px]">
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={i} className="h-6 rounded-[5px]" style={{ background: tone(40 + ((i * 37) % 55)) }} />
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Lock size={15} strokeWidth={1.8} className="mt-[3px] shrink-0 text-gold" aria-hidden />
          <div>
            <p className="text-[14px] font-bold text-ink">PRO会員限定</p>
            <p className="text-[12.5px] leading-relaxed text-ink-2">血統・騎手・展開・追い切り・陣営AI指数など、9項目の内訳を全馬分表示します。</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 self-end sm:self-auto">
          <Link href="/pro/plans" className="inline-flex items-center gap-1 text-[13px] font-semibold text-gold-ink hover:underline">
            <UnicornMark size={16} tone="gold" />
            PROプランを見る
            <ArrowRight size={14} aria-hidden />
          </Link>
          {raceId && (
            <Link href={`/pro/race/${raceId}`} className="text-[12.5px] font-medium text-ink-2 hover:text-ink hover:underline">
              PRO分析ページの内容を見る
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
