import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hourglass } from "lucide-react";
import { getRace, IS_DEMO } from "@/lib/data";
import { getNow, getViewer } from "@/lib/access/session";
import { getProRaceAnalysis } from "@/lib/pro/live";
import { DemoBadge, EmptyState, buttonClass } from "@/components/ui";
import { ProRaceHeader, type LiveState } from "@/components/pro-live/race/ProRaceHeader";
import { LiveSection } from "@/components/pro-live/race/LiveSection";
import { LiveIndexBoard } from "@/components/pro-live/race/LiveIndexBoard";
import { PaceSection } from "@/components/pro-live/race/PaceSection";
import { HorseDetailList } from "@/components/pro-live/race/HorseDetailList";
import { LockedTeaser } from "@/components/pro-live/race/LockedTeaser";
import { jstHM } from "@/components/pro-live/race/format";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const race = await getRace(id);
  if (!race) return { title: "レースが見つかりません" };
  return {
    title: `PRO分析 ${race.venue.name}${race.raceNo}R ${race.name}`,
    description: `${race.venue.name}${race.raceNo}R ${race.name} のPRO会員向け詳細分析（当日補正指数・展開・陣営AI・血統・騎手・追い切り）。`,
    robots: { index: false },
  };
}

export default async function ProRacePage({ params }: Props) {
  const { id } = await params;
  const race = await getRace(id);
  if (!race) notFound();
  const viewer = await getViewer();
  const now = getNow();
  const res = await getProRaceAnalysis(id, viewer, now);
  if (!res) notFound();

  const wrap = "mx-auto max-w-6xl px-4 pt-3 pb-4 lg:px-6 lg:pt-5";

  if (res.locked) {
    return (
      <div className={wrap}>
        <ProRaceHeader race={race} isDemo={IS_DEMO} live={{ kind: "none" }} />
        <div className="mt-6 lg:mt-8">
          <LockedTeaser raceId={race.id} />
        </div>
      </div>
    );
  }

  const a = res.data;
  if (!a) {
    return (
      <div className={wrap}>
        <ProRaceHeader race={race} isDemo={IS_DEMO} live={{ kind: "none" }} />
        <EmptyState
          className="mt-6"
          icon={Hourglass}
          title="このレースの分析は準備中です"
          description="出走馬の確定とUNICO指数の分析が完了すると、このページにPRO分析を表示します。"
          action={
            <Link href={`/race/${race.id}`} className={buttonClass("secondary")}>
              無料のレースページへ
            </Link>
          }
        />
      </div>
    );
  }

  const isToday = race.date === now.slice(0, 10);
  const live: LiveState = a.phase.closed
    ? { kind: "closed", updatedAt: jstHM(a.updatedAt) }
    : isToday
      ? { kind: "live", updatedAt: jstHM(a.updatedAt) }
      : { kind: "none" };

  return (
    <div className={wrap}>
      <ProRaceHeader race={race} isDemo={IS_DEMO} live={live} />
      {IS_DEMO && (
        <p className="mt-3 flex items-start gap-2 rounded-[10px] border border-warn/20 bg-warn-bg px-3 py-1.5 text-[12px] leading-relaxed text-warn">
          <DemoBadge className="mt-[1px] shrink-0" />
          陣営コメント・パドック評価・馬場情報・馬体重は架空のデータです。
        </p>
      )}

      <div className="mt-7 flex flex-col gap-10 lg:mt-9 lg:gap-12">
        <LiveSection race={race} a={a} />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
          <div className="min-w-0">
            <LiveIndexBoard a={a} />
          </div>
          <div className="min-w-0 lg:sticky lg:top-20">
            <PaceSection a={a} />
          </div>
        </div>
        <HorseDetailList a={a} />
        <p className="text-[12px] leading-relaxed text-ink-2">
          UNICO指数・各分析は過去データと当日情報に基づく参考情報であり、レース結果を保証するものではありません。
        </p>
      </div>
    </div>
  );
}
