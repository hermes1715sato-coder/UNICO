import clsx from "clsx";
import { ChevronDown, Clock, LogIn } from "lucide-react";
import type { AccessTier } from "@/lib/access/policy";
import type { RacePredictionView } from "@/lib/predictions/view";
import { CheckoutButton } from "./CheckoutButton";
import { Disclaimer, PublishMeta, StakeBar, TicketGroups, fmtJst, yen } from "./parts";

/**
 * UNICO 事前買い目 (300円 / 1レース)。マットシルバーのみ (ゴールドは使わない)。
 * 表示は view.preRace の状態だけで決める。data は閲覧権限がある場合のみ存在する。
 */
export function PreRaceTicketCard({
  raceId,
  pre,
  tier,
  raceClosed,
}: {
  raceId: string;
  pre: RacePredictionView["preRace"];
  tier: AccessTier;
  raceClosed: boolean;
}) {
  return (
    <section
      aria-labelledby="pre-race-title"
      className="edge-silver overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface shadow-[var(--shadow-card)]"
    >
      <header className="brushed border-b border-line px-4 pt-4 pb-3.5">
        <div className="flex items-start gap-3">
          <span className="silver-plate flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-ink-2">
            <Clock size={20} strokeWidth={1.6} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded-[5px] border border-silver bg-silver-surface px-1.5 text-[11px] font-bold leading-[18px] text-ink">事前</span>
              <span className="num text-[11px] font-semibold tracking-[0.18em] text-accent-silver">PRE-RACE</span>
            </div>
            <h3 id="pre-race-title" className="mt-1 text-[17px] font-bold leading-tight text-ink">
              UNICO 事前買い目
            </h3>
          </div>
          <p className="shrink-0 text-right leading-none text-ink">
            <span className="num text-[22px] font-light tracking-[-0.03em]">{yen(pre.price)}</span>
            <span className="text-[13px] font-semibold">円</span>
            <span className="mt-1 block text-[11px] text-ink-2">/ 1レース（税込）</span>
          </p>
        </div>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">事前に公開するUNICOの買い目と資金配分</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
          推奨券種・組み合わせ・点数・資金配分・合計推奨金額
        </p>
      </header>

      <div className="px-4 py-4">
        <Body raceId={raceId} pre={pre} tier={tier} raceClosed={raceClosed} />
        {pre.state !== "not_target" && (
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-2">
            事前買い目は前日時点の分析で、最終予想ではありません。
            {tier !== "PRO" && (
              <>
                当日の最新情報を反映した最終買い目は<span className="font-semibold text-ink">PRO会員限定</span>です。
              </>
            )}
          </p>
        )}
        <Disclaimer className="mt-1.5" />
      </div>
    </section>
  );
}

function Notice({ chip, title, text }: { chip: string; title: string; text?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-dashed border-silver px-3.5 py-3">
      <span className="num mt-[1px] shrink-0 rounded-[4px] border border-silver bg-silver-surface px-1.5 text-[11px] font-semibold leading-[18px] tracking-[0.1em] text-ink-2">
        {chip}
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-ink">{title}</p>
        {text && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">{text}</p>}
      </div>
    </div>
  );
}

function DisabledCta({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="mt-3 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full border border-line bg-surface-2 text-[15px] font-semibold text-ink-2"
    >
      {label}
    </button>
  );
}

function Body({ raceId, pre, tier, raceClosed }: { raceId: string; pre: RacePredictionView["preRace"]; tier: AccessTier; raceClosed: boolean }) {
  const isPro = tier === "PRO";

  if (pre.state === "not_target") {
    return <Notice chip="N/A" title="このレースは買い目の対象外です" text="無料のUNICO指数ランキング・無料ワイドをご活用ください。" />;
  }

  if (pre.state === "not_ready") {
    return (
      <>
        <Notice
          chip="SOON"
          title={pre.scheduledAt ? `${fmtJst(pre.scheduledAt)} 公開予定` : "事前買い目は準備中です"}
          text={
            isPro
              ? "公開後、PRO特典として追加料金なしで閲覧できます。"
              : raceClosed
                ? "このレースの販売は終了しました。"
                : "公開後に購入できるようになります。"
          }
        />
        {!isPro && <DisabledCta label={raceClosed ? "販売終了" : "公開後に購入できます"} />}
      </>
    );
  }

  if (pre.state === "locked") {
    if (raceClosed) {
      return (
        <>
          <Notice chip="CLOSED" title="販売終了" text="発走時刻を過ぎたため、このレースの事前買い目は販売を終了しました。" />
          <DisabledCta label="販売終了" />
        </>
      );
    }
    const guest = pre.purchase.reason === "LOGIN_REQUIRED";
    return (
      <>
        {pre.publishedAt && (
          <p className="mb-3 text-[12px] text-ink-2">
            <span className="num text-ink">{fmtJst(pre.publishedAt)}</span> 公開済み
          </p>
        )}
        <LockedRows />
        <CheckoutButton className="mt-3" endpoint="/api/checkout/pre-race" body={{ raceId }} label="事前買い目を購入する" />
        {guest && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-ink-2">
            <LogIn size={13} strokeWidth={1.8} aria-hidden />
            購入にはログインが必要です
          </p>
        )}
        <p className="mt-1.5 text-center text-[11.5px] text-ink-2">決済機能は準備中です。</p>
      </>
    );
  }

  // available
  const data = pre.data!;
  const viaPro = pre.unlockedBy === "pro";
  return (
    <>
      <p className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-2">
        <span
          className={clsx(
            "rounded-full border px-2 py-[1px] text-[11px] font-semibold",
            viaPro ? "border-gold/60 text-gold-ink" : "border-silver text-ink",
          )}
        >
          {viaPro ? "PRO特典" : "購入済み"}
        </span>
        {viaPro ? "PRO会員は追加料金なしで閲覧できます" : "このレースの事前買い目を閲覧できます"}
      </p>
      <details id="pre-race-tickets" className="group scroll-mt-24">
        <summary className="flex h-12 w-full cursor-pointer list-none items-center justify-center gap-2 rounded-full bg-charcoal text-[15px] font-semibold text-white transition-colors hover:bg-charcoal-hover group-open:border group-open:border-silver group-open:bg-surface group-open:text-ink [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">{viaPro ? "PRO特典で事前買い目を見る" : "事前買い目を見る"}</span>
          <span className="hidden group-open:inline">事前買い目を閉じる</span>
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-4 space-y-4">
          <PublishMeta publishedAt={data.publishedAt} version={data.version} status={data.predictionStatus} />
          <TicketGroups lines={data.lines} />
          <StakeBar allocation={data.stakeAllocation} total={data.totalStake} />
        </div>
      </details>
    </>
  );
}

/** 購入前のプレースホルダ (実データなし) */
function LockedRows() {
  return (
    <div aria-hidden className="space-y-1.5 rounded-[12px] border border-line bg-surface-2/50 p-3">
      {[["w-12", 3], ["w-10", 4], ["w-14", 2]].map(([w, n], i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={clsx("h-2.5 rounded-full bg-silver", w as string)} />
          <span className="flex flex-1 gap-1 blur-[1.5px]">
            {Array.from({ length: n as number }).map((_, j) => (
              <span key={j} className="h-6 w-14 rounded-[6px] border border-line bg-surface" />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
