import { INDEX_FACTOR_LABELS, INDEX_FACTOR_ORDER, INDEX_VERSION, INDEX_WEIGHTS } from "@/lib/scoring";
import { Card } from "@/components/ui";

/* 蹄鉄の中心線 (HorseshoeGauge と同じ形)。直線38 + 半円 π·28 + 直線38 */
const D = "M22 12 V50 A28 28 0 0 0 78 50 V12";
const STRAIGHT = 38;
const ARC = Math.PI * 28;
const TOTAL = STRAIGHT * 2 + ARC;
const GAP = 1.1; // pathLength=100 基準のセグメント間の隙間

/** 配点の大きい順に チャコール → マットシルバー の階調 */
function tone(i: number, n: number) {
  const a = [0x3a, 0x45, 0x41];
  const b = [0xcf, 0xd6, 0xd5];
  const t = n <= 1 ? 0 : i / (n - 1);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(",")})`;
}

/** 蹄鉄上の位置 (0〜100) → 外側にオフセットした座標 */
function pointOutside(pos: number, off: number): [number, number] {
  const s = (pos / 100) * TOTAL;
  if (s < STRAIGHT) return [22 - off, 12 + s];
  if (s < STRAIGHT + ARC) {
    const th = (s - STRAIGHT) / 28;
    const r = 28 + off;
    return [50 - r * Math.cos(th), 50 + r * Math.sin(th)];
  }
  return [78 + off, 50 - (s - STRAIGHT - ARC)];
}

/** UNICO指数の構成 (9項目と配点) — 蹄鉄を配点で9分割したシグネチャ図 */
export function IndexIntro() {
  let acc = 0;
  const segs = INDEX_FACTOR_ORDER.map((k, i) => {
    const pct = Math.round(INDEX_WEIGHTS[k] * 100);
    const seg = { key: k, no: String(i + 1).padStart(2, "0"), label: INDEX_FACTOR_LABELS[k], pct, start: acc, color: tone(i, INDEX_FACTOR_ORDER.length) };
    acc += INDEX_WEIGHTS[k] * 100;
    return seg;
  });

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,4fr)_auto_minmax(0,5fr)] lg:items-center lg:gap-8 lg:p-6">
        <div>
          <p className="text-[16px] font-bold leading-relaxed text-ink">
            着順や人気ではなく、
            <br className="hidden lg:block" />
            「今回の条件で走れるか」を数値化。
          </p>
          <div className="gold-rule mt-3 w-12" />
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
            9つの項目をそれぞれ0〜100で評価し、蹄鉄に示した配点で加重平均した総合値がUNICO指数です。
            出走取消や騎手変更、当日の馬場状態に合わせて再計算します。
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            無料公開は<span className="font-semibold text-ink">総合指数と順位</span>のみ。項目別の内訳はPROで確認できます。
          </p>
          <p className="num mt-3 text-[11px] font-semibold tracking-[0.18em] text-accent-silver">INDEX {INDEX_VERSION.toUpperCase()}</p>
        </div>

        {/* 蹄鉄: 配点で9分割 */}
        <figure className="mx-auto">
          <svg viewBox="2 3 96 93" width={232} height={225} role="img" aria-label="UNICO指数の配点を蹄鉄の長さで示した図" className="block">
            <path d={D} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
            {segs.map((s) => (
              <path
                key={s.key}
                d={D}
                pathLength={100}
                fill="none"
                stroke={s.color}
                strokeWidth="6.5"
                strokeDasharray={`${Math.max(0, s.pct - GAP)} 200`}
                strokeDashoffset={-(s.start + GAP / 2)}
              />
            ))}
            {/* 釘穴 */}
            {[
              [22, 17],
              [78, 17],
            ].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="1.2" fill="var(--color-surface)" opacity="0.9" />
            ))}
            {/* 項目番号 (外周) */}
            {segs.map((s) => {
              const [x, y] = pointOutside(s.start + s.pct / 2, 10.5);
              return (
                <text
                  key={s.key}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontSize: 5.4, fontWeight: 600, fill: "var(--color-ink-2)", fontFamily: "var(--font-num)" }}
                >
                  {s.no}
                </text>
              );
            })}
            <text x="50" y="40" textAnchor="middle" style={{ fontSize: 17, fontWeight: 300, fill: "var(--color-ink)", fontFamily: "var(--font-num)", letterSpacing: "-0.03em" }}>
              100
            </text>
            <text x="50" y="50" textAnchor="middle" style={{ fontSize: 5.4, fontWeight: 600, fill: "var(--color-accent-silver)", letterSpacing: "0.2em", fontFamily: "var(--font-num)" }}>
              9 FACTORS
            </text>
          </svg>
        </figure>

        {/* 配点プレート */}
        <ol className="grid grid-cols-3 gap-px overflow-hidden rounded-[12px] border border-line bg-line" aria-label="UNICO指数の構成項目と配点">
          {segs.map((s) => (
            <li key={s.key} className="relative flex min-h-[78px] flex-col bg-surface px-2.5 pb-2 pt-2.5">
              <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.color }} />
              <span className="flex items-baseline justify-between gap-1">
                <span className="num text-[11px] font-semibold tracking-[0.1em] text-accent-silver">{s.no}</span>
                <span className="num text-[19px] font-semibold leading-none tracking-[-0.02em] text-ink">
                  {s.pct}
                  <span className="text-[11px] font-medium text-ink-2">%</span>
                </span>
              </span>
              <span className="mt-auto pt-1.5 text-[12px] font-medium leading-snug text-ink">{s.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
