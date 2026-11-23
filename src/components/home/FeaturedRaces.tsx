import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Star } from "lucide-react";
import type { RaceSummary } from "@/lib/types";
import { SURFACE_LABEL } from "@/lib/format";
import { AccessBadges, DataStatusBadge, GradeBadge } from "@/components/ui";
import { TrackOval } from "@/components/brand/TrackOval";
import { RaceNoBlock, directionText } from "@/components/selector/RaceCard";

/** 本日の注目レース (選択日の全競馬場から) */
export function FeaturedRaces({ races }: { races: RaceSummary[] }) {
  return (
    <ul className={clsx("grid gap-3 lg:gap-4", races.length > 1 && "md:grid-cols-2", races.length > 2 && "lg:grid-cols-3")}>
      {races.map((r) => (
        <li key={r.id}>
          <FeaturedRaceCard race={r} />
        </li>
      ))}
    </ul>
  );
}

function FeaturedRaceCard({ race }: { race: RaceSummary }) {
  const finished = race.status === "finished";
  const graded = race.grade === "G1" || race.grade === "G2" || race.grade === "G3";
  const specs = [
    { en: "POST", value: race.postTime, unit: "" },
    { en: race.surface === "turf" ? "TURF" : "DIRT", value: String(race.distance), unit: "m" },
    { en: "RUNNERS", value: String(race.fieldSize), unit: "頭" },
  ];
  return (
    <Link
      href={`/race/${race.id}`}
      className={clsx(
        "edge-silver group flex h-full flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface shadow-[var(--shadow-card)] transition-colors hover:border-silver",
        graded && "edge-gold",
      )}
    >
      {/* 上段: 競馬場 + 区分 */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 lg:px-5">
        <p className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold text-ink">{race.venue.name}</span>
          <span className="num text-[11px] font-semibold tracking-[0.18em] text-accent-silver">{race.venue.nameEn}</span>
        </p>
        {race.featured ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-2 py-[1px] text-[11px] font-bold text-[#8a7650]">
            <Star size={11} strokeWidth={2} aria-hidden />
            注目
          </span>
        ) : (
          <span className="rounded-full border border-line px-2 py-[1px] text-[11px] font-semibold text-ink-2">メイン</span>
        )}
      </div>

      {/* 中段: 番号プレート + レース名 + コース図 */}
      <div className="flex items-center gap-3 px-4 pt-3 lg:px-5">
        <RaceNoBlock raceNo={race.raceNo} size="lg" muted={finished} label={race.venue.nameEn} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] text-ink-2">{race.className}</p>
          <div className="mt-0.5 flex items-start gap-1.5">
            <p className="line-clamp-2 text-[18px] font-bold leading-snug text-ink lg:text-[19px]">{race.name}</p>
            {race.grade && (
              <span className="mt-[4px] shrink-0">
                <GradeBadge grade={race.grade} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* スペック: 計器の目盛り風 (縦罫区切り) + ミニコース図 */}
      <div className="mx-4 mt-4 flex items-center gap-3 border-y border-line py-3 lg:mx-5">
        <dl className="grid min-w-0 flex-1 grid-cols-3">
          {specs.map((s, i) => (
            <div key={s.en} className={clsx("min-w-0", i > 0 && "border-l border-line pl-2.5")}>
              <dt className="num text-[11px] font-semibold tracking-[0.14em] text-accent-silver">{s.en}</dt>
              <dd className="num mt-0.5 whitespace-nowrap text-[17px] font-semibold leading-tight text-ink">
                {s.value}
                {s.unit && <span className="ml-[1px] text-[11.5px] font-medium text-ink-2">{s.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex shrink-0 flex-col items-center">
          <TrackOval variant="course" direction={race.direction} width={84} />
          <span className="mt-0.5 text-[11px] text-ink-2">
            {SURFACE_LABEL[race.surface]}・{directionText(race.direction)}
            {race.trackCondition && <span className="ml-1">馬場{race.trackCondition}</span>}
          </span>
        </div>
      </div>

      {/* 下段: 状態 + 詳細 */}
      <div className="mt-auto flex items-center justify-between gap-2 px-4 py-3 lg:px-5">
        <span className="flex flex-wrap items-center gap-1.5">
          <DataStatusBadge status={race.status} />
          <AccessBadges freeWide={race.freeWide} pro={race.pro} />
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-ink">
          詳細
          <ArrowRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
