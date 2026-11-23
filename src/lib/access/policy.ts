/* =========================================================
   閲覧権限ポリシー (純関数・サーバー側で使用)
   UNICO の3階層:
     FREE            無料指数・無料ワイドBOXのみ
     SINGLE_PURCHASE 購入した race_id の PRE_RACE のみ (FINAL は不可)
     PRO             有効な月額契約期間中、全対象レースの PRE_RACE + FINAL + PRO分析
   単品購入の権限は PRO 解約後も保持。PRO の権限は契約期間終了で失効。
   ========================================================= */

export const PRE_RACE_PRICE_JPY = 300;
export const PRO_MONTHLY_PRICE_JPY = 1280;

/** Stripe のサブスクリプション状態に準拠 */
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid";

export interface Subscription {
  plan: "PRO_MONTHLY";
  status: SubscriptionStatus;
  currentPeriodEnd: string;   // ISO。この日時まで有効
  cancelAtPeriodEnd: boolean; // 解約予約済み (期間終了まで利用可)
}

export interface Purchase {
  raceId: string;
  product: "PRE_RACE_SINGLE";
  purchasedAt: string;
}

export interface Viewer {
  userId: string | null;      // null = 未ログイン
  displayName?: string;
  subscription: Subscription | null;
  purchases: Purchase[];
}

export type AccessTier = "GUEST" | "FREE" | "SINGLE_PURCHASE" | "PRO";

export type Resource =
  | "PRE_RACE"            // 事前買い目
  | "FINAL"               // 最終買い目
  | "PRO_ANALYSIS"        // 予想印・項目別指数・陣営AI など
  | "PREDICTION_HISTORY"; // 公開履歴の詳細・事前→最終の差分

export const GUEST: Viewer = { userId: null, subscription: null, purchases: [] };

/** PRO が有効か: active/trialing かつ 契約期間内 */
export function isProActive(v: Viewer, now: string): boolean {
  const s = v.subscription;
  if (!s) return false;
  if (s.status !== "active" && s.status !== "trialing") return false;
  return Date.parse(now) < Date.parse(s.currentPeriodEnd);
}

export function hasPurchased(v: Viewer, raceId: string): boolean {
  return v.purchases.some((p) => p.raceId === raceId && p.product === "PRE_RACE_SINGLE");
}

/** レース単位の閲覧階層 */
export function tierForRace(v: Viewer, raceId: string, now: string): AccessTier {
  if (isProActive(v, now)) return "PRO";
  if (hasPurchased(v, raceId)) return "SINGLE_PURCHASE";
  return v.userId ? "FREE" : "GUEST";
}

/** 権限判定 (公開状態の判定は含まない。公開済みかどうかは store 側で判定) */
export function canView(v: Viewer, raceId: string, resource: Resource, now: string): boolean {
  const pro = isProActive(v, now);
  switch (resource) {
    case "PRE_RACE":
      return pro || hasPurchased(v, raceId);
    case "FINAL":
    case "PRO_ANALYSIS":
    case "PREDICTION_HISTORY":
      return pro; // 単品購入者には決して拡大しない
  }
}

/** 広告表示: PRO 会員は非表示 */
export function showAds(v: Viewer, now: string): boolean {
  return !isProActive(v, now);
}

/** 事前買い目を300円で購入できるか。PRO会員には追加決済を要求しない */
export function canPurchasePreRace(
  v: Viewer,
  raceId: string,
  now: string,
  opts: { preRacePublished: boolean; raceClosed: boolean },
): { ok: boolean; reason?: "LOGIN_REQUIRED" | "PRO_INCLUDED" | "ALREADY_PURCHASED" | "NOT_PUBLISHED" | "RACE_CLOSED" } {
  if (!v.userId) return { ok: false, reason: "LOGIN_REQUIRED" };
  if (isProActive(v, now)) return { ok: false, reason: "PRO_INCLUDED" };
  if (hasPurchased(v, raceId)) return { ok: false, reason: "ALREADY_PURCHASED" };
  if (opts.raceClosed) return { ok: false, reason: "RACE_CLOSED" };
  if (!opts.preRacePublished) return { ok: false, reason: "NOT_PUBLISHED" };
  return { ok: true };
}
