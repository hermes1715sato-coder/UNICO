import Link from "next/link";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import type { RaceSummary } from "@/lib/types";
import { DIRECTION_LABEL } from "@/lib/format";
import { AccessBadges, DataStatusBadge, GradeBadge, SurfaceBadge } from "@/components/ui";
import { DirectionMark } from "./DirectionMark";

export function directionText(d: RaceSummary["direction"]) {
  return d === "straight" ? DIRECTION_LABEL[d] : `${DIRECTION_LABEL[d]}回り`;
}

/**
 * レース番号プレート (UNICO Signature: マットシルバーの刻印プレート)
 * 上段に小さな英字ラベル、中央に大きな等幅数字 + R。終了レースは無地でトーンダウン。
 */
export function RaceNoBlock({
  raceNo,
  muted,
  size = "md",
  label = "RACE",
}: {
  raceNo: number;
  muted?: boolean;
  size?: "md" | "lg";
  /** 上段の英字ラベル (例: 競馬場の英名) */
  label?: string;
}) {
  return (
    <span
      className={clsx(
        "num flex shrink-0 flex-col items-center justify-center rounded-[10px] leading-none",
        size === "lg" ? "h-[72px] w-[68px]" : "h-[58px] w-[52px]",
        muted ? "border border-line bg-surface-2 text-ink-2" : "silver-plate text-ink",
      )}
      aria-label={`${raceNo}レース`}
    >
      <span
        aria-hidden
        className={clsx(
          "max-w-full truncate px-1 text-[11px] font-semibold tracking-[0.12em]",
          muted ? "text-accent-silver" : "text-[#6f7d79]",
        )}
      >
        {label}
      </span>
      <span aria-hidden className={clsx("mt-[3px] flex items-baseline font-bold tracking-[-0.03em]", size === "lg" ? "text-[30px]" : "text-[24px]")}>
        {raceNo}
        <span className={clsx("ml-[1px] font-semibold tracking-normal", size === "lg" ? "text-[13px]" : "text-[11.5px]")}>R</span>
      </span>
    </span>
  );
}

/** レース一覧の1行。スマホでは12R分を縦に素早く見渡せる密度にする。 */
export function RaceCard({ race }: { race: RaceSummary }) {
  const finished = race.status === "finished";
  const showClass = race.className !== race.name;
  const graded = race.grade === "G1" || race.grade === "G2" || race.grade === "G3";
  return (
    <Link
      href={`/race/${race.id}`}
      className={clsx(
        "group flex h-full min-w-0 items-stretch gap-2.5 rounded-[var(--radius-card)] border p-2.5 pr-3 transition-colors",
        graded && !finished && "edge-silver edge-gold",
        finished
          ? "border-line bg-surface-2/60 hover:bg-surface-2"
          : "border-line bg-surface shadow-[var(--shadow-card)] hover:border-silver",
      )}
    >
      <RaceNoBlock raceNo={race.raceNo} muted={finished} />

      <div className="min-w-0 flex-1 py-[1px]">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="flex min-w-0 items-center gap-2">
            <span className={clsx("num shrink-0 text-[14px] font-semibold tracking-[0.01em]", finished ? "text-ink-2" : "text-ink")}>
              {race.postTime}
            </span>
            <DataStatusBadge status={race.status} className="shrink-0" />
          </p>
          {(race.freeWide || race.pro !== "none") && (
            <span className="shrink-0">
              <AccessBadges freeWide={race.freeWide} pro={race.pro} />
            </span>
          )}
        </div>

        <div className="mt-1 flex items-start gap-1.5">
          <p
            className={clsx(
              "line-clamp-2 text-[15px] font-bold leading-snug",
              finished ? "text-ink-2" : "text-ink group-hover:underline group-hover:decoration-silver group-hover:underline-offset-4",
            )}
          >
            {race.name}
          </p>
          {race.grade && (
            <span className="mt-[2px] shrink-0">
              <GradeBadge grade={race.grade} />
            </span>
          )}
        </div>

        <div className="mt-1.5 flex min-w-0 items-center gap-x-2 border-t border-dashed border-line pt-1.5 text-[12.5px] text-ink-2">
          <span className="shrink-0 whitespace-nowrap">
            <SurfaceBadge surface={race.surface} distance={race.distance} />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <DirectionMark direction={race.direction} className="text-accent-silver" />
            {directionText(race.direction)}
          </span>
          <span className="num shrink-0">{race.fieldSize}頭</span>
          {showClass && <span className="truncate">{race.className}</span>}
        </div>
      </div>

      <ChevronRight
        size={18}
        strokeWidth={1.6}
        className="hidden shrink-0 self-center text-silver group-hover:text-accent-silver sm:block"
        aria-hidden
      />
    </Link>
  );
}
