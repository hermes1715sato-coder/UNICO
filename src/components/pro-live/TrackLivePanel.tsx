import clsx from "clsx";
import { Cloud, CloudDrizzle, CloudRain, Sun, Wind, type LucideIcon } from "lucide-react";
import type { TrackCondition } from "@/lib/types";
import type { BiasLevel, TrackLive, Weather } from "@/lib/pro/types";
import { hhmm } from "./lounge/time";

/* =========================================================
   リアルタイム馬場パネル (PRO 限定・Server Component)
   競馬場 1 場分の天候・風・芝/ダートの馬場状態・クッション値・含水率・
   コース(柵)・内外/前後バイアスを表示する。データは props のみ。
   ========================================================= */

const WEATHER_ICON: Record<Weather, LucideIcon> = { 晴: Sun, 曇: Cloud, 小雨: CloudDrizzle, 雨: CloudRain };

const CONDITION_TONE: Record<TrackCondition, string> = {
  良: "border-ok/30 bg-ok-bg text-ok",
  稍重: "border-info/30 bg-info-bg text-info",
  重: "border-warn/35 bg-warn-bg text-warn",
  不良: "border-danger/30 bg-danger-bg text-danger",
};

export function ConditionChip({ condition, className }: { condition: TrackCondition; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-[5px] border px-1.5 py-[1px] text-[12px] font-bold leading-[18px]", CONDITION_TONE[condition], className)}>
      {condition}
    </span>
  );
}

/** JRA のクッション値の目安 */
function cushionLabel(v: number) {
  if (v < 7) return "軟らかめ";
  if (v < 8) return "やや軟らかめ";
  if (v < 10) return "標準";
  if (v < 12) return "やや硬め";
  return "硬め";
}

const CUSHION_MIN = 6;
const CUSHION_MAX = 13;

