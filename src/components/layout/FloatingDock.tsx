import type { ReactNode } from "react";

/** 右下のフローティング操作 (検証用ツール) を重ならないよう横並びにまとめる */
export const DOCK_EVENT = "unico-dock-open";

export function FloatingDock({ children }: { children: ReactNode }) {
  return (
    <div className="fixed right-3 bottom-[calc(var(--bottom-nav-h)+var(--safe-bottom)+12px)] z-50 flex items-end gap-2 lg:right-6 lg:bottom-6">
      {children}
    </div>
  );
}
