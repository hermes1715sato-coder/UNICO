import { Card, DemoBadge } from "@/components/ui";

/** お知らせ (DEMO: 静的なサンプル文面。CMS接続後に差し替え) */
const NEWS = [
  { date: "2026-11-20", tag: "機能", title: "UNICO指数 v2.0 を公開しました。血統・騎手の配点を見直しています。" },
  { date: "2026-11-14", tag: "お知らせ", title: "無料ワイド予想の表示を馬番順に統一しました。" },
  { date: "2026-11-07", tag: "メンテナンス", title: "11月10日(火) 2:00〜5:00 にシステムメンテナンスを実施しました。" },
];

export function NewsList() {
  return (
    <Card>
      <ul className="divide-y divide-line">
        {NEWS.map((n) => {
          const [y, m, d] = n.date.split("-");
          return (
            <li key={n.date + n.title} className="flex items-start gap-3 px-4 py-3 sm:items-center sm:gap-4">
              <time dateTime={n.date} className="num flex w-[52px] shrink-0 flex-col border-r border-line pr-3 leading-none">
                <span className="text-[11px] font-semibold tracking-[0.12em] text-accent-silver">{y}</span>
                <span className="mt-1 text-[15px] font-semibold text-ink">
                  {Number(m)}.{d}
                </span>
              </time>
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-[5px] border border-line px-1.5 text-[11px] font-semibold leading-[18px] text-ink-2">{n.tag}</span>
                  <DemoBadge />
                </span>
                <p className="text-[14px] leading-relaxed text-ink">{n.title}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
