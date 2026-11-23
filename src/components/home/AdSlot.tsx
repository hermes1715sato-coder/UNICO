import clsx from "clsx";

/**
 * 広告枠プレースホルダー (無料ページ用)。
 * 実際の広告タグは未接続。レース一覧の途中には置かないこと。
 */
export function AdSlot({ id, className }: { id: string; className?: string }) {
  return (
    <aside
      aria-label="広告"
      data-ad-slot={id}
      className={clsx(
        "flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-silver bg-surface-2/60 px-4 py-4 text-center lg:min-h-[110px]",
        className,
      )}
    >
      <span className="rounded-[4px] border border-line bg-surface px-1.5 text-[11px] font-semibold tracking-[0.1em] text-ink-2">広告</span>
      <span className="text-[12px] text-accent-silver">広告枠（プレースホルダー）</span>
    </aside>
  );
}
