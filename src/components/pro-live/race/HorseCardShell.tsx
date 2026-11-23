"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

/**
 * 馬別カードの開閉 (<details>)。PC 幅では上位カードを初期展開する。
 * スマホは全て閉じた状態から始め、縦に長くなりすぎないようにする。
 */
export function HorseCardShell({
  summary,
  children,
  openOnDesktop = false,
  className,
}: {
  summary: ReactNode;
  children: ReactNode;
  openOnDesktop?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (openOnDesktop && ref.current && window.matchMedia("(min-width: 1024px)").matches) ref.current.open = true;
  }, [openOnDesktop]);
  return (
    <details ref={ref} className={clsx("group", className)}>
      {summary}
      {children}
    </details>
  );
}

/**
 * 詳細パネルの切替。スマホはタブで 1 パネルずつ、PC (lg) は全パネルを段組みで一覧表示。
 * パネルの中身はサーバーで描画済み (PRO 判定後のみ渡される)。
 */
export function HorseDetailTabs({ panels }: { panels: { id: string; col: 0 | 1 | 2; label: string; node: ReactNode }[] }) {
  const [active, setActive] = useState(panels[0]?.id);
  return (
    <div>
      <div role="tablist" aria-label="分析項目" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:hidden">
        {panels.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={active === p.id}
            onClick={() => setActive(p.id)}
            className={clsx(
              "h-8 shrink-0 rounded-full border px-3 text-[12.5px] font-semibold transition-colors",
              active === p.id ? "border-charcoal bg-charcoal text-white" : "border-line bg-surface text-ink-2 hover:text-ink",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-3">
        {([0, 1, 2] as const).map((c) => (
          <div key={c} className="lg:flex lg:flex-col lg:gap-3">
            {panels
              .filter((p) => p.col === c)
              .map((p) => (
                <div key={p.id} role="tabpanel" aria-label={p.label} className={clsx("lg:block", active === p.id ? "block" : "hidden")}>
                  {p.node}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
