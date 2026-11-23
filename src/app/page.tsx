import Link from "next/link";
import { ArrowRight, CalendarX2 } from "lucide-react";
import { getRacesOfDay, IS_DEMO } from "@/lib/data";
import { formatDateShort } from "@/lib/format";
import { DemoBadge, EmptyState, SectionHeading } from "@/components/ui";
import { ProIntroCard } from "@/components/pro/ProIntroCard";
import { RaceSelector, StepLabel } from "@/components/selector/RaceSelector";
import { RaceList } from "@/components/selector/RaceList";
import { resolveSelection, selectionHref, type SearchParams } from "@/components/selector/resolve";
import { HomeHero } from "@/components/home/HomeHero";
import { FeaturedRaces } from "@/components/home/FeaturedRaces";
import { IndexIntro } from "@/components/home/IndexIntro";
import { FreeWideIntro } from "@/components/home/FreeWideIntro";
import { AdSlot } from "@/components/home/AdSlot";
import { NewsList } from "@/components/home/NewsList";
import { getNow, getViewer } from "@/lib/access/session";
import { showAds } from "@/lib/access/policy";

const ANCHOR = "race-select";

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sel = await resolveSelection(await searchParams);
  const ads = showAds(await getViewer(), getNow());
  const dayRaces = sel.venue ? await getRacesOfDay(sel.date) : [];

  // 注目レース: featured を先頭に、各競馬場のメインレース (11R) を並べる
  const featured = dayRaces
    .filter((r) => r.featured || r.raceNo === 11)
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  const featuredTitle = sel.date === sel.today ? "本日の注目レース" : `${formatDateShort(sel.date)}の注目レース`;

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-4 py-5 lg:space-y-12 lg:px-6 lg:py-8">
      <HomeHero />

      {/* 開催日 → 競馬場 → レース */}
      <section id={ANCHOR} className="scroll-mt-16 lg:scroll-mt-20" aria-label="レースを選ぶ">
        <SectionHeading index="01" en="RACES" title="レースを選ぶ" />
        <RaceSelector basePath="/" dates={sel.dates} date={sel.date} venues={sel.venues} venue={sel.venue} hash={ANCHOR} />

        <div className="mt-6">
          <h3 className="sr-only">レース一覧</h3>
          <div className="mb-2.5">
            <StepLabel n="03" label="レース" en="RACE" />
          </div>
          <RaceList
            basePath="/"
            hash={ANCHOR}
            date={sel.date}
            venue={sel.venue}
            races={sel.races}
            nextMeetingDate={sel.nextMeetingDate}
            isDemo={IS_DEMO}
          />
          <div className="mt-3 flex justify-end">
            <Link
              href={selectionHref("/races", sel.date, sel.venue?.code)}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2 hover:text-ink"
            >
              レース一覧ページで見る
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {ads && <AdSlot id="home-1" />}

      <section>
        <SectionHeading index="02" en="FEATURED" title={featuredTitle} action={IS_DEMO ? <DemoBadge /> : undefined} />
        {featured.length > 0 ? (
          <FeaturedRaces races={featured} />
        ) : (
          <EmptyState
            icon={CalendarX2}
            title="この日の注目レースはありません"
            description={sel.nextMeetingDate ? `次回開催 ${formatDateShort(sel.nextMeetingDate)} の注目レースを確認できます。` : undefined}
            action={
              sel.nextMeetingDate && (
                <Link
                  href={selectionHref("/", sel.nextMeetingDate, undefined, ANCHOR)}
                  className="inline-flex items-center gap-1 text-[14px] font-semibold text-ink underline decoration-silver underline-offset-4"
                >
                  <span className="num">{formatDateShort(sel.nextMeetingDate)}</span>を表示
                </Link>
              )
            }
          />
        )}
      </section>

      <section>
        <SectionHeading index="03" en="UNICO INDEX" title="UNICO指数とは" />
        <IndexIntro />
      </section>

      <section>
        <SectionHeading index="04" en="FREE WIDE" title="無料ワイド予想" />
        <FreeWideIntro />
      </section>

      <section>
        <ProIntroCard variant="home" />
      </section>

      {ads && <AdSlot id="home-2" />}

      <section>
        <SectionHeading index="05" en="NEWS" title="お知らせ" />
        <NewsList />
      </section>
    </div>
  );
}
