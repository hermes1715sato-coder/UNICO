import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { getRaceDetailPublic, getRaces } from "@/lib/data";
import { formatDateShort, parseDate } from "@/lib/format";
import type { RaceSummary } from "@/lib/types";
import { SectionHeading } from "@/components/ui";
import { TrackOval } from "@/components/brand/TrackOval";
import { RaceHeader } from "@/components/race/RaceHeader";
import { HorseRanking } from "@/components/race/HorseRanking";
import { FreeWideCard } from "@/components/race/FreeWideCard";
import { AdSlot } from "@/components/race/parts";
import { ProIntroCard } from "@/components/pro/ProIntroCard";

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

  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 pb-4 lg:px-6 lg:pt-5">
      <RaceHeader race={race} siblings={siblings} isDemo={isDemo} />

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {race.status === "before_entry" ? (
            <BeforeEntry race={race} />
          ) : (
            <HorseRanking entries={entries} index={index} indexMeta={indexMeta} status={race.status} />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-6 lg:gap-7" aria-label="予想・PRO">
          <FreeWideCard pick={freeWide} entries={entries} status={race.status} />
          <AdSlot />
          {/* PC: ランキングをスクロールしている間も PRO カードを右レールに追従させる */}
          <div className="lg:sticky lg:top-[84px]">
            <ProIntroCard variant="race" index="03" raceId={race.id} available={race.pro === "on_sale"} status={race.pro} />
          </div>
        </aside>
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
        <TrackOval variant="decor" width={680} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-45" />
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
