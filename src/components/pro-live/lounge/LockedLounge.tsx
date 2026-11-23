import Link from "next/link";
import clsx from "clsx";
import { LockKeyhole, UsersRound } from "lucide-react";
import { PRO_MONTHLY_PRICE_JPY } from "@/lib/access/policy";
import { SectionHeading, buttonClass } from "@/components/ui";
import { LoungeHeader } from "./LoungeHeader";
import { PRO_FEATURES } from "./ProBenefits";
import { UnicornMark } from "@/components/brand/UnicornMark";

/* =========================================================
   PRO 以外の閲覧者向け: PRO Lounge の中身の「説明」だけを表示する。
   実データは一切受け取らない (サーバーでも生成されない)。
   プレースホルダーは装飾用の図形のみで、数値・馬名は描画しない。
   ========================================================= */

export type LockReason =
  | { kind: "guest" }
  | { kind: "free" }
  | { kind: "single" }
  | { kind: "expired"; endedLabel: string };

const REASON_TEXT: Record<LockReason["kind"], string> = {
  guest: "ログインのうえ、UNICO PRO にご登録いただくと閲覧できます。",
  free: "UNICO PRO にご登録いただくと、当日の最新情報をこのページでまとめて確認できます。",
  single: "事前買い目の単品購入には含まれません。購入済みの事前買い目は各レースページで引き続き閲覧できます。",
  expired: "",
};

/** ぼかした図形だけのプレースホルダー (aria-hidden) */
function Ghost({ className }: { className?: string }) {
  return <span aria-hidden className={clsx("block rounded-full bg-silver-surface", className)} />;
}

function PreviewTrack() {
  return (
    <div aria-hidden className="space-y-3 p-4 blur-[1.5px]">
      <div className="flex items-center gap-2">
        <Ghost className="h-4 w-10 rounded-[5px] bg-turf-bg" />
        <Ghost className="h-4 w-8 rounded-[5px]" />
        <Ghost className="ml-auto h-3 w-14" />
      </div>
      <div className="flex items-center gap-3">
        <Ghost className="h-7 w-10 rounded-[6px]" />
        <div className="relative h-[6px] flex-1 rounded-full bg-silver-surface">
          <span className="absolute inset-y-0 left-[28%] w-[28%] rounded-full bg-silver/60" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Ghost className="h-9 rounded-[8px] bg-surface-2" />
        <Ghost className="h-9 rounded-[8px] bg-surface-2" />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Ghost key={i} className={clsx("h-[6px] flex-1", i === 2 && "bg-silver")} />
        ))}
      </div>
    </div>
  );
}

