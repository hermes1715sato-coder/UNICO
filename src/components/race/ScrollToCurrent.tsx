"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** 横スクロールのチップ列で、現在のチップ (aria-current) を中央付近に表示する */
export function ScrollToCurrent({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cur = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (!cur) return;
    const left = cur.offsetLeft - el.clientWidth / 2 + cur.offsetWidth / 2;
    el.scrollLeft = Math.max(0, left);
  }, []);
  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}
