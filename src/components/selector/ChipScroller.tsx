"use client";

import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";

/**
 * 横スクロールのチップ列。初回表示時に選択中 (aria-current) のチップが
 * 見える位置まで横方向だけスクロールする (ページの縦スクロールは動かさない)。
 * JS無効でも通常の横スクロール列として機能する。
 */
export function ChipScroller({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sel = el.querySelector<HTMLElement>("[aria-current]");
    if (!sel) return;
    const left = sel.offsetLeft - (el.clientWidth - sel.offsetWidth) / 2;
    el.scrollLeft = Math.max(0, left);
  }, []);
  return (
    <div ref={ref} role="group" aria-label={label} className={clsx("no-scrollbar relative overflow-x-auto", className)}>
      {children}
    </div>
  );
}
