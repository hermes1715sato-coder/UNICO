import clsx from "clsx";
import type { ScoreStats } from "./parts";

/**
 * UNICO指数の表示。
 * - 大きな桁揃え数値 + レース内の相対位置を示す「ヘアライン目盛り」
 *   (極細の基準線 + 目盛り + マットシルバーの充填 + 先端の指針)
 * - 目盛りはレース内の最低値〜最高値で正規化 (最低値でも 18% は残す)、平均値に長い目盛り
 * - 1位との差を表示
 * 指数を勝率に変換して表示することはしない。
 */
export function UnicoScore({
  score,
  rank,
  stats,
  variant = "cell",
  className,
}: {
  score: number;
  rank: number;
  stats: ScoreStats;
  variant?: "cell" | "compact" | "large";
  className?: string;
}) {
  const span = stats.max - stats.min;
  const floor = 0.18;
  const pos = (v: number) => (span <= 0 ? 1 : floor + ((v - stats.min) / span) * (1 - floor));
  const ratio = pos(score);
  const avgRatio = pos(stats.avg);
  const gap = Math.round((stats.top - score) * 10) / 10;
  const isTop = rank === 1;

  const gapLabel = isTop ? (
    <span className="num text-[11px] font-semibold tracking-[0.14em] text-gold-ink">TOP</span>
  ) : (
    <span className="num text-[11.5px] text-ink-2">−{gap.toFixed(1)}</span>
  );

  const label = `UNICO指数 ${score.toFixed(1)}${isTop ? "（レース内最高）" : `（1位との差 ${gap.toFixed(1)}）`}`;

  if (variant === "large") {
    return (
      <div className={clsx("min-w-0", className)} aria-label={label}>
        <div className="flex items-baseline gap-2">
          <span className="num text-[40px] font-light leading-none tracking-[-0.04em] text-ink">{score.toFixed(1)}</span>
          {gapLabel}
        </div>
        <ScoreScale ratio={ratio} avgRatio={avgRatio} isTop={isTop} className="mt-3" />
        <div className="num mt-1.5 flex justify-between text-[11px] text-ink-2">
          <span>{stats.min.toFixed(1)}</span>
          <span>平均 {stats.avg.toFixed(1)}</span>
          <span>{stats.max.toFixed(1)}</span>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={clsx("flex w-[84px] flex-col items-end", className)} aria-label={label}>
        <span className={clsx("num text-[21px] leading-none tracking-[-0.02em] text-ink", isTop ? "font-bold" : "font-semibold")}>
          {score.toFixed(1)}
        </span>
        <ScoreScale ratio={ratio} avgRatio={avgRatio} isTop={isTop} className="mt-[7px] w-full" />
        <div className="mt-[6px] leading-none">{gapLabel}</div>
      </div>
    );
  }

  // cell (PC テーブル)
  return (
    <div className={clsx("flex items-center gap-3", className)} aria-label={label}>
      <span className={clsx("num w-[46px] text-right text-[17px] leading-none text-ink", isTop ? "font-bold" : "font-semibold")}>
        {score.toFixed(1)}
      </span>
      <ScoreScale ratio={ratio} avgRatio={avgRatio} isTop={isTop} className="min-w-[72px] flex-1" />
      <span className="w-[34px] text-right">{gapLabel}</span>
    </div>
  );
}

/** 計器風のヘアライン目盛り (装飾ではなく相対位置を読むためのもの) */
export function ScoreScale({
  ratio,
  avgRatio,
  isTop,
  className,
}: {
  ratio: number;
  avgRatio: number;
  isTop: boolean;
  className?: string;
}) {
  return (
    <span className={clsx("relative block h-[9px]", className)} aria-hidden>
      {/* 基準線 */}
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-silver/80" />
      {/* 目盛り (4分割) */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <span key={t} className="absolute top-[1px] h-[3px] w-px bg-silver" style={{ left: `calc(${t * 100}% - ${t}px)` }} />
      ))}
      {/* 充填 */}
      <span
        className={clsx(
          "absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-l-full",
          isTop
            ? "bg-[linear-gradient(90deg,var(--color-silver),var(--color-ink-2))]"
            : "bg-[linear-gradient(90deg,var(--color-silver-surface),var(--color-accent-silver))]",
        )}
        style={{ width: `${ratio * 100}%` }}
      />
      {/* 平均 */}
      <span className="absolute top-0 bottom-0 w-px bg-ink-2/40" style={{ left: `${avgRatio * 100}%` }} title="レース平均" />
      {/* 指針 */}
      <span
        className={clsx("absolute top-0 bottom-0 w-[2px] -translate-x-1/2 rounded-full", isTop ? "bg-gold" : "bg-ink")}
        style={{ left: `${ratio * 100}%` }}
      />
    </span>
  );
}
