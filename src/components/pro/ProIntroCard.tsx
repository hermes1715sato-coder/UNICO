import Link from "next/link";
import clsx from "clsx";
import { Check, Clock } from "lucide-react";
import type { ProAvailability } from "@/lib/types";
import { PRE_RACE_PRICE_JPY, PRO_MONTHLY_PRICE_JPY } from "@/lib/access/policy";
import { SectionHeading, buttonClass } from "@/components/ui";
import { UnicornMark } from "@/components/brand/UnicornMark";

/**
 * UNICO PRO 紹介カード (契約: props は変更しないこと。追加は任意 props のみ)
 * - variant="home": トップページ用のサービス紹介 (PRO 月額 / 事前買い目 1レース)
 * - variant="race": 旧レース詳細用。現在のレース詳細は PreRaceTicketCard / FinalTicketCard を使う。
 * PRO の実データ (印・買い目・項目別指数) はこのコンポーネントに一切渡さない。
 * 白 × マットシルバー + 上端のゴールド細線。暗い背景にはしない。
 */
export interface ProIntroCardProps {
  variant: "home" | "race";
  raceId?: string;
  /** race variant: 予想対象レースか */
  available?: boolean;
  /** race variant: 対象でない場合の理由 (準備中 / 対象外) */
  status?: ProAvailability;
  /** 任意: "03" などを渡すとカードの上に番号付き見出しを出す */
  index?: string;
}

const FEATURES = [
  { title: "事前・最終買い目", text: "全対象レース。最終は当日の最新情報を反映" },
  { title: "AI予想印 ◎○▲△☆注", text: "UNICO指数と各分析をもとにした最終評価" },
  { title: "詳細UNICO指数分析", text: "血統・騎手・展開・追い切りなど9項目の内訳" },
  { title: "陣営AI指数・広告なし", text: "陣営の動向をAIで評価した独自指数" },
];

const yen = (n: number) => n.toLocaleString("ja-JP");

export function ProIntroCard({ variant, index }: ProIntroCardProps) {
  const titleId = `pro-${variant}-title`;
  const card = (
    <section
      aria-labelledby={titleId}
      className="edge-silver edge-gold relative overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface shadow-[var(--shadow-card)]"
    >
      <div className="brushed flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-surface">
          <span aria-hidden className="absolute inset-[3px] rounded-full border border-gold/25" />
          <UnicornMark size={20} tone="gold" />
        </span>
        <div className="min-w-0">
          <p className="num text-[11px] font-semibold tracking-[0.2em] text-gold-ink">UNICO PRO</p>
          <h2 id={titleId} className="text-[17px] font-bold leading-tight text-ink">
            全対象レースの買い目と詳細分析を、月額で。
          </h2>
        </div>
      </div>
      <div className="px-4 pt-1 pb-4 sm:px-5 sm:pb-5">
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          無料のUNICO指数に加えて、事前買い目・当日の最終買い目・AI予想印・詳細分析をすべての対象レースで確認できます。
        </p>
        <ul className={clsx("mt-4 grid gap-2.5", variant === "home" && "sm:grid-cols-2 sm:gap-x-6")}>
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
        <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="text-[11.5px] font-semibold text-gold-ink">UNICO PRO</p>
              <p className="flex items-baseline gap-1 text-ink">
                <span className="text-[13px] text-ink-2">月額</span>
                <span className="num text-[28px] font-light leading-none tracking-[-0.03em]">{yen(PRO_MONTHLY_PRICE_JPY)}</span>
                <span className="text-[14px] font-semibold">円</span>
                <span className="text-[12px] text-ink-2">（税込）</span>
              </p>
            </div>
            <div className="border-l border-line pl-4">
              <p className="flex items-center gap-1 text-[11.5px] font-semibold text-ink-2">
                <Clock size={12} strokeWidth={1.8} aria-hidden />
                事前買い目のみ
              </p>
              <p className="flex items-baseline gap-1 text-ink">
                <span className="num text-[20px] font-light leading-none">{yen(PRE_RACE_PRICE_JPY)}</span>
                <span className="text-[13px] font-semibold">円</span>
                <span className="text-[12px] text-ink-2">/ 1レース</span>
              </p>
            </div>
          </div>
          <Link href="/pro/plans" className={buttonClass("secondary")}>
            料金プランを見る
          </Link>
        </div>
        <p className="mt-2 text-[11.5px] text-ink-2">決済機能は準備中です。的中や利益を保証するものではありません。</p>
      </div>
    </section>
  );

  if (!index) return card;
  return (
    <div>
      <SectionHeading index={index} en="UNICO PRO" title="UNICO PRO" pro />
      {card}
    </div>
  );
}
