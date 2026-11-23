import { HorseshoeGauge } from "@/components/brand/HorseshoeGauge";
import { TrackOval } from "@/components/brand/TrackOval";
import { DemoBadge } from "@/components/ui";
import { INDEX_VERSION } from "@/lib/scoring";

/** 指数見本の値 (DEMO: 架空の値。実在の馬・レースとは無関係) */
const SPECIMEN_SCORE = 78.4;

const FACTS = [
  { value: "9", en: "FACTORS", text: "観点を統合した総合指数" },
  { value: "0–100", en: "SCALE", text: "レースごとに比較できる尺度" },
  { value: "BOX", en: "FREE WIDE", text: "上位馬のワイドを無料公開" },
];

/**
 * トップのブランド導入。ヘアライン仕上げの白いパネルに、競馬場の楕円トラックを
 * 極細線で敷き、UNICO指数の「見本 (SPECIMEN)」を蹄鉄ゲージで見せる。
 * スマホでは高さを抑え、すぐ下の開催日選択が見える構成にする。
 */
export function HomeHero() {
  return (
    <section className="brushed relative overflow-hidden rounded-[var(--radius-card-lg)] border border-line shadow-[var(--shadow-card)]">
      {/* 背景: 楕円トラックの細線 (右へ抜ける) */}
      <TrackOval variant="decor" width={460} className="absolute -right-[170px] -top-[36px] opacity-55 lg:hidden" />
      <TrackOval variant="decor" width={900} className="absolute -right-[470px] -top-[120px] hidden opacity-90 lg:block" />

      <div className="relative grid gap-3.5 px-5 pb-4 pt-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:gap-12 lg:px-10 lg:py-9">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="num text-[11px] font-semibold tracking-[0.24em] text-accent-silver">AI HORSE RACING ANALYTICS</p>
            <span aria-hidden className="hidden h-px w-16 bg-silver sm:block" />
          </div>
          <h1 className="mt-2.5 text-[22px] font-bold leading-[1.5] tracking-[0.02em] text-ink sm:text-[26px] lg:text-[32px] lg:leading-[1.45]">
            過去の着順だけでは見えない、
            <br />
            今回<span className="relative inline-block">
              走れる理由
              <span aria-hidden className="absolute inset-x-0 -bottom-[2px] h-px bg-gold" />
            </span>
            を探す。
          </h1>
          <p className="mt-3 max-w-[34rem] text-[14px] leading-relaxed text-ink-2 lg:mt-4 lg:text-[15px]">
            能力・適性・展開・血統など9つの観点を独自の<span className="font-semibold text-ink">UNICO指数</span>
            に統合し、レースごとの判断材料を整理します。
          </p>

          {/* PC: 3つの要点 (細い縦罫で区切る計器の目盛り風) */}
          <dl className="mt-6 hidden max-w-[36rem] grid-cols-3 border-t border-line pt-4 sm:grid">
            {FACTS.map((f, i) => (
              <div key={f.en} className={i > 0 ? "border-l border-line pl-4" : "pr-4"}>
                <dt className="num text-[11px] font-semibold tracking-[0.18em] text-accent-silver">{f.en}</dt>
                <dd className="mt-1">
                  <span className="num block text-[22px] font-light leading-none tracking-[-0.02em] text-ink">{f.value}</span>
                  <span className="mt-1.5 block text-[12px] leading-snug text-ink-2">{f.text}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 指数見本 (SPECIMEN) */}
        <figure className="relative flex items-center gap-3.5 border-t border-line pt-3 lg:flex-col lg:gap-2 lg:rounded-[14px] lg:border lg:bg-surface/85 lg:p-5">
          <div className="absolute inset-x-0 top-0 hidden h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)] opacity-70 lg:block" />
          <div className="hidden w-full items-center justify-between lg:flex">
            <span className="num text-[11px] font-semibold tracking-[0.2em] text-accent-silver">SPECIMEN</span>
            <DemoBadge />
          </div>
          <HorseshoeGauge score={SPECIMEN_SCORE} size={168} label="UNICO" className="h-[64px] w-[64px] lg:h-[168px] lg:w-[168px]" />
          <figcaption className="min-w-0 lg:w-full lg:text-center">
            <p className="flex items-center gap-2 lg:justify-center">
              <span className="num text-[12px] font-bold tracking-[0.2em] text-ink">UNICO INDEX</span>
              <span className="lg:hidden">
                <DemoBadge />
              </span>
            </p>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-2">
              蹄鉄ゲージで指数の大きさを表示。<span className="lg:block">勝率ではありません。</span>
            </p>
            <div className="num mt-2 hidden items-center justify-between border-t border-line pt-2 text-[11px] font-semibold tracking-[0.14em] text-accent-silver lg:flex">
              <span>0</span>
              <span>{INDEX_VERSION.toUpperCase()}</span>
              <span>100</span>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
