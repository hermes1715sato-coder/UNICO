import clsx from "clsx";
import type { Direction } from "@/lib/types";

/** JRA 各場の (主な) 回り方向。競馬場タブの小さなコースマーク用 */
export const VENUE_DIRECTION: Record<string, Direction> = {
  "01": "right", // 札幌
  "02": "right", // 函館
  "03": "right", // 福島
  "04": "left", // 新潟
  "05": "left", // 東京
  "06": "right", // 中山
  "07": "left", // 中京
  "08": "right", // 京都
  "09": "right", // 阪神
  "10": "right", // 小倉
};

/**
 * 回り方向の極小マーク (楕円トラック + ホームストレッチの進行方向)。
 * 色は currentColor。文字情報の補助なので aria-hidden。
 */
export function DirectionMark({ direction, className }: { direction: Direction; className?: string }) {
  return (
    <svg viewBox="0 0 24 14" width={24} height={14} className={clsx("shrink-0", className)} aria-hidden>
      {direction === "straight" ? (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7 H21" strokeWidth="1.6" />
          <path d="M18 4.5 L21 7 L18 9.5" strokeWidth="1.6" />
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="1.5" width="21" height="9.5" rx="4.75" strokeWidth="1" opacity="0.55" />
          {direction === "right" ? (
            <>
              <path d="M16 11 H7" strokeWidth="1.7" />
              <path d="M9.5 8.6 L7 11 L9.5 13.2" strokeWidth="1.5" />
            </>
          ) : (
            <>
              <path d="M8 11 H17" strokeWidth="1.7" />
              <path d="M14.5 8.6 L17 11 L14.5 13.2" strokeWidth="1.5" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
