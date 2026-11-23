import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import type { RaceSummary } from "@/lib/types";
import { SURFACE_LABEL, formatDateShort } from "@/lib/format";
import { DemoBadge, GradeBadge } from "@/components/ui";

import { UnicornMark } from "@/components/brand/UnicornMark";

export type LiveState = { kind: "live"; updatedAt: string } | { kind: "closed"; updatedAt: string } | { kind: "none" };

/**
 * PRO レース分析ページのヘッダー (無料ページの RaceHeader より細身)。
 * レース情報は公開情報のみ。ロック時も同じ見た目で表示する。
 */
export function ProRaceHeader({
  race,
  isDemo,
  live,
}: {
  race: RaceSummary;
  isDemo: boolean;
  live: LiveState;
}) {
  return (
    <header className="space-y-3">
      <nav aria-label="戻る" className="flex items-center justify-between gap-3">
        <Link
          href={`/race/${race.id}`}
          className="-ml-1.5 inline-flex min-h-9 items-center gap-0.5 rounded-full py-1 pr-3 pl-1 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
        >
          <ChevronLeft size={17} strokeWidth={1.8} aria-hidden />
          無料のレースページへ
        </Link>
        {isDemo && <DemoBadge />}
      </nav>

      <div className="edge-silver edge-gold brushed relative overflow-hidden rounded-[var(--radius-card-lg)] border border-line shadow-[var(--shadow-card)]">
        <UnicornMark size={252} tone="gold" className="pointer-events-none absolute -top-12 -right-48 sm:-right-24 lg:-right-8 opacity-[0.10]" />
        <div className="relative flex items-start gap-3.5 px-4 pt-4 pb-4 sm:gap-5 sm:px-5 sm:pt-5 lg:px-6">
          <div
            className="silver-plate flex h-[62px] w-[58px] shrink-0 flex-col items-center justify-center rounded-[10px] sm:h-[72px] sm:w-[66px]"
            aria-label={`${race.venue.name}${race.raceNo}レース`}
          >
            <span className="flex items-baseline leading-none text-ink">
              <span className="num text-[30px] font-extralight tracking-[-0.06em] sm:text-[36px]">{race.raceNo}</span>
              <span className="num ml-[1px] text-[12px] font-semibold">R</span>
            </span>
            <span className="mt-1 text-[11px] font-medium leading-none text-ink-2">{race.venue.name}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="num inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.2em] text-gold-ink">
                <UnicornMark size={15} tone="gold" />
                PRO ANALYSIS
              </span>
              <LiveChip live={live} />
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="text-[19px] font-bold leading-snug text-ink sm:text-[24px]">{race.name}</h1>
              <GradeBadge grade={race.grade} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px] text-ink-2">
              <span className="num">{formatDateShort(race.date)}</span>
              <span>
                {race.venue.name}
                <span className="num">{race.raceNo}R</span>
              </span>
              <span className={clsx("font-semibold", race.surface === "turf" ? "text-turf" : "text-dirt")}>
                {SURFACE_LABEL[race.surface]}
                <span className="num">{race.distance}m</span>
              </span>
              <span>
                <span className="num">{race.fieldSize}</span>頭
              </span>
              <span>
                <span className="num font-semibold text-ink">{race.postTime}</span> 発走
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function LiveChip({ live }: { live: LiveState }) {
  if (live.kind === "none") return null;
  const t = live.updatedAt;
  return live.kind === "live" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok-bg px-2 py-[1px] text-[11px] font-semibold text-ok">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" aria-hidden />
      <span className="num tracking-[0.12em]">LIVE</span>
      <span className="font-medium">
        <span className="num">{t}</span> 更新
      </span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-[1px] text-[11px] font-semibold text-ink-2">
      締切済
      <span className="font-medium">
        最終更新 <span className="num">{t}</span>
      </span>
    </span>
  );
}