function PreviewRaces() {
  return (
    <div aria-hidden className="divide-y divide-line blur-[1.5px]">
      {[0, 1].map((r) => (
        <div key={r} className="flex gap-3 px-4 py-3">
          <Ghost className="h-5 w-10 rounded-[5px]" />
          <div className="flex-1 space-y-2">
            <Ghost className="h-3.5 w-3/5" />
            <div className="flex gap-1.5">
              <Ghost className={clsx("h-4 w-16", r === 0 ? "bg-ok-bg" : "bg-info-bg")} />
              {r === 0 && <Ghost className="h-4 w-20 border border-gold/40 bg-surface" />}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((k) => (
                <Ghost key={k} className="h-8 rounded-[8px] bg-surface-2" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewTimeline() {
  return (
    <div aria-hidden className="space-y-3.5 p-4 blur-[1.5px]">
      {["text-info", "text-ok", "text-gold", "text-turf"].map((t, i) => (
        <div key={i} className="flex items-center gap-3">
          <Ghost className="h-3 w-9" />
          <span className={clsx("h-6 w-6 shrink-0 rounded-full border border-line bg-surface", t)}>
            <span className="m-[7px] block h-2 w-2 rounded-full bg-current opacity-60" />
          </span>
          <div className="flex-1 space-y-1.5">
            <Ghost className="h-3 w-1/2" />
            <Ghost className="h-2.5 w-4/5 bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

const PREVIEWS = [
  { en: "TRACK", title: "リアルタイム馬場", body: "競馬場ごとの天候・風・芝/ダートの馬場状態、クッション値、含水率（ゴール前・4コーナー）、内外・前後のバイアス。", el: <PreviewTrack /> },
  { en: "TODAY", title: "本日のPRO対象レース", body: "各レースの進行状況（馬体重発表・パドック評価）と、当日情報を反映したUNICO指数の上位馬・前日からの変動。", el: <PreviewRaces /> },
  { en: "TIMELINE", title: "更新タイムライン", body: "馬場更新・出走取消・騎手変更・馬体重・パドック・最終買い目の公開を、発生順にお知らせ。", el: <PreviewTimeline /> },
];

export function LockedLounge({ dateLabel, reason, isDemo }: { dateLabel: string; reason: LockReason; isDemo: boolean }) {
  const message = reason.kind === "expired" ? `PRO期間は ${reason.endedLabel} に終了しました。再登録すると、すぐにご利用いただけます。` : REASON_TEXT[reason.kind];
  return (
    <div className="space-y-8">
      <LoungeHeader dateLabel={dateLabel} locked>
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <p className="flex items-center gap-1.5 text-[16px] font-bold text-ink">
            <LockKeyhole size={16} strokeWidth={1.8} className="text-gold-ink" aria-hidden />
            PRO会員専用ページです
          </p>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            レース当日の馬場・馬体重・パドック評価をリアルタイムに反映した詳細分析を、PRO会員だけにお届けします。
          </p>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-2">{message}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href="/pro/plans" className={clsx(buttonClass("primary", "lg"), "w-full sm:w-auto")}>
              <UnicornMark size={17} tone="gold" />
              PROプランを見る
            </Link>
            <Link href="/races" className={clsx(buttonClass("secondary", "lg"), "w-full sm:w-auto")}>
              無料の指数を見る
            </Link>
            <p className="text-center text-[12px] text-ink-2 sm:ml-2 sm:text-left">
              月額 <span className="num font-semibold text-ink">{PRO_MONTHLY_PRICE_JPY.toLocaleString("ja-JP")}</span>円（税込）・いつでも解約可
            </p>
          </div>
        </div>
      </LoungeHeader>

      <section aria-labelledby="inside-title">
        <SectionHeading id="inside-title" en="INSIDE" title="PRO Lounge でできること" pro />
        <div className="grid gap-3 lg:grid-cols-3">
          {PREVIEWS.map((p) => (
            <article key={p.title} className="flex flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
              <div className="relative h-[164px] overflow-hidden border-b border-line bg-surface">
                {p.el}
                <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
                <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full border border-gold/45 bg-surface/90 px-2 py-[2px] text-[11px] font-semibold text-gold-ink">
                  <LockKeyhole size={11} strokeWidth={1.9} aria-hidden />
                  PRO
                </span>
              </div>
              <div className="px-4 py-3.5">
                <p className="num text-[11px] font-semibold tracking-[0.2em] text-gold-ink">{p.en}</p>
                <h3 className="mt-0.5 text-[16px] font-bold text-ink">{p.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{p.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="race-pro-title">
        <SectionHeading id="race-pro-title" en="RACE ANALYSIS" title="レースごとのPRO分析" pro />
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {PRO_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.title} className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface px-3.5 py-3">
                <Icon size={18} strokeWidth={1.5} className="text-gold" aria-hidden />
                <span className="mt-2 text-[14px] font-bold leading-snug text-ink">{f.title}</span>
                <span className="mt-0.5 text-[12px] leading-relaxed text-ink-2">{f.body}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex justify-center">
          <Link href="/pro/plans" className={clsx(buttonClass("secondary"), "border-gold/50")}>
            <UnicornMark size={16} tone="gold" />
            料金・プランの比較を見る
          </Link>
        </div>
      </section>

      {isDemo && (
        <p className="flex items-start gap-2 rounded-[var(--radius-card)] border border-warn/30 bg-warn-bg px-4 py-3 text-[13px] leading-relaxed text-warn">
          <UsersRound size={16} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden />
          <span>
            DEMO：画面右下の「DEMO」ボタン（会員状態の切り替え）で「PRO会員」を選ぶと、このページの中身を確認できます。
          </span>
        </p>
      )}
    </div>
  );
}
