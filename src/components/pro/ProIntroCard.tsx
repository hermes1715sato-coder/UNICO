import Link from "next/link";
import clsx from "clsx";
import { Check, Crown, Lock } from "lucide-react";
import type { ProAvailability } from "@/lib/types";
import { SectionHeading, buttonClass } from "@/components/ui";

/**
 * UNICO PRO 紹介カード (契約: props は変更しないこと。追加は任意 props のみ)
 * - variant="home": トップページ用のサービス紹介
 * - variant="race": レース詳細用。購入導線 (決済は未実装のため「準備中」表示)
 * PRO の実データ (印・買い目・項目別指数) はこのコンポーネントに一切渡さない。
 * 白 × マットシルバー + 上端のゴールド細線。暗い背景にはしない。
 */
export interface ProIntroCardProps {
  variant: "home" | "race";
  raceId?: string;
  /** race variant: PROが販売中か */
  available?: boolean;
  /** race variant: 販売中でない場合の理由 (準備中 / 対象外) */
  status?: ProAvailability;
  /** 任意: "03" などを渡すとカードの上に番号付き見出しを出す */
  index?: string;
}

const FEATURES = [
  { title: "◎○▲△☆注 の印", text: "UNICO指数と各分析をもとにした最終評価" },
  { title: "推奨券種・買い目", text: "本線 / 中穴 / 穴 の3段階で提示" },
  { title: "陣営AI指数", text: "陣営の動向をAIで評価した独自指数" },
  { title: "項目別の詳細分析", text: "能力・適性・展開・血統など9項目の内訳" },
];

const PRICE = (
  <p className="flex items-baseline gap-1 text-ink">
    <span className="text-[13px] text-ink-2">1レース</span>
    <span className="num text-[28px] font-light leading-none tracking-[-0.03em]">300</span>
    <span className="text-[14px] font-semibold">円</span>
    <span className="text-[12px] text-ink-2">（税込）</span>
  </p>
);

export function ProIntroCard({ variant, available = false, status, index }: ProIntroCardProps) {
  const titleId = `pro-${variant}-title`;
  const card = (
    <section
      aria-labelledby={titleId}
      className="edge-silver edge-gold relative overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface shadow-[var(--shadow-card)]"
    >
      <div className="brushed flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-surface">
          <span aria-hidden className="absolute inset-[3px] rounded-full border border-gold/25" />
          <Crown size={17} strokeWidth={1.5} className="text-gold" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="num text-[11px] font-semibold tracking-[0.2em] text-[#8a7650]">{index ? "THIS RACE" : "UNICO PRO"}</p>
          <h2 id={titleId} className="text-[17px] font-bold leading-tight text-ink">
            {variant === "home" ? "より深い分析を、レース単位で。" : index ? "印・買い目・詳細分析" : "このレースのUNICO PRO"}
          </h2>
        </div>
      </div>
      <div className="px-4 pt-1 pb-4 sm:px-5 sm:pb-5">
        {variant === "home" ? <HomeBody /> : available ? <RaceBody /> : <Unavailable status={status} />}
      </div>
    </section>
  );

  if (!index) return card;
  return (
    <div>
      <SectionHeading index={index} en="UNICO PRO" title="PRO予想" pro />
      {card}
    </div>
  );
}

