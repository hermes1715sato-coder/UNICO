import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { BarChart3, Check, Clock, Minus } from "lucide-react";
import { PRE_RACE_PRICE_JPY, PRO_MONTHLY_PRICE_JPY } from "@/lib/access/policy";
import { SectionHeading, buttonClass } from "@/components/ui";
import { CheckoutButton } from "@/components/predictions/CheckoutButton";
import { UnicornMark } from "@/components/brand/UnicornMark";

export interface CurrentPlan {
  plan: "FREE" | "PRO";
  loggedIn: boolean;
  purchasedCount: number;
}

type PlanId = "FREE" | "PRE" | "PRO";
type Cell = boolean | string;

const ROWS: { label: string; group?: string; cells: [Cell, Cell, Cell] }[] = [
  { group: "無料で使える分析", label: "UNICO総合指数", cells: [true, true, true] },
  { label: "全馬ランキング", cells: [true, true, true] },
  { label: "レース基本情報", cells: [true, true, true] },
  { label: "無料ワイド 3〜4頭BOX", cells: [true, true, true] },
  { group: "事前買い目", label: "事前推奨券種・組み合わせ・点数", cells: [false, "購入分", "全対象"] },
  { label: "事前推奨資金配分・合計推奨金額", cells: [false, "購入分", "全対象"] },
  { group: "PRO限定", label: "最終買い目（当日の最新情報を反映）", cells: [false, false, true] },
  { label: "最終の資金配分", cells: [false, false, true] },
  { label: "当日リアルタイム馬場・馬体重・パドック評価", cells: [false, false, true] },
  { label: "AI予想印 ◎○▲△☆注", cells: [false, false, true] },
  { label: "詳細UNICO指数分析（9項目）", cells: [false, false, true] },
  { label: "血統・騎手・展開・追い切り分析", cells: [false, false, true] },
  { label: "陣営AI指数", cells: [false, false, true] },
  { label: "公開履歴・事前からの変更", cells: [false, false, true] },
  { label: "広告なし", cells: [false, false, true] },
];