/** クッション値ゲージ: 6〜13 の横スケール。標準帯 (8〜10) を淡く示し、現在値に針 */
function CushionGauge({ value }: { value: number }) {
  const pos = (v: number) => ((Math.max(CUSHION_MIN, Math.min(CUSHION_MAX, v)) - CUSHION_MIN) / (CUSHION_MAX - CUSHION_MIN)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold text-ink-2">クッション値</p>
        <p className="text-[11px] font-semibold text-ink-2">{cushionLabel(value)}</p>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <span className="num w-[44px] shrink-0 text-[26px] font-light leading-none tracking-[-0.03em] text-ink">{value.toFixed(1)}</span>
        <div className="relative min-w-0 flex-1 pt-1 pb-4" aria-hidden>
          <div className="relative h-[6px] rounded-full bg-silver-surface">
            <span className="absolute inset-y-0 rounded-full bg-silver/70" style={{ left: `${pos(8)}%`, width: `${pos(10) - pos(8)}%` }} />
            <span
              className="absolute top-1/2 h-[14px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-charcoal ring-2 ring-surface"
              style={{ left: `${pos(value)}%` }}
            />
          </div>
          <div className="num absolute inset-x-0 bottom-0 flex justify-between text-[11px] leading-none text-ink-2">
            <span>軟</span>
            <span className="absolute -translate-x-1/2" style={{ left: `${pos(9)}%` }}>
              標準
            </span>
            <span>硬</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Moisture({ goal, c4 }: { goal: number; c4: number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink-2">含水率</p>
      <dl className="mt-1 grid grid-cols-2 gap-2">
        {[
          ["ゴール前", goal],
          ["4コーナー", c4],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-[8px] bg-surface-2 px-2.5 py-1.5">
            <dt className="text-[11px] text-ink-2">{k}</dt>
            <dd className="num text-[16px] font-medium leading-tight text-ink">
              {(v as number).toFixed(1)}
              <span className="ml-0.5 text-[11px] font-normal text-ink-2">%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const BIAS_STEPS: BiasLevel[] = ["不利", "やや不利", "フラット", "やや有利", "有利"];

/** バイアス: 5 段階の目盛り (左=不利 / 右=有利) */
function BiasScale({ label, level }: { label: string; level: BiasLevel }) {
  const i = BIAS_STEPS.indexOf(level);
  return (
    <div className="flex items-center gap-3">
      <span className="w-[64px] shrink-0 text-[12px] font-semibold text-ink-2">{label}</span>
      <span className="flex flex-1 items-center gap-1" role="img" aria-label={`${label} ${level}`}>
        {BIAS_STEPS.map((s, k) => (
          <span
            key={s}
            className={clsx(
              "h-[6px] flex-1 rounded-full",
              k === i ? "bg-charcoal" : k === 2 ? "bg-silver" : "bg-silver-surface",
            )}
          />
        ))}
      </span>
      <span className={clsx("w-[56px] shrink-0 text-right text-[12px] font-bold", i >= 3 ? "text-ink" : "text-ink-2")}>{level}</span>
    </div>
  );
}

function SurfaceHead({ surface, condition, extra }: { surface: "turf" | "dirt"; condition: TrackCondition; extra?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={clsx("rounded-[5px] px-1.5 py-[1px] text-[12px] font-bold leading-[18px]", surface === "turf" ? "bg-turf-bg text-turf" : "bg-dirt-bg text-dirt")}>
        {surface === "turf" ? "芝" : "ダート"}
      </span>
      <ConditionChip condition={condition} />
      {extra && <span className="ml-auto text-[12px] font-semibold text-ink-2">{extra}</span>}
    </div>
  );
}

export function TrackLivePanel({ track, className }: { track: TrackLive; className?: string }) {
  const W = WEATHER_ICON[track.weather];
  return (
    <article
      aria-label={`${track.venueName} 馬場状況`}
      className={clsx("overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface shadow-[var(--shadow-card)]", className)}
    >
      {/* 見出し: 競馬場 / 天候 / 風 / 更新時刻 */}
      <header className="brushed flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3">
        <h3 className="text-[18px] font-bold leading-none text-ink">{track.venueName}</h3>
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink">
          <W size={16} strokeWidth={1.7} className="text-accent-silver" aria-hidden />
          {track.weather}
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] text-ink">
          <Wind size={15} strokeWidth={1.7} className="text-accent-silver" aria-hidden />
          {track.windDirection}
          <span className="num font-medium">{track.windSpeed.toFixed(1)}</span>
          <span className="text-[11px] text-ink-2">m/s</span>
        </span>
        <span className="ml-auto text-[11px] text-ink-2">
          <span className="num">{hhmm(track.updatedAt)}</span> 更新
        </span>
      </header>

      <div className="grid gap-px bg-line sm:grid-cols-2">
        <section aria-label="芝" className="space-y-3 bg-surface px-4 py-3.5">
          <SurfaceHead surface="turf" condition={track.turf.condition} extra={track.turf.rail} />
          <CushionGauge value={track.turf.cushion} />
          <Moisture goal={track.turf.moistureGoal} c4={track.turf.moisture4c} />
        </section>
        <section aria-label="ダート" className="space-y-3 bg-surface px-4 py-3.5">
          <SurfaceHead surface="dirt" condition={track.dirt.condition} />
          <Moisture goal={track.dirt.moistureGoal} c4={track.dirt.moisture4c} />
          <div className="space-y-2 border-t border-dashed border-line pt-3">
            <p className="text-[11px] font-semibold text-ink-2">当日バイアス</p>
            <BiasScale label="内枠・内" level={track.bias.inside} />
            <BiasScale label="先行" level={track.bias.front} />
          </div>
        </section>
      </div>
      <p className="border-t border-line bg-surface-2/60 px-4 py-2.5 text-[13px] leading-relaxed text-ink">{track.bias.comment}</p>
    </article>
  );
}
