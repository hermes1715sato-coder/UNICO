import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Lock } from "lucide-react";
import { SectionHeading, buttonClass } from "@/components/ui";
import { UnicornMark } from "@/components/brand/UnicornMark";

const FEATURES = [
  "当日の馬場状態・馬体重・パドック評価をリアルタイムで反映",
  "当日補正後のUNICO指数と順位の変動",
  "陣営AI指数と陣営コメントの要点",
  "血統・騎手・展開・追い切りの馬別詳細",
];

/**
 * 非PRO向けのティザー。実データは一切受け取らず、見出しと形だけのスケルトンを描画する。
 */
export function LockedTeaser({ raceId }: { raceId: string }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="edge-silver edge-gold relative overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface px-5 py-6 shadow-[var(--shadow-card)] sm:px-7 sm:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="silver-plate flex h-11 w-11 items-center justify-center rounded-[11px] text-gold-ink">
              <Lock size={19} strokeWidth={1.6} aria-hidden />
            </span>
            <p className="mt-3 text-[18px] font-bold text-ink">PRO会員専用の分析です</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
              このページでは、レース当日の情報を加えた詳細な分析をPRO会員向けに提供しています。
            </p>
            <ul className="mt-3 space-y-1.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13.5px] leading-snug text-ink">
                  <UnicornMark size={15} tone="gold" className="mt-[3px] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
            <Link href="/pro/plans" className={buttonClass("primary", "lg")}>
              <UnicornMark size={18} tone="gold" />
              PROプランを見る
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link href={`/race/${raceId}`} className={buttonClass("secondary", "lg")}>
              無料のレースページへ戻る
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-6 lg:gap-y-10">
        <TeaserBlock className="lg:col-span-2" index="01" en="RACE DAY LIVE" title="当日リアルタイム" desc="馬体重発表・パドック・発走までの進行、馬場状態（含水率・クッション値・バイアス）、このレースの更新履歴。" rows={1} variant="tiles" />
        <TeaserBlock index="02" en="LIVE UNICO INDEX" title="当日補正 UNICO指数" desc="前日指数からの補正値と順位の変動、馬体重の増減、パドック評価を全馬一覧で。" rows={5} />
        <TeaserBlock index="03" en="PACE FORECAST" title="展開予想" desc="想定ペースと、序盤・4角の隊列図。" rows={2} variant="tiles" />
        <TeaserBlock className="lg:col-span-2" index="04" en="HORSE ANALYSIS" title="馬別 詳細分析" desc="指数内訳9項目、陣営AI指数と陣営コメント、血統・騎手・追い切り・展開の詳細。" rows={3} />
      </div>
    </div>
  );
}

function TeaserBlock({
  index,
  en,
  title,
  desc,
  rows,
  variant = "rows",
  className,
}: {
  index: string;
  en: string;
  title: string;
  desc: string;
  rows: number;
  variant?: "rows" | "tiles";
  className?: string;
}) {
  return (
    <section className={clsx("min-w-0", className)}>
      <SectionHeading index={index} en={en} title={title} pro />
      <p className="mb-2.5 text-[13px] leading-relaxed text-ink-2">{desc}</p>
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div aria-hidden className="pointer-events-none select-none space-y-2.5 p-4 blur-[3px]">
          {variant === "tiles" ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: rows * 4 }).map((_, i) => (
                <span key={i} className="h-10 rounded-[8px] bg-silver-surface" />
              ))}
            </div>
          ) : (
            Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-[6px] bg-silver-surface" />
                <span className="h-3 flex-1 rounded-full bg-silver-surface" style={{ maxWidth: `${70 - i * 8}%` }} />
                <span className="h-5 w-12 rounded-[5px] bg-silver-surface" />
              </div>
            ))
          )}
        </div>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-surface/90 px-3 py-1 text-[12px] font-semibold text-gold-ink">
            <Lock size={12} strokeWidth={1.8} />
            PRO会員限定
          </span>
        </span>
      </div>
    </section>
  );
}
