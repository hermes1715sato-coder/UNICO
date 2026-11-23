import Link from "next/link";
import clsx from "clsx";
import { ChevronDown, History, Lock } from "lucide-react";
import type { AccessTier } from "@/lib/access/policy";
import { PRO_MONTHLY_PRICE_JPY } from "@/lib/access/policy";
import type { RacePredictionView } from "@/lib/predictions/view";
import { buttonClass } from "@/components/ui";
import { DiffView, Disclaimer, HistoryList, MarkList, PublishMeta, StakeBar, TicketGroups, fmtJst, yen, type FrameOf } from "./parts";
import { UnicornMark } from "@/components/brand/UnicornMark";

/**
 * UNICO PRO 最終買い目 (PRO会員限定)。白地 + 上端ゴールド細線 + 王冠。暗くしない。
 * 非PROには実データを一切渡さない (view.final.data は null)。プレースホルダのみ描画。
 */
export function FinalTicketCard({
  fin,
  preHistory,
  tier,
  names,
  frameOf,
}: {
  fin: RacePredictionView["final"];
  preHistory: RacePredictionView["preRace"]["history"];
  tier: AccessTier;
  names: Record<number, string>;
  frameOf: FrameOf;
}) {
  const isPro = tier === "PRO";
  return (
    <section
      aria-labelledby="final-title"
      className="edge-silver edge-gold overflow-hidden rounded-[var(--radius-card-lg)] border border-gold/35 bg-surface shadow-[var(--shadow-card)]"
    >
      <header className="border-b border-line px-4 pt-4 pb-3.5">
        <div className="flex items-start gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-surface">
            <span aria-hidden className="absolute inset-[3px] rounded-full border border-gold/25" />
            <UnicornMark size={21} tone="gold" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded-[5px] border border-gold/60 px-1.5 text-[11px] font-bold leading-[18px] text-gold-ink">最終・PRO</span>
              <span className="num text-[11px] font-semibold tracking-[0.18em] text-gold-ink">FINAL</span>
            </div>
            <h3 id="final-title" className="mt-1 text-[17px] font-bold leading-tight text-ink">
              UNICO PRO 最終買い目
            </h3>
          </div>
          <p className="shrink-0 pt-0.5 text-right text-[11.5px] font-semibold leading-tight text-gold-ink">
            PRO会員
            <br />
            限定
          </p>
        </div>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">当日の最新情報を反映した最終買い目と資金配分</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-2">AI予想印（◎○▲△☆注）・最終券種・資金配分・合計金額</p>
      </header>

      <div className="px-4 py-4">
        <Body fin={fin} isPro={isPro} names={names} frameOf={frameOf} preHistory={preHistory} />
        <Disclaimer className="mt-3" />
      </div>
    </section>
  );
}

function Body({
  fin,
  isPro,
  names,
  frameOf,
  preHistory,
}: {
  fin: RacePredictionView["final"];
  isPro: boolean;
  names: Record<number, string>;
  frameOf: FrameOf;
  preHistory: RacePredictionView["preRace"]["history"];
}) {
  if (fin.state === "not_target") {
    return (
      <div className="rounded-[12px] border border-dashed border-silver px-3.5 py-3">
        <p className="text-[14px] font-bold text-ink">このレースは買い目の対象外です</p>
        <p className="mt-0.5 text-[12.5px] text-ink-2">最終買い目は予想対象レースのみ提供しています。</p>
      </div>
    );
  }

  if (fin.state === "preparing") {
    return (
      <>
        <div className="flex items-start gap-3 rounded-[12px] border border-dashed border-gold/45 px-3.5 py-3">
          <span className="num mt-[1px] shrink-0 rounded-[4px] border border-gold/50 px-1.5 text-[11px] font-semibold leading-[18px] tracking-[0.1em] text-gold-ink">
            SOON
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">最終予想準備中</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">
              {isPro && fin.scheduledAt ? (
                <>
                  <span className="num font-semibold text-ink">{fmtJst(fin.scheduledAt)}</span> 公開予定です。
                </>
              ) : (
                "発走前に、当日の最新情報を反映して公開します。"
              )}
            </p>
          </div>
        </div>
        {isPro ? <ProHistory fin={fin} preHistory={preHistory} /> : <JoinPro className="mt-3" />}
      </>
    );
  }

  if (fin.state === "locked") {
    return (
      <>
        <LockedPreview />
        <JoinPro className="mt-3" />
      </>
    );
  }

  const data = fin.data!;
  return (
    <>
      <details id="final-tickets" className="group scroll-mt-24">
        <summary className="flex h-12 w-full cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-gold/50 bg-surface text-[15px] font-semibold text-ink transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
          <UnicornMark size={17} tone="gold" />
          <span className="group-open:hidden">最終買い目を見る</span>
          <span className="hidden group-open:inline">最終買い目を閉じる</span>
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-4 space-y-4">
          <PublishMeta publishedAt={data.publishedAt} version={data.version} status={data.predictionStatus} />
          <MarkList marks={data.marks} names={names} frameOf={frameOf} />
          <div aria-hidden className="gold-rule opacity-50" />
          <TicketGroups lines={data.lines} gold />
          <StakeBar allocation={data.stakeAllocation} total={data.totalStake} gold />
        </div>
      </details>
      <ProHistory fin={fin} preHistory={preHistory} />
    </>
  );
}

