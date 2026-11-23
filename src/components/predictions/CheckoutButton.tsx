"use client";

import { useState } from "react";
import clsx from "clsx";
import { Info, Loader2 } from "lucide-react";

/**
 * 決済開始ボタン。サーバー (/api/checkout/*) の応答をそのまま表示する。
 * 決済が未接続の間は 503 PAYMENT_NOT_CONFIGURED が返るため、成功を装わない。
 * 成功時 (将来) は返却された Checkout URL へ遷移する。
 */
const MESSAGES: Record<string, string> = {
  PAYMENT_NOT_CONFIGURED: "決済機能は準備中です。現在は購入できません。",
  LOGIN_REQUIRED: "購入にはログインが必要です（会員機能は準備中です）。",
  UNAUTHORIZED: "購入にはログインが必要です（会員機能は準備中です）。",
  PRO_INCLUDED: "PRO会員は追加料金なしで閲覧できます。",
  ALREADY_PURCHASED: "このレースの事前買い目は購入済みです。",
  ALREADY_SUBSCRIBED: "すでにPRO会員です。",
  PRO_ALREADY_ACTIVE: "すでにPRO会員です。",
  NOT_TARGET: "このレースは買い目の対象外です。",
  RACE_NOT_FOUND: "レースが見つかりません。",
  PAYMENT_PROVIDER_ERROR: "決済サービスとの通信に失敗しました。時間をおいて再度お試しください。",
  NOT_PUBLISHED: "事前買い目の公開後に購入できます。",
  RACE_CLOSED: "このレースの販売は終了しました。",
};

export function CheckoutButton({
  endpoint,
  body,
  label,
  className,
  tone = "silver",
}: {
  endpoint: "/api/checkout/pre-race" | "/api/checkout/pro";
  body?: Record<string, unknown>;
  label: string;
  className?: string;
  tone?: "silver" | "gold";
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function start() {
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string; message?: string } | null;
      if (res.ok && data?.url) {
        window.location.assign(data.url);
        return;
      }
      const code = data?.error ?? (res.status === 404 ? "PAYMENT_NOT_CONFIGURED" : "");
      setMessage(MESSAGES[code] ?? data?.message ?? "現在は購入手続きを開始できません。時間をおいて再度お試しください。");
    } catch {
      setMessage("通信に失敗しました。時間をおいて再度お試しください。");
    }
    setState("done");
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={start}
        disabled={state === "loading"}
        className={clsx(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-70",
          "bg-charcoal text-white hover:bg-charcoal-hover",
          tone === "gold" && "ring-1 ring-gold/50 ring-offset-2 ring-offset-surface",
        )}
      >
        {state === "loading" && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {label}
      </button>
      <p aria-live="polite" className={clsx("text-[12.5px] leading-relaxed", message ? "mt-2" : "sr-only")}>
        {message && (
          <span className="flex items-start gap-1.5 rounded-[10px] border border-line bg-surface-2 px-3 py-2 text-ink">
            <Info size={14} strokeWidth={1.8} className="mt-[3px] shrink-0 text-accent-silver" aria-hidden />
            {message}
          </span>
        )}
      </p>
    </div>
  );
}