export function PricingPlans({ current }: { current: CurrentPlan }) {
  const isPro = current.plan === "PRO";
  const currentId: PlanId = isPro ? "PRO" : "FREE";

  return (
    <div>
      <SectionHeading en="PLANS" title="UNICOの料金プラン" />
      <p className="max-w-2xl text-[14px] leading-relaxed text-ink-2">
        UNICO指数とランキングは無料。必要なレースだけ事前買い目を購入するか、PRO会員として全対象レースの事前・最終買い目と詳細分析を利用できます。
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-5">
        <PlanCard
          id="FREE"
          current={currentId === "FREE"}
          icon={<BarChart3 size={19} strokeWidth={1.6} aria-hidden />}
          name="UNICO FREE"
          price={<Price value="0" unit="円" />}
          lead="指数・ランキング・無料ワイドを誰でも"
          points={["UNICO総合指数", "全馬ランキング", "基本情報", "無料ワイド 3〜4頭BOX"]}
          cta={
            <Link href="/races" className={clsx(buttonClass("secondary", "lg"), "w-full")}>
              {currentId === "FREE" ? "レースを見る" : "無料コンテンツを見る"}
            </Link>
          }
        />
        <PlanCard
          id="PRE"
          current={false}
          icon={<Clock size={19} strokeWidth={1.6} aria-hidden />}
          name="UNICO 事前買い目"
          price={<Price value={PRE_RACE_PRICE_JPY.toLocaleString("ja-JP")} unit="円" per="/ 1レース" />}
          lead="事前に公開するUNICOの買い目と資金配分"
          points={["事前推奨券種", "組み合わせ・点数", "事前推奨資金配分", "合計推奨金額"]}
          caveat="最終買い目は含まれません"
          note={current.purchasedCount > 0 ? `${current.purchasedCount}レース購入済み` : undefined}
          cta={
            isPro ? (
              <p className="flex h-12 items-center justify-center rounded-full border border-line bg-surface-2 text-[14px] font-semibold text-ink-2">
                PRO特典で追加料金なし
              </p>
            ) : (
              <Link href="/races" className={clsx(buttonClass("primary", "lg"), "w-full whitespace-nowrap")}>
                対象レースから購入
              </Link>
            )
          }
          foot={isPro ? undefined : "購入は各レースの詳細ページから。決済機能は準備中です。"}
        />
        <PlanCard
          id="PRO"
          current={currentId === "PRO"}
          icon={<UnicornMark size={22} tone="gold" />}
          name="UNICO PRO"
          price={<Price value={PRO_MONTHLY_PRICE_JPY.toLocaleString("ja-JP")} unit="円" per="/ 月" pre="月額" />}
          lead="全対象レースの事前・最終買い目と詳細分析"
          points={[
            "全対象レースの事前買い目",
            "最終買い目・最終の資金配分",
            "AI予想印 ◎○▲△☆注",
            "詳細UNICO指数分析",
            "血統・騎手・展開・追い切り分析",
            "陣営AI指数",
            "当日の馬場・馬体重・パドックを反映",
            "広告なし",
          ]}
          cta={
            isPro ? (
              <Link href="/pro" className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-gold/50 bg-surface text-[14px] font-semibold text-gold-ink hover:bg-surface-2">
                <UnicornMark size={16} tone="gold" />
                ご契約中・PRO Loungeへ
              </Link>
            ) : (
              <CheckoutButton endpoint="/api/checkout/pro" label="PROに登録する" tone="gold" />
            )
          }
          foot={isPro ? "契約状況はマイページで確認できます。" : current.loggedIn ? "決済機能は準備中です。" : "登録にはログインが必要です。決済機能は準備中です。"}
        />
      </div>

      <section className="mt-10" aria-labelledby="compare-title">
        <SectionHeading id="compare-title" en="COMPARE" title="プラン比較" />
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full table-fixed border-collapse text-[13px]">
            <colgroup>
              <col />
              <col className="w-[56px] sm:w-[120px] lg:w-[180px]" />
              <col className="w-[60px] sm:w-[120px] lg:w-[180px]" />
              <col className="w-[60px] sm:w-[120px] lg:w-[180px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-3 py-3 text-left text-[11px] font-semibold text-ink-2 sm:px-4">
                  機能
                </th>
                <ColHead label="FREE" sub="無料" active={currentId === "FREE"} />
                <ColHead label="事前" sub={`${PRE_RACE_PRICE_JPY}円/R`} active={false} />
                <ColHead label="PRO" sub={`月${PRO_MONTHLY_PRICE_JPY.toLocaleString("ja-JP")}円`} active={currentId === "PRO"} pro />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <FragmentRow key={r.label} row={r} activeIdx={currentId === "PRO" ? 2 : 0} />
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-ink-2">
          <li>・価格はすべて税込です。「購入分」は300円で購入したレースのみ、「全対象」は全予想対象レースです。</li>
          <li>・事前買い目は前日時点の分析で、最終予想ではありません。</li>
          <li>・PRO会員は事前買い目を追加料金なしで閲覧できます。購入済みの事前買い目はPRO解約後も閲覧できます。</li>
          <li>・買い目・資金配分はUNICO指数等にもとづく分析支援情報です。的中や利益を保証するものではありません。</li>
          <li>・会員登録・決済機能は準備中です（現在は表示確認用のDEMOです）。</li>
        </ul>
      </section>
    </div>
  );
}

function Price({ value, unit, per, pre }: { value: string; unit: string; per?: string; pre?: string }) {
  return (
    <p className="flex items-baseline gap-1 text-ink">
      {pre && <span className="text-[13px] text-ink-2">{pre}</span>}
      <span className="num text-[34px] font-light leading-none tracking-[-0.03em]">{value}</span>
      <span className="text-[14px] font-semibold">{unit}</span>
      {per && <span className="text-[13px] text-ink-2">{per}</span>}
      <span className="text-[11.5px] text-ink-2">（税込）</span>
    </p>
  );
}

