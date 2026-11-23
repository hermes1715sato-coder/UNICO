"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import clsx from "clsx";
import { UnicoLogo } from "@/components/brand/UnicoLogo";
import { NAV_ITEMS } from "./nav-items";
import { UnicornMark } from "@/components/brand/UnicornMark";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-surface/92 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      {/* 下端: 中央が明るいマットシルバーのヘアライン */}
      <div aria-hidden className="silver-rule absolute inset-x-0 bottom-0" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:h-16 lg:px-6">
        <Link href="/" aria-label="UNICO ホーム" className="shrink-0">
          <UnicoLogo />
        </Link>

        {/* PC: 必要最小限のナビゲーション */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="メインナビゲーション">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
                  active ? "bg-charcoal text-white" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                {item.label}
                {item.label === "PRO" && <UnicornMark size={16} tone="gold" className="-mt-0.5 ml-1.5 align-middle" />}
              </Link>
            );
          })}
        </nav>

        {/* スマホ: マイページアイコンのみ (主要導線は下部ナビ) */}
        <Link
          href="/mypage"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 lg:hidden"
          aria-label="マイページ"
        >
          <UserRound size={20} strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
