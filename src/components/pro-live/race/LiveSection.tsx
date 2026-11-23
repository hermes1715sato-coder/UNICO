import clsx from "clsx";
import { Ban, Check, Clock, Crown, Droplets, Eye, RefreshCw, Scale, UserRound, Wind, type LucideIcon } from "lucide-react";
import type { RaceSummary } from "@/lib/types";
import type { LiveUpdateKind, ProRaceAnalysis, TrackLive } from "@/lib/pro/types";
import { SectionHeading } from "@/components/ui";
import { jstHM } from "./format";

/** 01 当日リアルタイム: 進行状況 / 馬場 / このレースの更新 */
export function LiveSection({ race, a }: { race: RaceSummary; a: ProRaceAnalysis }) {
  return (
    <section aria-labelledby="pro-live-title">
      <SectionHeading id="pro-live-title" index="01" en="RACE DAY LIVE" title="当日リアルタイム" pro />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <PhaseSteps race={race} a={a} />
          {a.track ? (
            <TrackStrip track={a.track} surface={race.surface} />
          ) : (
            <p className="rounded-[var(--radius-card)] border border-dashed border-silver bg-surface px-4 py-3.5 text-[13.5px] leading-relaxed text-ink-2">
              馬場のリアルタイム情報は開催当日のみ表示します。
            </p>
          )}
        </div>
        <Timeline updates={a.updates} />
      </div>
    </section>
  );
}

function PhaseSteps({ race, a }: { race: RaceSummary; a: ProRaceAnalysis }) {
  const p = a.phase;
  const steps = [
    { label: "馬体重発表", time: jstHM(p.weightsAnnouncedAt), done: p.weightsAnnounced },
    { label: "パドック評価", time: jstHM(p.paddockAt), done: p.paddockDone },
    { label: "締切・発走", time: race.postTime, done: p.closed },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]">
      <p className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">RACE DAY PHASE</p>
      <ol className="mt-3 grid grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={clsx("absolute top-[13px] h-px", steps[i - 1].done ? "bg-gold" : "bg-line")}
                style={{ left: "calc(-50% + 18px)", right: "calc(50% + 18px)" }}
              />
            )}
            <span
              className={clsx(
                "relative flex h-[27px] w-[27px] items-center justify-center rounded-full border",
                s.done
                  ? "border-gold bg-surface text-gold-ink"
                  : i === current
                    ? "border-accent-silver bg-surface text-ink"
                    : "border-line bg-surface-2 text-accent-silver",
              )}
            >
              {s.done ? <Check size={14} strokeWidth={2} aria-hidden /> : <Clock size={13} strokeWidth={1.8} aria-hidden />}
            </span>
            <span className="mt-1.5 text-[12px] font-semibold leading-tight text-ink">{s.label}</span>
            <span className={clsx("mt-0.5 text-[11.5px] leading-tight", s.done ? "text-ink-2" : "text-ink")}>
              <span className="num">{s.time}</span>
              {s.done ? " 済" : " 予定"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** コンパクトな馬場ストリップ (このレースの開催場) */
export function TrackStrip({ track, surface }: { track: TrackLive; surface: "turf" | "dirt" }) {
  const cell = "bg-surface px-3 py-2.5";
  const lab = "num text-[11px] font-semibold tracking-[0.14em] text-accent-silver";
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
        <p className="text-[13px] font-bold text-ink">
          {track.venueName} 馬場状況
          <span className="ml-2 text-[11.5px] font-medium text-ink-2">
            <span className="num">{jstHM(track.updatedAt)}</span> 時点
          </span>
        </p>
        <span className="text-[11px] font-medium text-warn">DEMO・架空データ</span>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        <div className={cell}>
          <dt className={lab}>WEATHER</dt>
          <dd className="mt-1 text-[14px] font-bold text-ink">
            {track.weather}
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[12px] font-medium text-ink-2">
              <Wind size={12} strokeWidth={1.8} aria-hidden />
              {track.windDirection}
              <span className="num">{track.windSpeed}m</span>
            </span>
          </dd>
        </div>
        <div className={clsx(cell, surface === "turf" && "bg-turf-bg/50")}>
          <dt className={clsx(lab, "flex items-center gap-1")}>
            TURF <span className="font-sans tracking-normal text-turf">芝</span>
          </dt>
          <dd className="mt-1 text-[14px] font-bold text-ink">
            {track.turf.condition}
            <span className="ml-1.5 text-[12px] font-medium text-ink-2">{track.turf.rail}</span>
          </dd>
          <dd className="mt-0.5 text-[11.5px] text-ink-2">
            クッション <span className="num font-semibold text-ink">{track.turf.cushion}</span>
            <span className="mx-1 text-silver">/</span>
            <Droplets size={11} strokeWidth={1.8} className="inline align-[-1px]" aria-label="含水率" />
            <span className="num ml-0.5">{track.turf.moistureGoal}%</span>
          </dd>
        </div>
        <div className={clsx(cell, surface === "dirt" && "bg-dirt-bg/50")}>
          <dt className={clsx(lab, "flex items-center gap-1")}>
            DIRT <span className="font-sans tracking-normal text-dirt">ダ</span>
          </dt>
          <dd className="mt-1 text-[14px] font-bold text-ink">{track.dirt.condition}</dd>
          <dd className="mt-0.5 text-[11.5px] text-ink-2">
            <Droplets size={11} strokeWidth={1.8} className="inline align-[-1px]" aria-label="含水率" />
            <span className="num ml-0.5">
              ゴール前 {track.dirt.moistureGoal}% / 4角 {track.dirt.moisture4c}%
            </span>
          </dd>
        </div>
        <div className={cell}>
          <dt className={lab}>BIAS</dt>
          <dd className="mt-1 text-[12.5px] leading-snug text-ink">
            内 <span className="font-bold">{track.bias.inside}</span>
          </dd>
          <dd className="text-[12.5px] leading-snug text-ink">
            先行 <span className="font-bold">{track.bias.front}</span>
          </dd>
        </div>
      </dl>
      <p className="border-t border-line px-4 py-2 text-[12.5px] leading-relaxed text-ink-2">{track.bias.comment}</p>
    </div>
  );
}