function PlanCard({
  id,
  current,
  icon,
  name,
  price,
  lead,
  points,
  caveat,
  note,
  cta,
  foot,
}: {
  id: PlanId;
  current: boolean;
  icon: ReactNode;
  name: string;
  price: ReactNode;
  lead: string;
  points: string[];
  caveat?: string;
  note?: string;
  cta: ReactNode;
  foot?: string;
}) {
  const pro = id === "PRO";
  return (
    <section
      aria-label={name}
      className={clsx(
        "edge-silver relative flex flex-col overflow-hidden rounded-[var(--radius-card-lg)] border bg-surface shadow-[var(--shadow-card)]",
        pro && "edge-gold",
        current ? "border-charcoal/70 ring-1 ring-charcoal/30" : pro ? "border-gold/40" : "border-line",
      )}
    >
      <div className={clsx("px-5 pt-5 pb-4", !pro && "brushed")}>
        <div className="flex items-center justify-between gap-2">
          <span
            className={clsx(
              "flex h-10 w-10 items-center justify-center",
              pro ? "rounded-full border border-gold/60" : "silver-plate rounded-[11px] text-ink-2",
            )}
          >
            {icon}
          </span>
          {current && (
            <span className="rounded-full bg-charcoal px-2.5 py-[3px] text-[11px] font-bold text-white">現在のプラン</span>
          )}
        </div>
        <p className={clsx("num mt-3 text-[11px] font-semibold tracking-[0.18em]", pro ? "text-gold-ink" : "text-accent-silver")}>
          {id === "FREE" ? "FREE" : id === "PRE" ? "PRE-RACE · 都度購入" : "PRO · 月額"}
        </p>
        <h2 className="mt-0.5 text-[19px] font-bold text-ink">{name}</h2>
        <div className="mt-3">{price}</div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{lead}</p>
        {note && <p className="mt-2 inline-block rounded-full border border-silver px-2 py-[1px] text-[11.5px] font-semibold text-ink">{note}</p>}
      </div>
      <div className={clsx("mx-5 h-px", pro ? "gold-rule opacity-60" : "bg-line")} />
      <ul className="flex-1 space-y-2 px-5 py-4">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-[14px] text-ink">
            <CheckDot pro={pro} />
            {p}
          </li>
        ))}
        {caveat && (
          <li className="flex items-start gap-2 text-[13px] text-ink-2">
            <Minus size={14} className="mt-[3px] shrink-0 text-silver" aria-hidden />
            {caveat}
          </li>
        )}
      </ul>
      <div className="px-5 pb-5">
        {cta}
        {foot && <p className="mt-2 text-center text-[11.5px] leading-relaxed text-ink-2">{foot}</p>}
      </div>
    </section>
  );
}

function CheckDot({ pro }: { pro: boolean }) {
  return (
    <span
      className={clsx(
        "mt-[3px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border",
        pro ? "border-gold/60" : "border-silver",
      )}
    >
      <Check size={10} strokeWidth={2.4} className={pro ? "text-gold" : "text-accent-silver"} aria-hidden />
    </span>
  );
}

function ColHead({ label, sub, active, pro = false }: { label: string; sub: string; active: boolean; pro?: boolean }) {
  return (
    <th
      scope="col"
      className={clsx(
        "px-1 py-3 text-center align-bottom",
        active && "bg-surface-2",
        pro && "border-t-2 border-t-gold/70",
      )}
    >
      <span className={clsx("block text-[13px] font-bold", pro ? "text-gold-ink" : "text-ink")}>{label}</span>
      <span className="num block text-[11px] font-normal text-ink-2">{sub}</span>
      {active && <span className="mt-1 block text-[11px] font-semibold text-ink">現在</span>}
    </th>
  );
}

function FragmentRow({ row, activeIdx }: { row: (typeof ROWS)[number]; activeIdx: number }) {
  return (
    <>
      {row.group && (
        <tr className="border-b border-line bg-surface-2/60">
          <th colSpan={4} scope="colgroup" className="px-3 py-1.5 text-left text-[11.5px] font-semibold text-ink-2 sm:px-4">
            {row.group}
          </th>
        </tr>
      )}
      <tr className="border-b border-line last:border-b-0">
        <th scope="row" className="px-3 py-2.5 text-left text-[13px] font-medium leading-snug text-ink sm:px-4">
          {row.label}
        </th>
        {row.cells.map((c, i) => (
          <td key={i} className={clsx("px-1 py-2.5 text-center", i === activeIdx && "bg-surface-2")}>
            {c === true ? (
              <Check size={16} strokeWidth={2.2} className={clsx("mx-auto", i === 2 ? "text-gold-ink" : "text-ink")} aria-label="利用可" />
            ) : c === false ? (
              <Minus size={14} className="mx-auto text-silver" aria-label="なし" />
            ) : (
              <span className="text-[11.5px] font-semibold leading-tight text-ink">{c}</span>
            )}
          </td>
        ))}
      </tr>
    </>
  );
}
