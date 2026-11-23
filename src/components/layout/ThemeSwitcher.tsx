"use client";

import { useEffect, useState } from "react";
import { Palette, X } from "lucide-react";
import clsx from "clsx";
import { THEMES, THEME_KEY as KEY, type ThemeId } from "./themes";
import { DOCK_EVENT } from "./FloatingDock";

/**
 * 配色比較パネル (デザイン検討用)
 * <html data-theme> を切り替える。選択はこのブラウザに保存 (localStorage)。
 * URL に ?theme=carbon などを付けても切り替え可能。
 * 配色が確定したら、このコンポーネントと layout の読み込みを削除する。
 */
function applyTheme(id: ThemeId) {
  if (id === "silver") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(KEY, id);
  } catch {}
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeId>("silver");

  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") as ThemeId | null;
    setCurrent(t ?? "silver");
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== "theme") setOpen(false);
    };
    window.addEventListener(DOCK_EVENT, onOther);
    return () => window.removeEventListener(DOCK_EVENT, onOther);
  }, []);

  const select = (id: ThemeId) => {
    applyTheme(id);
    setCurrent(id);
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="配色を比較"
          className="absolute right-0 bottom-full mb-2 w-[290px] max-w-[calc(100vw-24px)] rounded-[var(--radius-card)] border border-line bg-surface p-3 shadow-[var(--shadow-raised)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="num text-[11px] font-semibold tracking-[0.18em] text-accent-silver">COLOR STUDY</p>
              <p className="text-[14px] font-bold text-ink">配色を比較（検討用）</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2"
              aria-label="閉じる"
            >
              <X size={16} />
            </button>
          </div>
          <ul className="no-scrollbar max-h-[min(58vh,520px)] space-y-1.5 overflow-y-auto pr-0.5">
            {THEMES.map((t, i) => {
              const active = current === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => select(t.id)}
                    aria-pressed={active}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-[10px] border px-2.5 py-2 text-left transition-colors",
                      active ? "border-charcoal bg-surface-2" : "border-line hover:bg-surface-2",
                    )}
                  >
                    <span className="flex shrink-0 overflow-hidden rounded-[6px] border border-line">
                      {t.sw.map((c) => (
                        <span key={c} className="h-7 w-3.5" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold leading-tight text-ink"><span className="num mr-1.5 text-accent-silver">{String.fromCharCode(65 + i)}</span>{t.name}</span>
                      <span className="block text-[11.5px] leading-snug text-ink-2">{t.ja}</span>
                    </span>
                    {active && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          if (!open) window.dispatchEvent(new CustomEvent(DOCK_EVENT, { detail: "theme" }));
          setOpen(!open);
        }}
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-ink shadow-[var(--shadow-raised)]"
      >
        <Palette size={17} className="text-gold" />
        配色
      </button>
    </>
  );
}
