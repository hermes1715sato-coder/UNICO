import { getNow, getViewer } from "@/lib/access/session";
import type { Viewer } from "@/lib/access/policy";
import { getProLounge } from "@/lib/pro/live";
import { IS_DEMO } from "@/lib/data";
import { formatDateShort } from "@/lib/format";
import { SectionHeading } from "@/components/ui";
import { TrackLivePanel } from "@/components/pro-live/TrackLivePanel";
import { LoungeHeader, LoungeStats } from "@/components/pro-live/lounge/LoungeHeader";
import { RaceBoard } from "@/components/pro-live/lounge/RaceBoard";
import { LiveTimeline } from "@/components/pro-live/lounge/LiveTimeline";
import { ProBenefits } from "@/components/pro-live/lounge/ProBenefits";
import { LockedLounge, type LockReason } from "@/components/pro-live/lounge/LockedLounge";
import { hhmm } from "@/components/pro-live/lounge/time";

export const metadata = {
  title: "PRO Lounge",
  description: "UNICO PRO 会員専用。当日のリアルタイム馬場・馬体重・パドック評価と、PRO対象レースの最新指数。",
};

function lockReason(v: Viewer): LockReason {
  if (v.subscription) {
    const j = new Date(Date.parse(v.subscription.currentPeriodEnd) + 9 * 3600 * 1000);
    return { kind: "expired", endedLabel: `${j.getUTCMonth() + 1}/${j.getUTCDate()}` };
  }
  if (!v.userId) return { kind: "guest" };
  return v.purchases.length ? { kind: "single" } : { kind: "free" };
}

export default async function ProLoungePage() {
  const viewer = await getViewer();
  const now = getNow();
  const dateLabel = formatDateShort(now.slice(0, 10));
  // 権限判定はサーバーで。PRO 以外にはデータを生成しない (locked のみ返る)
  const lounge = await getProLounge(viewer, now);

  if (lounge.locked) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
        <LockedLounge dateLabel={dateLabel} reason={lockReason(viewer)} isDemo={IS_DEMO} />
      </div>
    );
  }

  const { tracks, races, updates } = lounge.data;
  const next = races.find((r) => r.status !== "closed");
  const closed = races.filter((r) => r.status === "closed").length;
  const finals = races.filter((r) => r.finalPublished).length;
  const latest = updates[0]?.at ?? now;
  const featured = next?.raceId ?? races[0]?.raceId;
  const raceHref = featured ? `/pro/race/${featured}` : "#races";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 lg:space-y-10 lg:px-6 lg:py-10">
      <div>
        <LoungeHeader dateLabel={dateLabel} updatedAt={hhmm(latest)}>
          <LoungeStats
            items={[
              { label: "開催", value: tracks.map((t) => t.venueName).join("・") || "—" },
              { label: "PRO対象レース", value: <span className="num">{races.length}R</span>, sub: closed ? <>発走済 <span className="num">{closed}</span></> : undefined },
              {
                label: "次の発走",
                value: next ? <span className="num">{next.postTime}</span> : "—",
                sub: next ? (
                  <span className="num">
                    {next.venueName}
                    {next.raceNo}R
                  </span>
                ) : undefined,
              },
              { label: "最終買い目", value: <span className="num">{finals}R</span>, sub: "公開済み" },
            ]}
          />
        </LoungeHeader>
        {IS_DEMO && (
          <p className="mt-2 px-1 text-[12px] leading-relaxed text-ink-2">
            JRA-VAN の速報データは未接続です。表示中の馬場・馬体重・パドック評価・陣営コメントは DEMO 用の架空データです。
          </p>
        )}
      </div>

      <section id="track" aria-labelledby="track-title" className="scroll-mt-20">
        <SectionHeading id="track-title" index="01" en="TRACK LIVE" title="リアルタイム馬場" pro />
        {tracks.length ? (
          <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
            {tracks.map((t) => (
              <TrackLivePanel key={t.venueCode} track={t} />
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius-card)] border border-dashed border-silver bg-surface px-4 py-8 text-center text-[14px] text-ink-2">本日の開催はありません。</p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
        <section id="races" aria-labelledby="races-title" className="scroll-mt-20 lg:col-span-7">
          <SectionHeading id="races-title" index="02" en="TODAY'S RACES" title="本日のPRO対象レース" pro />
          <RaceBoard races={races} />
          <p className="mt-2 px-1 text-[12px] leading-relaxed text-ink-2">
            数値は当日補正後のUNICO指数。▲▼は前日時点からの変動です。的中や利益を保証するものではありません。
          </p>
        </section>

        <section id="timeline" aria-labelledby="timeline-title" className="scroll-mt-20 lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <SectionHeading id="timeline-title" index="03" en="TIMELINE" title="当日の更新" pro />
            <LiveTimeline updates={updates} now={now} />
          </div>
        </section>
      </div>

      <section aria-labelledby="benefits-title">
        <SectionHeading id="benefits-title" en="PRO MEMBERS" title="PRO会員のメリット" pro />
        <ProBenefits links={["#track", raceHref, raceHref, raceHref, raceHref, featured ? `/race/${featured}` : "#races"]} />
      </section>
    </div>
  );
}
