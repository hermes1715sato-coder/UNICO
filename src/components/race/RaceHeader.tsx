import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RaceSummary } from "@/lib/types";
import { DIRECTION_LABEL, SURFACE_LABEL, formatDateLong, formatDateShort, parseDate } from "@/lib/format";
import { ScrollToCurrent } from "./ScrollToCurrent";
import { Readout } from "./parts";
import { DataStatusBadge, DemoBadge, GradeBadge } from "@/components/ui";
import { TrackOval } from "@/components/brand/TrackOval";
import { UnicornMark } from "@/components/brand/UnicornMark";

const WEEK_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function racesHref(race: RaceSummary) {
  return `/races?date=${race.date}&venue=${race.venue.code}`;
}

/**
 * レースヘッダー: どのレースを見ているか一目で分かることを最優先。
 * ブラッシュ仕上げの白パネル + 刻印プレートのレース番号 + 計器風のスペック帯。
 */
export function RaceHeader({
  race,
  siblings,
  isDemo,
}: {
  race: RaceSummary;
  siblings: RaceSummary[];
  isDemo: boolean;
}) {
  const showName = race.name !== race.className;
  const [y, m, d] = race.date.split("-");
  const w = WEEK_EN[parseDate(race.date).w];

  return (
    <header className="space-y-3">
      {/* パンくず / 戻る */}
      <nav aria-label="パンくずリスト" className="flex items-center justify-between gap-3">
        <Link
          href={racesHref(race)}
          className="-ml-1.5 inline-flex min-h-9 items-center gap-0.5 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
        >
          <ChevronLeft size={17} strokeWidth={1.8} aria-hidden />
          <span>レース一覧</span>
          <span className="mx-1.5 text-silver" aria-hidden>
            /
          </span>
          <span className="num">{formatDateShort(race.date)}</span>
          <span className="ml-1">{race.venue.name}</span>
        </Link>
        {isDemo && <DemoBadge />}
      </nav>

      <div className="edge-silver brushed relative overflow-hidden rounded-[var(--radius-card-lg)] border border-line shadow-[var(--shadow-card)]">
        {/* 背景: 極細のトラックライン */}
        <UnicornMark size={276} tone="silver" className="pointer-events-none absolute -top-10 -right-56 sm:-right-28 lg:-top-14 lg:-right-10 opacity-[0.14]" />

        <div className="relative flex gap-3.5 px-3.5 pt-4 pb-4 sm:gap-5 sm:px-5 sm:pt-5 sm:pb-5 lg:px-6 lg:pt-6">
          {/* レース番号: 刻印プレート */}
          <div
            className="silver-plate relative flex h-[80px] w-[74px] shrink-0 flex-col items-center justify-center rounded-[12px] sm:h-[96px] sm:w-[88px] lg:h-[104px] lg:w-[96px]"
            aria-label={`${race.venue.name}${race.raceNo}レース`}
          >
            <span className="num text-[11px] font-semibold leading-none tracking-[0.16em] text-ink-2">{race.venue.nameEn}</span>
            <span className="mt-1 flex items-baseline leading-none text-ink">
              <span className="num text-[38px] font-extralight tracking-[-0.06em] sm:text-[48px] lg:text-[52px]">{race.raceNo}</span>
              <span className="num ml-[2px] text-[13px] font-semibold sm:text-[15px]">R</span>
            </span>
            <span className="mt-1 text-[11px] font-medium leading-none text-ink-2">{race.venue.name}</span>
            {/* 釘穴 */}
            <Rivet className="top-[5px] left-[5px]" />
            <Rivet className="top-[5px] right-[5px]" />
            <Rivet className="bottom-[5px] left-[5px]" />
            <Rivet className="bottom-[5px] right-[5px]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">
              {y}.{m}.{d} {w}
              <span className="mx-1.5 text-silver" aria-hidden>
                /
              </span>
              <span className="hidden sm:inline">{race.venue.nameEn} </span>RACE {race.raceNo}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="text-[20px] font-bold leading-snug tracking-[0.01em] text-ink sm:text-[26px] lg:text-[28px]">
                {race.name}
              </h1>
              <GradeBadge grade={race.grade} />
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-snug text-ink-2 sm:mt-1.5 sm:text-[14px]">
              <span className="sr-only">{formatDateLong(race.date)}</span>
              {showName && <span>{race.className}</span>}
              <DataStatusBadge status={race.status} />
            </p>
          </div>
        </div>

        {/* スペック帯 (計器の読み取り値) */}
        <SpecStrip race={race} />

        <RaceSwitcher race={race} siblings={siblings} />
      </div>
    </header>
  );
}

function Rivet({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={clsx("absolute h-[3px] w-[3px] rounded-full bg-white shadow-[0_0_0_1px_rgba(137,153,149,0.3)]", className)}
    />
  );
}

/**
 * スマホ: 3列 (距離 / 馬場 / 頭数) + (コース図 2列 / 発走)
 * PC: 1行 5列 (距離 / コース / 馬場 / 頭数 / 発走)
 * セル間の罫線は grid の 1px gap で描く。
 */
