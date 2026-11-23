"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Loader2, UserRoundCog, X } from "lucide-react";
import { DEMO_PERSONAS } from "@/lib/access/demo-personas";
import { setDemoPersona } from "@/app/actions/demo";
import { DOCK_EVENT } from "./FloatingDock";

/**
 * DEMO 会員状態の切り替え (検証用)。Cookie unico_demo_persona を Server Action で設定し、再描画する。
 * 本番 (Supabase Auth 接続後) は削除する。
 */
export function DemoPersonaSwitcher({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState(current);
  const router = useRouter();

  useEffect(() => setSelected(current), [current]);
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== "demo") setOpen(false);
    };
    window.addEventListener(DOCK_EVENT, onOther);
    return () => window.removeEventListener(DOCK_EVENT, onOther);
  }, []);

  const toggle = () => {
    if (!open) window.dispatchEvent(new CustomEvent(DOCK_EVENT, { detail: "demo" }));
    setOpen(!open);
  };

  const choose = (id: string) => {
    setSelected(id);
    start(async () => {
      await setDemoPersona(id);
      router.refresh();
    });
  };

  const label = DEMO_PERSONAS.find((p) => p.id === selected)?.label ?? "未ログイン";

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="DEMO会員状態の切り替え"
          className="absolute right-0 bottom-full mb-2 w-[300px] max-w-[calc(100vw-24px)] rounded-[var(--radius-card)] border border-line bg-surface p-3 shadow-[var(--shadow-raised)]"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5">
                <span className="num rounded-[4px] border border-warn/40 bg-warn-bg px-1 text-[11px] font-bold tracking-[0.12em] text-warn">DEMO</span>
                <span className="text-[11px] font-semibold text-ink-2">検証用</span>
              </p>
              <p className="mt-0.5 text-[14px] font-bold text-ink">会員状態を切り替える</p>
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
          <ul className="no-scrollbar max-h-[min(58vh,520px)] space-y-1.5 overflow-y-auto">
            {DEMO_PERSONAS.map((p) => {
              const active = selected === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choose(p.id)}
                    aria-pressed={active}
                    disabled={pending}
                    className={clsx(
                      "flex w-full items-start gap-2.5 rounded-[10px] border px-2.5 py-2 text-left transition-colors disabled:cursor-wait",
                      active ? "border-charcoal bg-surface-2" : "border-line hover:bg-surface-2",
                    )}
                  >
                    <span
                      aria-hidden
                      className={clsx("mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full border", active ? "border-charcoal bg-charcoal" : "border-silver")}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold leading-tight text-ink">{p.label}</span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-2">{p.description}</span>
                    </span>
                    {active && pending && <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-ink-2" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-2">
            表示確認用の仮の会員状態です。実際のログイン・決済とは関係ありません。
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`DEMO会員: ${label}（切り替え）`}
        className="flex h-11 max-w-[188px] items-center gap-1.5 rounded-full border border-line bg-surface pr-3.5 pl-2.5 text-[13px] font-semibold text-ink shadow-[var(--shadow-raised)] sm:max-w-[260px]"
      >
        {pending ? <Loader2 size={16} className="shrink-0 animate-spin text-ink-2" aria-hidden /> : <UserRoundCog size={17} className="shrink-0 text-accent-silver" aria-hidden />}
        <span className="num shrink-0 rounded-[4px] border border-warn/40 bg-warn-bg px-1 text-[11px] font-bold leading-[16px] tracking-[0.1em] text-warn">DEMO</span>
        <span className="truncate">{label}</span>
      </button>
    </>
  );
}