function ProHistory({ fin, preHistory }: { fin: RacePredictionView["final"]; preHistory: RacePredictionView["preRace"]["history"] }) {
  const hasHistory = (fin.history?.length ?? 0) > 0 || (preHistory?.length ?? 0) > 0;
  if (!hasHistory && !fin.diff) return null;
  return (
    <details className="group/h mt-3 rounded-[12px] border border-line">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3 text-[13.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <History size={15} strokeWidth={1.7} className="text-accent-silver" aria-hidden />
        公開履歴{fin.diff && "・事前からの変更"}
        <ChevronDown size={15} className="ml-auto text-ink-2 transition-transform group-open/h:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-4 border-t border-line px-3.5 py-3.5">
        {fin.diff && (
          <div>
            <p className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">
              CHANGES<span className="ml-1.5 font-normal tracking-normal text-ink-2">事前からの変更</span>
            </p>
            <div className="mt-2">
              <DiffView diff={fin.diff} />
            </div>
          </div>
        )}
        <HistoryList title="最終買い目" items={fin.history ?? []} />
        <HistoryList title="事前買い目" items={preHistory ?? []} />
      </div>
    </details>
  );
}

function JoinPro({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link href="/pro/plans" className={clsx(buttonClass("primary", "lg"), "w-full")}>
        <UnicornMark size={17} tone="gold" />
        PROに登録して最終買い目を見る
      </Link>
      <p className="mt-2 text-center text-[12px] text-ink-2">
        UNICO PRO 月額 <span className="num font-semibold text-ink">{yen(PRO_MONTHLY_PRICE_JPY)}</span>円（税込）・事前買い目も含みます
      </p>
    </div>
  );
}

/** 鍵付きプレビュー (装飾のみ。実データは描画しない) */
function LockedPreview() {
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-line" aria-hidden>
      <div className="brushed select-none space-y-3 px-3.5 py-3.5 blur-[2px]">
        <div className="flex gap-1.5">
          {["◎", "○", "▲", "△"].map((m) => (
            <span key={m} className="flex h-7 flex-1 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-1.5">
              <span className="h-4 w-4 rounded-full border border-gold/50" />
              <span className="h-2 flex-1 rounded-full bg-silver" />
            </span>
          ))}
        </div>
        {[4, 3, 2].map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-10 rounded-full bg-silver" />
            {Array.from({ length: n }).map((_, j) => (
              <span key={j} className="h-6 w-12 rounded-[6px] border border-line bg-surface" />
            ))}
          </div>
        ))}
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <span className="w-1/2 bg-gold/40" />
          <span className="w-1/3 bg-silver" />
          <span className="flex-1 bg-silver-surface" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-surface/35">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-surface px-3.5 py-1.5 text-[12px] font-semibold text-ink-2 shadow-[var(--shadow-card)]">
          <Lock size={13} strokeWidth={1.8} className="text-gold" />
          PRO会員限定
        </span>
      </div>
    </div>
  );
}
