import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, Clock, ReceiptText, UserRound } from "lucide-react";
import { getDemoPersonaId, getNow, getViewer } from "@/lib/access/session";
import { findPersona } from "@/lib/access/demo-personas";
import { PRO_MONTHLY_PRICE_JPY, isProActive, type Subscription } from "@/lib/access/policy";
import { getRace } from "@/lib/data";
import { formatDateShort } from "@/lib/format";
import { DemoBadge, SectionHeading, buttonClass } from "@/components/ui";
import { fmtJst } from "@/components/predictions/parts";
import { UnicornMark } from "@/components/brand/UnicornMark";

export const metadata = { title: "マイページ" };

function subscriptionStatus(s: Subscription | null, now: string): { label: string; detail?: string; tone: "active" | "canceling" | "ended" | "none" } {
  if (!s) return { label: "未契約", tone: "none" };
  const end = fmtJst(s.currentPeriodEnd).replace(/ \d\d:\d\d$/, "");
  const inPeriod = Date.parse(now) < Date.parse(s.currentPeriodEnd);
  const live = (s.status === "active" || s.status === "trialing") && inPeriod;
  if (live && s.cancelAtPeriodEnd) return { label: "解約予約中", detail: `${end}まで利用できます`, tone: "canceling" };
  if (live) return { label: "契約中", detail: `次回更新 ${end}`, tone: "active" };
  return { label: "期間終了", detail: `${end}に終了しました`, tone: "ended" };
}

export default async function MyPage() {
  const [viewer, personaId] = await Promise.all([getViewer(), getDemoPersonaId()]);
  const now = getNow();
  const persona = findPersona(personaId);
  const pro = isProActive(viewer, now);
  const sub = subscriptionStatus(viewer.subscription, now);
  const purchases = await Promise.all(
    viewer.purchases.map(async (p) => ({ ...p, race: await getRace(p.raceId) })),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 lg:px-6 lg:py-10">
      <section aria-labelledby="account-title">
        <SectionHeading id="account-title" en="MY PAGE" title="マイページ" action={<DemoBadge />} />
        <div className={clsx("edge-silver overflow-hidden rounded-[var(--radius-card-lg)] border bg-surface shadow-[var(--shadow-card)]", pro ? "edge-gold border-gold/35" : "border-line")}>
          <div className="brushed flex items-center gap-3 border-b border-line px-5 py-4">
            <span className="silver-plate flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2">
              <UserRound size={20} strokeWidth={1.6} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink-2">DEMO会員（検証用）</p>
              <p className="text-[17px] font-bold leading-tight text-ink">{viewer.userId ? persona.label : "ログインしていません"}</p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">{persona.description}</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4">
              <dt className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">PLAN</dt>
              <dd className="mt-1.5 flex items-center gap-2">
                {pro ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 px-2.5 py-[2px] text-[14px] font-bold text-gold-ink">
                    <UnicornMark size={16} tone="gold" />
                    UNICO PRO
                  </span>
                ) : (
                  <span className="rounded-full border border-silver px-2.5 py-[2px] text-[14px] font-bold text-ink">UNICO FREE</span>
                )}
                {pro && <span className="num text-[12px] text-ink-2">月額{PRO_MONTHLY_PRICE_JPY.toLocaleString("ja-JP")}円</span>}
              </dd>
            </div>
            <div className="px-5 py-4">
              <dt className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">SUBSCRIPTION</dt>
              <dd className="mt-1.5">
                <span
                  className={clsx(
                    "rounded-full border px-2.5 py-[2px] text-[13px] font-bold",
                    sub.tone === "active" && "border-charcoal/40 text-ink",
                    sub.tone === "canceling" && "border-warn/40 bg-warn-bg text-warn",
                    sub.tone === "ended" && "border-silver bg-silver-surface text-ink-2",
                    sub.tone === "none" && "border-dashed border-silver text-ink-2",
                  )}
                >
                  {sub.label}
                </span>
                {sub.detail && <span className="ml-2 text-[13px] text-ink-2">{sub.detail}</span>}
              </dd>
            </div>
          </dl>
          {!pro && (
            <div className="flex flex-col gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-ink-2">PROなら全対象レースの事前・最終買い目と詳細分析を利用できます。</p>
              <Link href="/pro/plans" className={clsx(buttonClass("secondary"), "shrink-0")}>
                料金プランを見る
              </Link>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="purchases-title">
        <SectionHeading id="purchases-title" en="PURCHASES" title="購入済みの事前買い目" />
        {purchases.length ? (
          <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
            {purchases.map((p) => (
              <li key={p.raceId} className="border-b border-line last:border-b-0">
                <Link href={`/race/${p.raceId}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                  <span className="silver-plate flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-ink-2">
                    <Clock size={17} strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[15px] font-bold leading-snug text-ink">
                      {p.race ? (
                        <>
                          <span className="num">{formatDateShort(p.race.date)}</span> {p.race.venue.name}
                          <span className="num">{p.race.raceNo}</span>R {p.race.name}
                        </>
                      ) : (
                        p.raceId
                      )}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-ink-2">
                      購入 <span className="num">{fmtJst(p.purchasedAt)}</span>・300円（税込）
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-accent-silver" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-silver bg-surface px-4 py-5">
            <ReceiptText size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-accent-silver" aria-hidden />
            <div>
              <p className="text-[14px] font-bold text-ink">購入済みの事前買い目はありません</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">
                {pro ? "PRO会員は全対象レースの事前買い目を追加料金なしで閲覧できます。" : "事前買い目は各レースの詳細ページから1レース300円で購入できます。"}
              </p>
            </div>
          </div>
        )}
        {purchases.length > 0 && (
          <p className="mt-2 text-[12px] text-ink-2">購入済みの事前買い目は、PROの契約状況にかかわらず閲覧できます。</p>
        )}
      </section>

      <p className="rounded-[var(--radius-card)] border border-warn/25 bg-warn-bg px-4 py-3 text-[12.5px] leading-relaxed text-warn">
        現在の会員状態は表示確認用のDEMOです（右下の「DEMO会員」で切り替え）。ログイン・会員登録・決済・解約手続きは今後提供予定です。
      </p>
    </div>
  );
}