const KIND: Record<LiveUpdateKind, { icon: LucideIcon; label: string }> = {
  track: { icon: Droplets, label: "馬場" },
  scratch: { icon: Ban, label: "取消" },
  jockey_change: { icon: UserRound, label: "騎手変更" },
  weight: { icon: Scale, label: "馬体重" },
  paddock: { icon: Eye, label: "パドック" },
  index_recalc: { icon: RefreshCw, label: "再計算" },
  final_published: { icon: Crown, label: "最終買い目" },
};

function Timeline({ updates }: { updates: ProRaceAnalysis["updates"] }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]">
      <p className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">TIMELINE</p>
      <p className="text-[13px] font-bold text-ink">このレースの更新</p>
      {updates.length === 0 ? (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-2">まだ更新はありません。馬体重発表・パドック評価の反映時にここへ記録します。</p>
      ) : (
        <ol className="mt-3 space-y-0">
          {updates.map((u, i) => {
            const k = KIND[u.kind];
            const Icon = k.icon;
            return (
              <li key={u.id} className="relative flex gap-3 pb-3 last:pb-0">
                {i < updates.length - 1 && <span aria-hidden className="absolute top-7 bottom-0 left-[13px] w-px bg-line" />}
                <span
                  className={clsx(
                    "relative flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border bg-surface",
                    u.kind === "final_published" ? "border-gold text-gold-ink" : u.kind === "scratch" ? "border-danger/40 text-danger" : "border-line text-accent-silver",
                  )}
                >
                  <Icon size={13} strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0 pt-[3px]">
                  <p className="text-[13.5px] font-semibold leading-snug text-ink">
                    <span className="num mr-2 font-medium text-ink-2">{jstHM(u.at)}</span>
                    {u.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">{u.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
