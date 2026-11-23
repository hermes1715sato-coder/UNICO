import { useId } from "react";
import clsx from "clsx";

/**
 * UNICO Signature: 蹄鉄ゲージ
 * ロゴのU字蹄鉄をモチーフにした指数メーター。左の先端から蹄鉄に沿って
 * 右の先端まで、0〜100 の指数分だけマットシルバー → チャコールで満たす。
 * 勝率ではなく「指数の大きさ」を示す表現であることに注意。
 */
export function HorseshoeGauge({
  score,
  size = 88,
  label = "UNICO",
  highlight = false,
  showValue = true,
  className,
}: {
  score: number;          // 0-100
  size?: number;
  label?: string;
  highlight?: boolean;    // 1位など: 先端に細いゴールド
  showValue?: boolean;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, score));
  // グラデーションIDはインスタンスごとに一意 (同値ゲージの非表示時に塗りが消える問題の対策)
  const id = `hg${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const D = "M22 12 V50 A28 28 0 0 0 78 50 V12";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${label} ${v.toFixed(1)}`}
      className={clsx("shrink-0", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--gauge-start)" }} />
          <stop offset="0.6" style={{ stopColor: "var(--gauge-mid)" }} />
          <stop offset="1" style={{ stopColor: highlight ? "var(--gauge-end-gold)" : "var(--gauge-end)" }} />
        </linearGradient>
      </defs>
      {/* track */}
      <path d={D} fill="none" stroke="var(--color-silver-surface)" strokeWidth="10" strokeLinecap="round" />
      {/* fill */}
      <path
        d={D}
        pathLength={100}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${v} 100`}
      />
      {/* 釘穴 (目盛り) */}
      {[
        [22, 20],
        [22, 33],
        [78, 20],
        [78, 33],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill="var(--color-surface)" opacity="0.9" />
      ))}
      {showValue && (
        <>
          <text
            x="50"
            y="50"
            textAnchor="middle"
            className="num"
            style={{ fontSize: 16, fontWeight: 700, fill: "var(--color-ink)", fontFamily: "var(--font-num)" }}
          >
            {v.toFixed(1)}
          </text>
          <text
            x="50"
            y="63"
            textAnchor="middle"
            style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.2em", fill: "var(--color-accent-silver)", fontFamily: "var(--font-num)" }}
          >
            {label}
          </text>
        </>
      )}
    </svg>
  );
}
