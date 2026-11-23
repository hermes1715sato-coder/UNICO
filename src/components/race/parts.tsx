import clsx from "clsx";
import type { ReactNode } from "react";
import type { PublicIndex } from "@/lib/types";

/**
 * 枠色の背景クラス。Tailwind v4 は未使用の @theme 変数を出力しないため、
 * ユーティリティクラスとして明示的に参照して --color-waku-* を確実に生成させる。
 */
export const WAKU_BG: Record<number, string> = {
  1: "bg-waku-1",
  2: "bg-waku-2",
  3: "bg-waku-3",
  4: "bg-waku-4",
  5: "bg-waku-5",
  6: "bg-waku-6",
  7: "bg-waku-7",
  8: "bg-waku-8",
};

/**
 * 馬番ボックス: 四角い枠付き数字 + 左端に枠色ストリップ。
 * 指数順位 (枠なしの細い大数字 + 「位」) と視覚的に明確に区別する。
 * plate=true でマットシルバーの刻印プレート風 (ワイドBOX図・上位3頭)。
 */
export function HorseNoBox({
  no,
  frame,
  size = "md",
  muted = false,
  plate = false,
}: {
  no: number;
  frame?: number;
  size?: "sm" | "md" | "lg";
  muted?: boolean;
  plate?: boolean;
}) {
  return (
    <span
      className={clsx(
        "num relative inline-flex shrink-0 items-center justify-center overflow-hidden border font-bold",
        size === "sm" && "h-7 w-7 rounded-[6px] pl-[3px] text-[13px]",
        size === "md" && "h-8 w-8 rounded-[7px] pl-[3px] text-[15px]",
        size === "lg" && "h-11 w-11 rounded-[9px] pl-[5px] text-[19px] tracking-[-0.03em]",
        plate ? "silver-plate" : "bg-surface",
        muted ? "border-line text-ink-2" : plate ? "text-ink" : "border-silver text-ink",
      )}
      aria-label={`${no}番`}
    >
      {frame !== undefined && (
        <span
          aria-hidden
          className={clsx(
            "absolute inset-y-0 left-0",
            size === "lg" ? "w-[5px]" : "w-[4px]",
            WAKU_BG[frame],
            frame === 1 && "border-r border-silver",
            muted && "opacity-50",
          )}
        />
      )}
      {no}
    </span>
  );
}

/** 指数順位: 枠なしの細い大数字 + 「位」 (馬番ボックスと形も太さも変える) */
export function RankMark({ rank, size = "md" }: { rank: number; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-baseline gap-[2px] text-ink" aria-label={`指数${rank}位`}>
      <span
        className={clsx(
          "num font-extralight leading-none tracking-[-0.05em]",
          size === "lg" ? "text-[34px]" : "text-[26px]",
        )}
      >
        {rank}
      </span>
      <span className="text-[11px] font-medium leading-none text-ink-2">位</span>
    </span>
  );
}

/** 計器ラベル: 英字マイクロラベル + 値 */
export function Readout({
  en,
  ja,
  children,
  className,
}: {
  en: string;
  ja?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("min-w-0", className)}>
      <dt className="flex items-baseline gap-1.5 leading-none">
        <span className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">{en}</span>
        {ja && <span className="sr-only">{ja}</span>}
      </dt>
      <dd className="mt-1.5 text-ink">{children}</dd>
    </div>
  );
}

export interface ScoreStats {
  min: number;
  max: number;
  avg: number;
  top: number;
}

export function scoreStats(index: PublicIndex[] | null): ScoreStats | null {
  if (!index || index.length === 0) return null;
  const scores = index.map((i) => i.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { min, max, avg, top: max };
}

/** 広告枠 (無料ページのみ・控えめなラベル付きプレースホルダ) */
export function AdSlot({ className }: { className?: string }) {
  return (
    <aside
      aria-label="広告"
      className={clsx(
        "flex h-[100px] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line bg-surface-2/60",
        className,
      )}
    >
      <span className="text-[11px] font-medium tracking-[0.2em] text-accent-silver">広告</span>
      <span className="num mt-0.5 text-[11px] text-silver">AD SPACE</span>
    </aside>
  );
}