function SpecStrip({ race }: { race: RaceSummary }) {
  const dir = DIRECTION_LABEL[race.direction] + (race.direction === "straight" ? "" : "回り");
  const cell = "bg-surface/85 px-3.5 py-2.5 sm:px-4 sm:py-3";
  const big = "num text-[22px] font-light leading-none tracking-[-0.03em] sm:text-[24px]";
  return (
    <dl className="relative grid grid-cols-3 gap-px border-t border-line bg-line sm:grid-cols-[1.1fr_1.7fr_0.8fr_0.8fr_1fr]">
      <Readout en="DISTANCE" ja="距離" className={clsx(cell, "sm:order-1")}>
        <span className="flex items-baseline gap-1">
          <span
            className={clsx(
              "relative -top-[3px] rounded-[4px] px-1 py-[1px] text-[11px] font-bold",
              race.surface === "turf" ? "bg-turf-bg text-turf" : "bg-dirt-bg text-dirt",
            )}
          >
            {SURFACE_LABEL[race.surface]}
          </span>
          <span className={big}>{race.distance}</span>
          <span className="num text-[12px] text-ink-2">m</span>
        </span>
      </Readout>
      <Readout en="GOING" ja="馬場" className={clsx(cell, "sm:order-3")}>
        {race.trackCondition ? (
          <span className="text-[19px] font-bold leading-none">{race.trackCondition}</span>
        ) : (
          <span className="text-[14px] font-medium leading-[22px] text-ink-2">未発表</span>
        )}
      </Readout>
      <Readout en="RUNNERS" ja="出走頭数" className={clsx(cell, "sm:order-4")}>
        <span className={big}>{race.fieldSize}</span>
        <span className="ml-0.5 text-[12px] text-ink-2">頭</span>
      </Readout>
      <Readout en="COURSE" ja="コース" className={clsx(cell, "col-span-2 sm:order-2 sm:col-span-1")}>
        <span className="flex items-center gap-3">
          <TrackOval variant="course" direction={race.direction} width={88} className="-my-1" />
          <span className="text-[13.5px] font-semibold leading-tight">
            {race.venue.name}
            <span className="block text-[12.5px] font-normal text-ink-2">
              {SURFACE_LABEL[race.surface]}
              <span className="num">{race.distance}m</span>・{dir}
            </span>
          </span>
        </span>
      </Readout>
      <Readout en="POST TIME" ja="発走時刻" className={clsx(cell, "sm:order-5")}>
        <span className={big}>{race.postTime}</span>
        <span className="mt-1 block text-[11.5px] text-ink-2">発走</span>
      </Readout>
    </dl>
  );
}

/** 同じ開催場の 1R〜12R 切替 */
function RaceSwitcher({ race, siblings }: { race: RaceSummary; siblings: RaceSummary[] }) {
  if (siblings.length === 0) return null;
  const prev = siblings.find((r) => r.raceNo === race.raceNo - 1);
  const next = siblings.find((r) => r.raceNo === race.raceNo + 1);

  const arrow = (target: RaceSummary | undefined, dir: "prev" | "next") => {
    const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
    const cls = "flex h-10 w-8 shrink-0 items-center justify-center rounded-[8px] text-ink-2 transition-colors";
    if (!target) {
      return (
        <span className={clsx(cls, "text-silver")} aria-hidden>
          <Icon size={17} strokeWidth={1.8} />
        </span>
      );
    }
    return (
      <Link
        href={`/race/${target.id}`}
        className={clsx(cls, "hover:bg-surface-2 hover:text-ink")}
        aria-label={dir === "prev" ? `前のレース ${target.raceNo}R` : `次のレース ${target.raceNo}R`}
      >
        <Icon size={17} strokeWidth={1.8} />
      </Link>
    );
  };

  return (
    <nav
      aria-label={`${race.venue.name}のレース切替`}
      className="relative flex items-center gap-1 border-t border-line bg-surface px-1.5 py-1.5 sm:px-3"
    >
      {arrow(prev, "prev")}
      <ScrollToCurrent className="no-scrollbar relative flex flex-1 items-center gap-1 overflow-x-auto px-0.5 lg:justify-between">
        {siblings.map((r) => {
          const current = r.raceNo === race.raceNo;
          return (
            <li key={r.id}>
              <Link
                href={`/race/${r.id}`}
                aria-current={current ? "page" : undefined}
                title={`${r.raceNo}R ${r.name} ${r.postTime}発走`}
                className={clsx(
                  "relative flex h-10 min-w-[42px] flex-col items-center justify-center rounded-[8px] px-1.5 leading-none transition-colors lg:h-11 lg:min-w-[52px]",
                  current ? "bg-charcoal text-white" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <span className="num text-[13.5px] font-bold">
                  {r.raceNo}
                  <span className="text-[11px]">R</span>
                </span>
                <span className={clsx("num mt-1 hidden text-[11px]", current ? "text-white/70" : "text-accent-silver", "lg:block")}>
                  {r.postTime}
                </span>
                {current && <span aria-hidden className="absolute inset-x-3 bottom-[4px] h-px bg-gold" />}
              </Link>
            </li>
          );
        })}
      </ScrollToCurrent>
      {arrow(next, "next")}
    </nav>
  );
}
