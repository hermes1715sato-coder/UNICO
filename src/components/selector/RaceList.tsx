import Link from "next/link";
import { CalendarX2, MapPin } from "lucide-react";
import type { RaceSummary, Venue } from "@/lib/types";
import { formatDateShort, parseDate, weekdayOf, isHoliday } from "@/lib/format";
import { DemoBadge, EmptyState, buttonClass } from "@/components/ui";
import { RaceCard } from "./RaceCard";
import { selectionHref } from "./resolve";

/**
 * 「現在表示中」サマリー (スクロール中も上部に残る) + レース一覧。
 * 旧プロトタイプの「どのレースを見ているか分かりにくい」問題への対策。
 */
export function RaceList({
  date,
  venue,
  races,
  nextMeetingDate,
  basePath,
  isDemo,
  hash,
}: {
  date: string;
  venue: Venue | null;
  races: RaceSummary[];
  nextMeetingDate: string | null;
  basePath: string;
  isDemo: boolean;
  hash?: string;
}) {
  const p = parseDate(date);
  const wd = `${weekdayOf(date)}${isHoliday(date) ? "・祝" : ""}`;

  if (!venue) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="この日は開催がありません"
        description={
          nextMeetingDate
            ? `次回の開催は ${formatDateShort(nextMeetingDate)} です。`
            : "開催予定が発表され次第、こちらに表示します。"
        }
        action={
          nextMeetingDate && (
            <Link href={selectionHref(basePath, nextMeetingDate, undefined, hash)} className={buttonClass("primary")}>
              <span className="num">{formatDateShort(nextMeetingDate)}</span>のレースを見る
            </Link>
          )
        }
      />
    );
  }

  const analyzed = races.filter((r) => r.status === "analyzed").length;
  const finishedCount = races.filter((r) => r.status === "finished").length;
  const proOnSale = races.filter((r) => r.pro === "on_sale").length;

  return (
    <div>
      {/* 現在表示中 */}
      <div className="sticky top-14 z-20 -mx-4 mb-3 border-b border-line bg-bg/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-bg/85 lg:top-16 lg:mx-0 lg:rounded-[12px] lg:border lg:bg-surface/95 lg:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="hidden h-9 w-px bg-gold/70 sm:block" />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-accent-silver">
                <span className="num tracking-[0.18em]">NOW SHOWING</span>
                <span className="text-ink-2">現在表示中</span>
              </p>
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[17px] font-bold leading-tight text-ink">
                <span>
                  <span className="num">{p.m}</span>月<span className="num">{p.d}</span>日({wd})
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={15} strokeWidth={2} className="text-accent-silver" aria-hidden />
                  {venue.name}
                  <span className="num ml-1 hidden text-[11px] font-semibold tracking-[0.16em] text-accent-silver sm:inline">
                    {venue.nameEn}
                  </span>
                </span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {isDemo && <DemoBadge />}
            <p className="flex items-baseline text-[11.5px] text-ink-2">
              <span>
                全<span className="num ml-0.5 font-semibold text-ink">{races.length}</span>R
              </span>
              <span className="ml-2 border-l border-line pl-2">
                {finishedCount === races.length ? "レース終了" : "分析完了"}
                <span className="num ml-0.5 font-semibold text-ink">{finishedCount === races.length ? finishedCount : analyzed}</span>
              </span>
              <span className="ml-2 hidden border-l border-line pl-2 sm:inline">
                買い目対象<span className="num ml-0.5 font-semibold text-ink">{proOnSale}</span>
              </span>
            </p>
          </div>
        </div>
      </div>

      {races.length === 0 ? (
        <EmptyState title="レース情報はまだありません" description="出馬表が発表され次第、表示します。" />
      ) : (
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-2 lg:grid-cols-2 lg:gap-3 xl:grid-cols-3">
          {races.map((r) => (
            <li key={r.id}>
              <RaceCard race={r} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