function FeatureList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={clsx("grid gap-2.5", compact ? "mt-3.5" : "mt-4 sm:grid-cols-2 sm:gap-x-6")}>
      {FEATURES.map((f) => (
        <li key={f.title} className="flex items-start gap-2.5">
          <span className="mt-[3px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border border-gold/60">
            <Check size={10} strokeWidth={2.4} className="text-gold" aria-hidden />
          </span>
          <div>
            <p className="text-[14px] font-semibold leading-snug text-ink">{f.title}</p>
            <p className="text-[12px] leading-snug text-ink-2">{f.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * 鍵付きプレビュー (装飾用のプレースホルダのみ。実データは一切描画しない)
 * 印の欄は空の丸、数値は固定パターンのぼかし棒。
 */
function LockedPreview() {
  const rows = ["w-24", "w-20", "w-28", "w-16"];
  const bars = [62, 40, 78, 52, 30, 66, 46, 58, 36];
  return (
    <div className="relative mt-4 overflow-hidden rounded-[12px] border border-line" aria-hidden>
      <div className="brushed select-none">
        <div className="num flex items-center gap-2.5 border-b border-line px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-accent-silver">
          <span className="w-6">MARK</span>
          <span className="ml-2 flex-1">HORSE</span>
          <span>BREAKDOWN</span>
        </div>
        <div className="space-y-2.5 px-3.5 py-3 blur-[2px]">
          {rows.map((w, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="h-5 w-5 rounded-full border border-silver bg-surface" />
              <span className="h-5 w-5 rounded-[5px] border border-silver bg-surface" />
              <span className={clsx("h-2.5 rounded-full bg-silver", w)} />
              <span className="flex-1" />
              <span className="flex h-4 items-end gap-[2px]">
                {bars.map((h, j) => (
                  <span key={j} className="w-[3px] rounded-[1px] bg-accent-silver/60" style={{ height: `${((h + i * 13 + j * 7) % 90) + 10}%` }} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-surface/30">
        <span className="silver-plate inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-ink-2">
          <Lock size={13} strokeWidth={1.8} className="text-gold" />
          購入後に表示されます
        </span>
      </div>
    </div>
  );
}

function RaceBody() {
  return (
    <>
      <FeatureList compact />
      <LockedPreview />
      <div className="mt-4">
        <div aria-hidden className="gold-rule opacity-60" />
        <div className="mt-3.5 flex items-end justify-between gap-3">{PRICE}</div>
        <button
          type="button"
          disabled
          className="mt-3 inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-line bg-surface-2 text-[15px] font-semibold text-ink-2"
        >
          <Lock size={15} strokeWidth={1.8} aria-hidden />
          購入（準備中）
        </button>
        <p className="mt-2 text-center text-[11.5px] leading-relaxed text-ink-2">
          決済機能は準備中です。公開までしばらくお待ちください。
        </p>
      </div>
    </>
  );
}

function Unavailable({ status }: { status?: ProAvailability }) {
  const preparing = status === "preparing";
  return (
    <div className="mt-3.5">
      <div className="flex items-start gap-3 rounded-[12px] border border-dashed border-silver px-3.5 py-3.5">
        <span className="num mt-[1px] shrink-0 rounded-[4px] border border-silver bg-silver-surface px-1.5 text-[11px] font-semibold leading-[18px] tracking-[0.12em] text-ink-2">
          {preparing ? "SOON" : "N/A"}
        </span>
        <div>
          <p className="text-[14px] font-bold text-ink">
            {preparing ? "このレースのPRO予想は準備中です" : "このレースはPRO予想の対象外です"}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
            {preparing
              ? "UNICO指数の分析完了後に販売を開始する予定です。"
              : "PRO予想は一部のレースで提供しています。無料のUNICO指数ランキングをご活用ください。"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-2">
        PROに含まれる内容：印・推奨買い目・陣営AI指数・項目別の詳細分析（<span className="num">1レース 300円</span>・税込）
      </p>
    </div>
  );
}

function HomeBody() {
  return (
    <>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
        無料のUNICO指数に加えて、印・推奨買い目・項目別の詳細分析をレースごとに確認できます。必要なレースだけを選んで利用できます。
      </p>
      <FeatureList />
      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        {PRICE}
        <Link href="/races" className={buttonClass("secondary")}>
          対象レースを見る
        </Link>
      </div>
      <p className="mt-2 text-[11.5px] text-ink-2">決済機能は準備中です。</p>
    </>
  );
}
