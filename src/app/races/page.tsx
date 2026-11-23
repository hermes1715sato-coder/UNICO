import type { Metadata } from "next";
import { IS_DEMO } from "@/lib/data";
import { DemoBadge } from "@/components/ui";
import { parseDate } from "@/lib/format";

import { MONTH_EN, RaceSelector, StepLabel } from "@/components/selector/RaceSelector";
import { RaceList } from "@/components/selector/RaceList";
import { resolveSelection, type SearchParams } from "@/components/selector/resolve";
import { UnicornMark } from "@/components/brand/UnicornMark";

export const metadata: Metadata = { title: "レース一覧" };

export default async function RacesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sel = await resolveSelection(await searchParams);
  const { m, d } = parseDate(sel.date);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
      {/* ページ見出し: 細い大文字 + 縦罫 + 楕円トラックの細線 */}
      <header className="relative mb-4 overflow-hidden lg:mb-5">
        <UnicornMark size={240} tone="silver" className="pointer-events-none absolute -right-[90px] -top-[40px] lg:-right-[40px] lg:-top-[70px] lg:w-[420px] opacity-[0.14]" />
        <div className="relative flex items-end gap-3">
          <span aria-hidden className="num -mb-[3px] text-[40px] font-extralight leading-none tracking-[-0.04em] text-silver lg:text-[48px]">
            {String(d).padStart(2, "0")}
          </span>
          <div className="border-l border-line pl-3">
            <p className="num text-[11px] font-semibold tracking-[0.2em] text-accent-silver">
              RACE CARD<span className="mx-1.5 text-silver">/</span>
              {MONTH_EN[m - 1]} {d}
            </p>
            <h1 className="mt-0.5 text-[20px] font-bold leading-tight text-ink lg:text-[22px]">レース一覧</h1>
          </div>
          {IS_DEMO && (
            <span className="mb-1 ml-auto">
              <DemoBadge />
            </span>
          )}
        </div>
      </header>

      <RaceSelector basePath="/races" dates={sel.dates} date={sel.date} venues={sel.venues} venue={sel.venue} />

      <section className="mt-6" aria-labelledby="race-list-heading">
        <h2 id="race-list-heading" className="sr-only">
          レース
        </h2>
        <div className="mb-2.5">
          <StepLabel n="03" label="レース" en="RACE" />
        </div>
        <RaceList
          basePath="/races"
          date={sel.date}
          venue={sel.venue}
          races={sel.races}
          nextMeetingDate={sel.nextMeetingDate}
          isDemo={IS_DEMO}
        />
      </section>
    </div>
  );
}
