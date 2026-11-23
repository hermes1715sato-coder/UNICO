"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "./nav-items";

/** スマホ用 下部固定タブバー (セーフエリア対応) */
export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="下部ナビゲーション"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          const isPro = item.label === "PRO";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-ink" : "text-ink-2",
                )}
              >
                {active && (
                  <span className={clsx("absolute top-0 h-[2px] w-8 rounded-full", isPro ? "bg-gold" : "bg-charcoal")} />
                )}
                <span
                  className={clsx(
                    "flex h-8 w-11 items-center justify-center rounded-full transition-colors",
                    active && (isPro ? "border border-gold/50 bg-surface" : "silver-plate"),
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2 : 1.6} className={clsx(isPro && "text-gold")} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
