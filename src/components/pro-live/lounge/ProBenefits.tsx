import Link from "next/link";
import { ArrowUpRight, Dna, Gauge, MessageSquareQuote, Scale, Sparkles, type LucideIcon } from "lucide-react";
import { GoldUnicornIcon } from "@/components/brand/UnicornMark";

/* =========================================================
   PRO会員のメリット (機能への短い導線)
   無料サイトとの違いを 6 項目で示す。リンク先は PRO 機能そのもの。
   ========================================================= */

export interface Benefit {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
}

export const PRO_FEATURES: Omit<Benefit, "href">[] = [
  { icon: Gauge, title: "リアルタイム馬場", body: "クッション値・含水率・内外/前後バイアスを当日更新" },
  { icon: Scale, title: "馬体重・パドック", body: "発表と同時に指数へ反映。パドック評価 S〜C" },
  { icon: Sparkles, title: "詳細UNICO指数", body: "9項目の内訳と、前日→当日の指数変動" },
  { icon: MessageSquareQuote, title: "陣営AI指数", body: "陣営コメントをAIが評価。要点を抽出" },
  { icon: Dna, title: "血統・騎手・展開・追い切り", body: "条件適性・コース成績・想定隊列・最終追い切り" },
  { icon: GoldUnicornIcon, title: "最終買い目", body: "当日の最新情報を反映した買い目と資金配分" },
];

export function ProBenefits({ links }: { links: string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
      {PRO_FEATURES.map((f, i) => {
        const Icon = f.icon;
        return (
          <li key={f.title}>
            <Link
              href={links[i] ?? "#"}
              className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface px-3.5 py-3 shadow-[var(--shadow-card)] transition-colors hover:border-gold/45"
            >
              <span className="flex items-center justify-between">
                <Icon size={18} strokeWidth={1.5} className="text-gold" aria-hidden />
                <ArrowUpRight size={14} className="text-accent-silver transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="mt-2 text-[14px] font-bold leading-snug text-ink">{f.title}</span>
              <span className="mt-0.5 text-[12px] leading-relaxed text-ink-2">{f.body}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
