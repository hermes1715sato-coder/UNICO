import clsx from "clsx";
import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { DemoBadge } from "@/components/ui";
import { UnicornMark } from "@/components/brand/UnicornMark";

/* =========================================================
   PRO Lounge の見出し帯 (白 × シルバー × ゴールドの細線)
   ========================================================= */

export function LoungeHeader({
  dateLabel,
  updatedAt,
  locked = false,
  children,
}: {
  dateLabel: string;          // 11/28(土)
  updatedAt?: string;         // "12:30" (locked では表示しない)
  locked?: boolean;
  children?: ReactNode;       // 下段 (統計 / 説明)
}) {
  return (
    <header className="edge-silver edge-gold relative overflow-hidden rounded-[var(--radius-card-lg)] border border-gold/35 bg-surface shadow-[var(--shadow-card)]">
      <div className="brushed px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="silver-plate flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14">
            {locked ? (
              <LockKeyhole size={21} strokeWidth={1.5} className="text-gold-ink" aria-hidden />
            ) : (
              <UnicornMark size={26} tone="gold" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="num text-[11px] font-semibold tracking-[0.28em] text-gold-ink">UNICO PRO</p>
            <h1 className="mt-1 text-[22px] font-bold leading-tight text-ink sm:text-[26px]">PRO Lounge</h1>
            <p className="mt-0.5 text-[13px] font-medium text-ink-2 sm:text-[14px]">
              本日 <span className="num">{dateLabel}</span>
              <span className="hidden sm:inline">
                <span className="mx-1.5 text-silver">|</span>
                会員専用の当日ダッシュボード
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {!locked && updatedAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-[3px]">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
                </span>
                <span className="num text-[11px] font-bold tracking-[0.14em] text-ink">LIVE</span>
                <span className="num text-[11.5px] text-ink-2">{updatedAt}</span>
              </span>
            )}
            <DemoBadge />
          </div>
        </div>
      </div>
      {children && <div className={clsx("border-t border-gold/20 bg-surface")}>{children}</div>}
    </header>
  );
}

/** 見出し帯の下段に置く 4 マスの要約 */
export function LoungeStats({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={it.label}
          className={clsx("min-w-0 border-line px-4 py-3 sm:px-5", i % 2 === 1 && "border-l", i >= 2 && "border-t sm:border-t-0", i > 0 && "sm:border-l")}
        >
          <dt className="text-[11px] font-semibold text-ink-2">{it.label}</dt>
          <dd className="mt-0.5 truncate text-[15px] font-bold text-ink">
            {it.value}
            {it.sub && <span className="ml-1.5 text-[12px] font-medium text-ink-2">{it.sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
