import clsx from "clsx";
import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import type { ProAvailability, RaceStatus, Surface } from "@/lib/types";
import { RACE_STATUS_LABEL, SURFACE_LABEL } from "@/lib/format";

/* ---------------- Card ---------------- */
export function Card({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <As className={clsx("rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]", className)}>
      {children}
    </As>
  );
}

/** セクション見出し: 英字ラベル + 日本語タイトル */
export function SectionHeading({
  en,
  title,
  action,
  pro = false,
  index,
  id,
}: {
  en: string;
  title: string;
  action?: ReactNode;
  pro?: boolean;
  /** "01" など。指定すると UNICO の番号付き見出し (細い大数字 + 縦罫) になる */
  index?: string;
  /** h2 の id (aria-labelledby 用) */
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-end gap-3">
        {index && (
          <span
            aria-hidden
            className={clsx(
              "num -mb-[3px] text-[40px] font-extralight leading-none tracking-[-0.04em] lg:text-[48px]",
              pro ? "text-gold/70" : "text-silver",
            )}
          >
            {index}
          </span>
        )}
        <div className={clsx(index && "border-l border-line pl-3")}>
          <p className={clsx("num text-[11px] font-semibold tracking-[0.2em]", pro ? "text-gold" : "text-accent-silver")}>{en}</p>
          <h2 id={id} className="mt-0.5 text-[18px] font-bold leading-tight text-ink lg:text-[20px]">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

/* ---------------- Badges ---------------- */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "num inline-flex items-center rounded-[5px] border border-warn/40 bg-warn-bg px-1.5 py-[1px] text-[11px] font-bold tracking-[0.12em] text-warn",
        className,
      )}
      title="架空のサンプルデータです"
    >
      DEMO
    </span>
  );
}

export function SurfaceBadge({ surface, distance }: { surface: Surface; distance?: number }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-[5px] px-1.5 py-[2px] text-[12px] font-semibold",
        surface === "turf" ? "bg-turf-bg text-turf" : "bg-dirt-bg text-dirt",
      )}
    >
      {SURFACE_LABEL[surface]}
      {distance !== undefined && <span className="num">{distance}m</span>}
    </span>
  );
}

const STATUS_STYLE: Record<RaceStatus, string> = {
  before_entry: "bg-surface-2 text-ink-2 border-line",
  analyzing: "bg-info-bg text-info border-info/25",
  analyzed: "bg-ok-bg text-ok border-ok/25",
  finished: "bg-silver-surface text-ink-2 border-silver/60",
};

/** 分析状況・データ状態バッジ */
export function DataStatusBadge({ status, className }: { status: RaceStatus; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[11.5px] font-semibold",
        STATUS_STYLE[status],
        className,
      )}
    >
      {status === "analyzing" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" />}
      {RACE_STATUS_LABEL[status]}
    </span>
  );
}

export function GradeBadge({ grade }: { grade?: string }) {
  if (!grade) return null;
  return (
    <span className="num inline-flex items-center rounded-[4px] border border-gold/60 px-1 text-[11px] font-bold leading-[16px] text-[#8a7650]">
      {grade}
    </span>
  );
}

/** 無料 / PRO 公開状況 */
export function AccessBadges({ freeWide, pro }: { freeWide: boolean; pro: ProAvailability }) {
  return (
    <span className="inline-flex items-center gap-1">
      {freeWide && (
        <span className="rounded-[5px] border border-line bg-surface px-1.5 py-[1px] text-[11px] font-semibold text-ink-2">無料ワイド</span>
      )}
      {pro === "on_sale" && (
        <span className="num rounded-[5px] border border-gold/70 bg-surface px-1.5 py-[1px] text-[11px] font-bold tracking-wider text-[#8a7650]">PRO</span>
      )}
      {pro === "preparing" && (
        <span className="rounded-[5px] border border-dashed border-silver px-1.5 py-[1px] text-[11px] font-medium text-ink-2">PRO準備中</span>
      )}
    </span>
  );
}

/** 枠番 (枠色の四角) */
export function FrameBadge({ frame, size = "md" }: { frame: number; size?: "sm" | "md" }) {
  const dark = [2, 3, 4, 6].includes(frame);
  return (
    <span
      className={clsx(
        "num inline-flex shrink-0 items-center justify-center rounded-[4px] font-bold",
        size === "sm" ? "h-5 w-5 text-[11px]" : "h-6 w-6 text-[12px]",
        dark ? "text-white" : "text-ink",
        frame === 1 && "border border-silver",
      )}
      style={{ background: `var(--color-waku-${frame})` }}
      aria-label={`${frame}枠`}
    >
      {frame}
    </span>
  );
}

/* ---------------- Button ---------------- */
export function buttonClass(variant: "primary" | "secondary" | "ghost" = "primary", size: "md" | "lg" = "md") {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    size === "lg" ? "h-12 px-6 text-[15px]" : "h-10 px-4 text-[14px]",
    variant === "primary" && "bg-charcoal text-white hover:bg-charcoal-hover",
    variant === "secondary" && "border border-silver bg-surface text-ink hover:bg-surface-2",
    variant === "ghost" && "text-ink-2 hover:bg-surface-2 hover:text-ink",
  );
}

/* ---------------- EmptyState ---------------- */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-silver bg-surface px-6 py-10 text-center", className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-silver-surface text-accent-silver">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <p className="mt-3 text-[15px] font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-ink-2">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------- LoadingSkeleton ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-md bg-silver-surface", className)} />;
}

export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3">
          <Skeleton className="h-10 w-10 rounded-[10px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

/** DEMO データ注意帯 (ページ上部に必ず表示) */
export function DemoNotice() {
  return (
    <div className="border-b border-warn/20 bg-warn-bg">
      <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5 text-[12px] leading-snug text-warn lg:px-6">
        <DemoBadge />
        表示中の開催・馬名・騎手・指数はすべて架空のサンプルデータです。実際のレースとは関係ありません。
      </p>
    </div>
  );
}
