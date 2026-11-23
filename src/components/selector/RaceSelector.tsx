import Link from "next/link";
import clsx from "clsx";
import type { Venue } from "@/lib/types";
import { DIRECTION_LABEL, isHoliday, parseDate, weekdayOf } from "@/lib/format";
import { ChipScroller } from "./ChipScroller";
import { DirectionMark, VENUE_DIRECTION } from "./DirectionMark";
import { selectionHref, type DateOption } from "./resolve";

export const MONTH_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/**
 * 開催日タブ + 競馬場タブ。すべて <Link> + クエリパラメータで動作 (JS不要)。
 * 選択中 = チャコール塗り / 今日 = 「今日」タグ。両者は別の表現で、混同しない。
 * 計器のコントロールパネルのような1枚のパネルにまとめる。
 */
export function RaceSelector({
  basePath,
  dates,
  date,
  venues,
  venue,
  hash,
}: {
  basePath: string;
  dates: DateOption[];
  date: string;
  venues: Venue[];
  venue: Venue | null;
  /** リンク先でスクロールさせるアンカー */
  hash?: string;
}) {
  return (
    <div className="space-y-4 rounded-[var(--radius-card-lg)] border border-line bg-surface px-4 pb-4 pt-3.5 shadow-[var(--shadow-card)] lg:px-5 lg:pb-5">
      <div>
        <StepLabel n="01" label="開催日" en="DATE" />
        <ChipScroller label="開催日を選択" className="-mx-4 px-4 lg:-mx-5 lg:px-5">
          <ul className="flex gap-2 pb-1 pt-3">
            {dates.map((d) => (
              <li key={d.date} className="shrink-0">
                <DateChip option={d} selected={d.date === date} href={selectionHref(basePath, d.date, undefined, hash)} scroll={!!hash} />
              </li>
            ))}
          </ul>
        </ChipScroller>
      </div>

      <div>
        <StepLabel n="02" label="競馬場" en="VENUE" />
        {venues.length > 0 ? (
          <ul className="mt-2.5 flex gap-2" role="group" aria-label="競馬場を選択">
            {venues.map((v) => {
              const selected = v.code === venue?.code;
              const dir = VENUE_DIRECTION[v.code];
              return (
                <li key={v.code} className="min-w-0 flex-1 sm:flex-none">
                  <Link
                    href={selectionHref(basePath, date, v.code, hash)}
                    aria-current={selected ? "true" : undefined}
                    scroll={!!hash}
                    className={clsx(
                      "relative flex h-[56px] items-center justify-between gap-2 overflow-hidden rounded-[12px] border pl-3.5 pr-3 transition-colors sm:min-w-[168px]",
                      selected
                        ? "border-charcoal bg-charcoal text-white"
                        : "border-line bg-surface text-ink hover:border-silver hover:bg-surface-2",
                    )}
                  >
                    {selected && <span aria-hidden className="absolute inset-x-3 bottom-0 h-px bg-gold/80" />}
                    <span className="min-w-0">
                      <span className="block text-[16px] font-bold leading-tight">{v.name}</span>
                      <span
                        className={clsx(
                          "num mt-0.5 block truncate text-[11px] font-semibold leading-none tracking-[0.16em]",
                          selected ? "text-white/60" : "text-accent-silver",
                        )}
                      >
                        {v.nameEn}
                      </span>
                    </span>
                    {dir && (
                      <span
                        className={clsx(
                          "flex shrink-0 flex-col items-center gap-0.5",
                          selected ? "text-white/75" : "text-accent-silver",
                        )}
                      >
                        <DirectionMark direction={dir} />
                        <span className="text-[11px] font-semibold leading-none">
                          {dir === "straight" ? DIRECTION_LABEL[dir] : `${DIRECTION_LABEL[dir]}回り`}
                        </span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2.5 rounded-[12px] border border-dashed border-silver bg-surface-2/60 px-4 py-3 text-[14px] text-ink-2">
            この日は開催する競馬場がありません
          </p>
        )}
      </div>
    </div>
  );
}

export function StepLabel({ n, label, en }: { n: string; label: string; en: string }) {
  return (
    <p className="flex items-center gap-2.5">
      <span className="num text-[11px] font-semibold tracking-[0.18em] text-accent-silver">
        STEP<span className="ml-1 text-ink">{n}</span>
      </span>
      <span aria-hidden className="h-3 w-px bg-silver" />
      <span className="text-[14px] font-bold text-ink">{label}</span>
      <span className="num text-[11px] font-semibold tracking-[0.18em] text-accent-silver">{en}</span>
      <span aria-hidden className="silver-rule ml-1 flex-1" />
    </p>
  );
}

function DateChip({ option, selected, href, scroll }: { option: DateOption; selected: boolean; href: string; scroll: boolean }) {
  const { m, d, w } = parseDate(option.date);
  const holiday = isHoliday(option.date);
  const tone = w === 0 || holiday ? "sun" : w === 6 ? "sat" : "week";
  const wdColor = selected
    ? { sun: "text-[#f3b0a8]", sat: "text-[#b3d0ec]", week: "text-white/70" }[tone]
    : { sun: "text-danger", sat: "text-info", week: "text-ink-2" }[tone];

  return (
    <Link
      href={href}
      scroll={scroll}
      aria-current={selected ? "date" : undefined}
      aria-label={`${m}月${d}日(${weekdayOf(option.date)}${holiday ? "・祝" : ""})${option.isToday ? " 今日" : ""}${option.hasMeeting ? "" : " 開催なし"}`}
      className={clsx(
        "relative flex h-[66px] w-[58px] flex-col items-center justify-center rounded-[12px] border transition-colors",
        selected
          ? "border-charcoal bg-charcoal text-white"
          : option.hasMeeting
            ? "border-line bg-surface text-ink hover:border-silver hover:bg-surface-2"
            : "border-dashed border-silver bg-surface-2/70 text-ink-2 hover:bg-silver-surface",
      )}
    >
            {option.isToday ? (
        <span
          aria-hidden
          className={clsx(
            "-my-[2px] rounded-full border px-1.5 text-[11px] font-bold leading-[14px]",
            selected ? "border-white/70 text-white" : "border-ink bg-surface text-ink",
          )}
        >
          今日
        </span>
      ) : (
        <span
          aria-hidden
          className={clsx("num text-[11px] font-semibold leading-none tracking-[0.12em]", selected ? "text-white/55" : "text-accent-silver")}
        >
          {MONTH_EN[m - 1]}
        </span>
      )}
      <span aria-hidden className="num mt-1 text-[20px] font-bold leading-none tracking-[-0.02em]">
        {d}
      </span>
      <span aria-hidden className={clsx("mt-1 text-[11.5px] font-semibold leading-none", wdColor)}>
        {weekdayOf(option.date)}
        {holiday && "・祝"}
      </span>
      {selected && <span aria-hidden className="absolute inset-x-3 bottom-[5px] h-px bg-gold/80" />}
      {!option.hasMeeting && !selected && <span className="sr-only">開催なし</span>}
    </Link>
  );
}
