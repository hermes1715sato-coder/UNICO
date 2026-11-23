import Link from "next/link";
import clsx from "clsx";
import { Ban, Crown, Eye, Gauge, RefreshCw, Scale, UserRoundCog, type LucideIcon } from "lucide-react";
import type { LiveUpdate, LiveUpdateKind } from "@/lib/pro/types";
import { ago, hhmm } from "./time";

/* =========================================================
   当日の更新タイムライン (新しい順・Server Component)
   ========================================================= */

const KIND: Record<LiveUpdateKind, { icon: LucideIcon; label: string; tone: string }> = {
  track: { icon: Gauge, label: "馬場", tone: "text-turf" },
  scratch: { icon: Ban, label: "取消", tone: "text-danger" },
  jockey_change: { icon: UserRoundCog, label: "騎手変更", tone: "text-warn" },
  weight: { icon: Scale, label: "馬体重", tone: "text-info" },
  paddock: { icon: Eye, label: "パドック", tone: "text-ok" },
  index_recalc: { icon: RefreshCw, label: "指数更新", tone: "text-ink" },
  final_published: { icon: Crown, label: "最終買い目", tone: "text-gold-ink" },
};

export function LiveTimeline({ updates, now, limit = 12 }: { updates: LiveUpdate[]; now: string; limit?: number }) {
  if (!updates.length) {
    return <p className="rounded-[var(--radius-card)] border border-dashed border-silver bg-surface px-4 py-8 text-center text-[14px] text-ink-2">本日の更新はまだありません。</p>;
  }
  const shown = updates.slice(0, limit);
  return (
    <div className="rounded-[var(--radius-card-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
      <ol className="relative px-4 py-2">
        {shown.map((u, i) => {
          const k = KIND[u.kind];
          const Icon = k.icon;
          const body = (
            <>
              <p className="flex flex-wrap items-baseline gap-x-2 text-[14px] font-bold leading-snug text-ink">
                {u.raceLabel && <span className="num text-[12px] font-semibold text-ink-2">{u.raceLabel}</span>}
                {u.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{u.detail}</p>
            </>
          );
          return (
            <li key={u.id} className="relative flex gap-3 py-2.5">
              {/* 縦の細線 */}
              {i < shown.length - 1 && <span aria-hidden className="absolute top-[38px] bottom-[-6px] left-[73px] w-px bg-line" />}
              <div className="w-[46px] shrink-0 pt-[5px] text-right">
                <p className="num text-[13px] font-medium leading-none text-ink">{hhmm(u.at)}</p>
                <p className="mt-1 whitespace-nowrap text-[11px] leading-none text-ink-2">{ago(u.at, now)}</p>
              </div>
              <span
                className={clsx("relative z-[1] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-line bg-surface", k.tone)}
                title={k.label}
              >
                <Icon size={15} strokeWidth={1.7} aria-hidden />
                <span className="sr-only">{k.label}</span>
              </span>
              <div className="min-w-0 flex-1 pt-[3px]">
                {u.raceId ? (
                  <Link href={`/pro/race/${u.raceId}`} className="block rounded-[6px] hover:opacity-80">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {updates.length > shown.length && (
        <p className="border-t border-line px-4 py-2.5 text-center text-[12px] text-ink-2">
          ほか <span className="num">{updates.length - shown.length}</span> 件の更新（各レースのPRO分析で確認できます）
        </p>
      )}
    </div>
  );
}
