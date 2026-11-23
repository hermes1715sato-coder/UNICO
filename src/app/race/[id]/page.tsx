import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { getRaceDetailPublic, getRaces } from "@/lib/data";
import { formatDateShort, parseDate } from "@/lib/format";
import type { RaceSummary } from "@/lib/types";
import { SectionHeading } from "@/components/ui";

import { RaceHeader } from "@/components/race/RaceHeader";
import { HorseRanking } from "@/components/race/HorseRanking";
import { FreeWideCard } from "@/components/race/FreeWideCard";
import { AdSlot } from "@/components/race/parts";
import { getNow, getViewer } from "@/lib/access/session";
import { getRacePredictionView } from "@/lib/predictions/view";
import { PreRaceTicketCard } from "@/components/predictions/PreRaceTicketCard";
import { FinalTicketCard } from "@/components/predictions/FinalTicketCard";
import { ProAnalysisSection } from "@/components/predictions/ProAnalysisSection";
import { UnicornMark } from "@/components/brand/UnicornMark";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = await getRaceDetailPublic(id);
  if (!detail) return { title: "レースが見つかりません" };
  const r = detail.race;
  return {
    title: `${r.venue.name}${r.raceNo}R ${r.name}`,
    description: `${formatDateShort(r.date)} ${r.venue.name}${r.raceNo}R ${r.name} のUNICO指数ランキングと無料ワイド予想。`,
  };
}

export default async function RaceDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getRaceDetailPublic(id);
  if (!detail) notFound();

  const { race, entries, index, indexMeta, freeWide, isDemo } = detail;
  const siblings = await getRaces(race.date, race.venue.code);
  const viewer = await getViewer();
  const view = await getRacePredictionView(race.id, viewer, getNow());
  if (!view) notFound();

  // 馬番 → 馬名 / 枠 (公開情報)
  const names: Record<number, string> = {};
  const frameOf: Record<number, number> = {};
  for (const e of entries) {
    names[e.horseNo] = e.name;
    frameOf[e.horseNo] = e.frame;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 pb-4 lg:px-6 lg:pt-5">
      <RaceHeader race={race} siblings={siblings} isDemo={isDemo} />

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-6 lg:gap-y-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          {race.status === "before_entry" ? (
            <BeforeEntry race={race} />
          ) : (
            <HorseRanking entries={entries} index={index} indexMeta={indexMeta} status={race.status} />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-7" aria-label="予想・買い目">
          <FreeWideCard pick={freeWide} entries={entries} status={race.status} />
          {view.showAds && <AdSlot />}
          <section aria-labelledby="tickets-title">
            <SectionHeading id="tickets-title" index="03" en="UNICO TICKETS" title="UNICO買い目" />
            <div className="flex flex-col gap-4">
              <PreRaceTicketCard raceId={race.id} pre={view.preRace} tier={view.tier} raceClosed={view.raceClosed} />
              <FinalTicketCard fin={view.final} preHistory={view.preRace.history} tier={view.tier} names={names} frameOf={frameOf} />
            </div>
          </section>
        </aside>

        {race.status !== "before_entry" && (
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <ProAnalysisSection analysis={view.proAnalysis} frameOf={frameOf} raceId={race.id} />
          </div>
        )}
      </div>
    </div>
  );
}

/** 出馬表確定の目安: 土曜開催→木曜、日曜開催→木曜 (JRA 通常日程) */
function expectedEntryDate(date: string) {
  const w = parseDate(date).w;
  const back = w === 0 ? 3 : 2;
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - back);
  return formatDateShort(d.toISOString().slice(0, 10));
}

function BeforeEntry({ race }: { race: RaceSummary }) {
  return (
    <section aria-labelledby="ranking-title">
      <SectionHeading id="ranking-title" index="01" en="UNICO INDEX RANKING" title="UNICO指数ランキング" />
      <div className="edge-silver brushed relative overflow-hidden rounded-[var(--radius-card)] border border-line px-5 py-8 text-center shadow-[var(--shadow-card)] sm:py-10">
        <UnicornMark size={306} tone="silver" className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.14]" />
        <div className="relative">
          <span className="silver-plate mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] text-accent-silver">
            <CalendarClock size={21} strokeWidth={1.6} aria-hidden />
          </span>
          <p className="num mt-3 text-[11px] font-semibold tracking-[0.18em] text-accent-silver">BEFORE ENTRY</p>
          <p className="mt-1 text-[16px] font-bold text-ink">出走馬確定前です</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
            確定後にUNICO指数の分析を開始し、分析が完了次第このページに指数ランキングを表示します。
          </p>
          <dl className="mx-auto mt-5 inline-flex items-stretch divide-x divide-line rounded-[10px] border border-line bg-surface text-left">
            <div className="px-4 py-2.5">
              <dt className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">ENTRY</dt>
              <dd className="mt-1 text-[13px] text-ink-2">
                <span className="num text-[17px] font-semibold text-ink">{expectedEntryDate(race.date)}</span> 頃 確定予定
              </dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">RACE DAY</dt>
              <dd className="mt-1 text-[13px] text-ink-2">
                <span className="num text-[17px] font-semibold text-ink">{formatDateShort(race.date)}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
