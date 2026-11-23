import clsx from "clsx";
import type { Direction } from "@/lib/types";

/**
 * UNICO Signature: コース図 (楕円トラック)
 * - variant="decor": 背景装飾用の極細ライン (ヒーロー等)
 * - variant="course": レースの回り方向・ゴール位置を示すミニコース図
 * 上から見た図。右回り=時計回り(ホームストレッチを右→左に走る)。
 */
export function TrackOval({
  variant = "course",
  direction = "right",
  className,
  width = 120,
}: {
  variant?: "decor" | "course";
  direction?: Direction;
  className?: string;
  width?: number;
}) {
  const lanes = variant === "decor" ? [0, 7, 14, 21, 28] : [0, 8];
  const h = width / 2;
  if (variant === "decor") {
    return (
      <svg viewBox="0 0 200 100" width={width} height={h} className={clsx("pointer-events-none", className)} aria-hidden>
        {lanes.map((d, i) => (
          <rect
            key={d}
            x={4 + d}
            y={4 + d}
            width={192 - d * 2}
            height={92 - d * 2}
            rx={(92 - d * 2) / 2}
            fill="none"
            stroke="var(--color-silver)"
            strokeWidth={i === 0 ? 0.6 : 0.4}
            opacity={1 - i * 0.15}
          />
        ))}
        {/* ゴール板 */}
        <line x1="132" y1="88" x2="132" y2="100" stroke="var(--color-gold)" strokeWidth="0.8" />
      </svg>
    );
  }
  // course
  const clockwise = direction !== "left";
  return (
    <svg
      viewBox="0 0 200 100"
      width={width}
      height={h}
      className={clsx("shrink-0", className)}
      role="img"
      aria-label={direction === "left" ? "左回りコース" : direction === "right" ? "右回りコース" : "直線コース"}
    >
      <rect x="6" y="6" width="188" height="88" rx="44" fill="var(--color-surface-2)" stroke="var(--color-silver)" strokeWidth="1.2" />
      <rect x="22" y="22" width="156" height="56" rx="28" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="1" />
      {/* ホームストレッチ (下辺) の進行方向 */}
      <g stroke="var(--color-ink)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {clockwise ? (
          <>
            <path d="M150 86 H64" />
            <path d="M74 80 L64 86 L74 92" />
          </>
        ) : (
          <>
            <path d="M50 86 H136" />
            <path d="M126 80 L136 86 L126 92" />
          </>
        )}
      </g>
      {/* ゴール板 */}
      <g>
        <line x1={clockwise ? 56 : 144} y1="76" x2={clockwise ? 56 : 144} y2="97" stroke="var(--color-gold)" strokeWidth="2.4" />
        <circle cx={clockwise ? 56 : 144} cy="74" r="3" fill="var(--color-gold)" />
      </g>
      {/* 小サイズでは読めないため文字を出さない (aria-label で補完) */}
      {width >= 110 && <text x="100" y="56" textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: "var(--color-ink-2)", letterSpacing: "0.12em", fontFamily: "var(--font-num)" }}>
        {direction === "left" ? "LEFT" : direction === "right" ? "RIGHT" : "STRAIGHT"}
      </text>}
    </svg>
  );
}
