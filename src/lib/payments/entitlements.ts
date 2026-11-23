/* =========================================================
   Stripe イベント → 会員権限 (エンタイトルメント) の適用 (純関数)
   - checkout.session.completed (mode=payment, product=PRE_RACE_SINGLE)
       → そのレースの PRE_RACE 単品購入だけを追加。FINAL / PRO の権利には一切触れない。
   - customer.subscription.created / updated / deleted
       → PRO サブスクリプション (status / current_period_end / cancel_at_period_end) を更新。
   - イベント ID で冪等 (同じイベントの再送は無視)。
   永続化は EntitlementRepository の背後に隠す。DEMO では InMemory 実装。
   TODO(本番): SupabaseEntitlementRepository を実装し、stripe_events / purchases /
   subscriptions テーブルへ service_role で書き込む (supabase/schema.sql 参照)。
   その上で session.ts の getViewer() が同リポジトリから Viewer を組み立てる。
   このモジュールは Stripe SDK に依存しない (Stripe の Event と構造互換の最小型のみ)。
   ========================================================= */
import type { Purchase, Subscription, SubscriptionStatus, Viewer } from "../access/policy";

export const PRODUCT_PRE_RACE_SINGLE = "PRE_RACE_SINGLE" as const;
export const PRODUCT_PRO_MONTHLY = "PRO_MONTHLY" as const;

/* ---------- Stripe 互換の最小イベント型 ---------- */
export interface StripeLikeEvent {
  id: string;
  type: string;
  created: number; // unix 秒
  data: { object: unknown };
}

export interface CheckoutSessionLike {
  id: string;
  mode: "payment" | "subscription" | "setup";
  payment_status?: "paid" | "unpaid" | "no_payment_required";
  client_reference_id?: string | null;
  customer?: string | null;
  payment_intent?: string | null;
  subscription?: string | null;
  metadata?: Record<string, string> | null;
  created?: number;
}

export interface SubscriptionLike {
  id: string;
  customer?: string | null;
  status: string;
  cancel_at_period_end: boolean;
  /** 旧 API バージョン */
  current_period_end?: number;
  /** 新 API バージョン (2025-03-31 以降) は item 側に期間を持つ */
  items?: { data?: { current_period_end?: number }[] };
  metadata?: Record<string, string> | null;
}

/* ---------- 権限状態 ---------- */
export interface StoredPurchase extends Purchase {
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string | null;
}

export interface UserEntitlements {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscription: Subscription | null;
  /** subscription を最後に更新したイベントの created (順不同到着対策) */
  subscriptionEventCreated?: number;
  purchases: StoredPurchase[];
}

export interface EntitlementState {
  users: Record<string, UserEntitlements>;
  processedEventIds: string[];
}

export const EMPTY_ENTITLEMENTS: EntitlementState = { users: {}, processedEventIds: [] };

export type ApplyOutcome =
  | { kind: "duplicate" }
  | { kind: "ignored"; reason: string }
  | { kind: "purchase_added"; userId: string; raceId: string }
  | { kind: "purchase_exists"; userId: string; raceId: string }
  | {
      kind: "subscription_updated";
      userId: string;
      status: SubscriptionStatus;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
    }
  | { kind: "stale_subscription_event"; userId: string };

const iso = (unixSec: number) => new Date(unixSec * 1000).toISOString();

/** Stripe の status をアプリの SubscriptionStatus に正規化 (未知の値は権限なし側へ) */
export function normalizeSubscriptionStatus(s: string): SubscriptionStatus {
  switch (s) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "incomplete":
      return s;
    case "incomplete_expired":
      return "canceled";
    default: // paused など
      return "unpaid";
  }
}

export function subscriptionPeriodEnd(sub: SubscriptionLike): number | null {
  if (typeof sub.current_period_end === "number") return sub.current_period_end;
  const ends = (sub.items?.data ?? [])
    .map((i) => i.current_period_end)
    .filter((n): n is number => typeof n === "number");
  return ends.length ? Math.max(...ends) : null;
}

function userOf(state: EntitlementState, userId: string): UserEntitlements {
  return state.users[userId] ?? { userId, subscription: null, purchases: [] };
}

function withUser(state: EntitlementState, u: UserEntitlements, eventId: string): EntitlementState {
  return { users: { ...state.users, [u.userId]: u }, processedEventIds: [...state.processedEventIds, eventId] };
}

function markOnly(state: EntitlementState, eventId: string): EntitlementState {
  return { ...state, processedEventIds: [...state.processedEventIds, eventId] };
}

function ignored(state: EntitlementState, eventId: string, reason: string) {
  return { state: markOnly(state, eventId), outcome: { kind: "ignored", reason } as ApplyOutcome };
}

/** イベントを状態へ適用 (純関数。入力の state は変更しない) */
export function applyStripeEvent(
  state: EntitlementState,
  event: StripeLikeEvent,
): { state: EntitlementState; outcome: ApplyOutcome } {
  if (state.processedEventIds.includes(event.id)) return { state, outcome: { kind: "duplicate" } };

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object as CheckoutSessionLike;
      const md = s.metadata ?? {};
      // サブスクリプションの Checkout は customer.subscription.* で処理する
      if (s.mode !== "payment" || md.product !== PRODUCT_PRE_RACE_SINGLE) {
        return ignored(state, event.id, "not a PRE_RACE_SINGLE payment");
      }
      // 非同期決済は async_payment_succeeded で paid になってから付与
      if (s.payment_status !== "paid") return ignored(state, event.id, "payment not completed");
      const userId = md.userId || s.client_reference_id || "";
      const raceId = md.raceId || "";
      if (!userId || !raceId) return ignored(state, event.id, "missing userId/raceId metadata");

      const u = userOf(state, userId);
      if (u.purchases.some((p) => p.raceId === raceId && p.product === PRODUCT_PRE_RACE_SINGLE)) {
        return { state: markOnly(state, event.id), outcome: { kind: "purchase_exists", userId, raceId } };
      }
      const purchase: StoredPurchase = {
        raceId,
        product: PRODUCT_PRE_RACE_SINGLE,
        purchasedAt: iso(s.created ?? event.created),
        stripeCheckoutSessionId: s.id,
        stripePaymentIntentId: s.payment_intent ?? null,
      };
      // 単品購入は purchases にだけ追加する。subscription (FINAL / PRO 権限) は変更しない
      const next: UserEntitlements = {
        ...u,
        stripeCustomerId: u.stripeCustomerId ?? s.customer ?? null,
        purchases: [...u.purchases, purchase],
      };
      return { state: withUser(state, next, event.id), outcome: { kind: "purchase_added", userId, raceId } };
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as SubscriptionLike;
      const userId = sub.metadata?.userId || findUserBySubscription(state, sub);
      if (!userId) return ignored(state, event.id, "unknown user for subscription");
      const u = userOf(state, userId);
      if (u.subscriptionEventCreated !== undefined && event.created < u.subscriptionEventCreated) {
        return { state: markOnly(state, event.id), outcome: { kind: "stale_subscription_event", userId } };
      }
      const end = subscriptionPeriodEnd(sub);
      if (end === null) return ignored(state, event.id, "missing current_period_end");
      const status: SubscriptionStatus =
        event.type === "customer.subscription.deleted" ? "canceled" : normalizeSubscriptionStatus(sub.status);
      const subscription: Subscription = {
        plan: PRODUCT_PRO_MONTHLY,
        status,
        currentPeriodEnd: iso(end),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
      // 単品購入 (purchases) は PRO の状態に関係なく保持する
      const next: UserEntitlements = {
        ...u,
        stripeCustomerId: sub.customer ?? u.stripeCustomerId ?? null,
        stripeSubscriptionId: sub.id,
        subscription,
        subscriptionEventCreated: event.created,
      };
      return {
        state: withUser(state, next, event.id),
        outcome: {
          kind: "subscription_updated",
          userId,
          status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
      };
    }

    default:
      return ignored(state, event.id, `unhandled event type ${event.type}`);
  }
}

function findUserBySubscription(state: EntitlementState, sub: SubscriptionLike): string | null {
  const u = Object.values(state.users).find(
    (x) =>
      (x.stripeSubscriptionId && x.stripeSubscriptionId === sub.id) ||
      (sub.customer && x.stripeCustomerId === sub.customer),
  );
  return u?.userId ?? null;
}

/** 権限状態から policy.ts の Viewer を組み立てる */
export function viewerFromEntitlements(state: EntitlementState, userId: string, displayName?: string): Viewer {
  const u = state.users[userId];
  return {
    userId,
    displayName,
    subscription: u?.subscription ?? null,
    purchases: (u?.purchases ?? []).map(({ raceId, product, purchasedAt }) => ({ raceId, product, purchasedAt })),
  };
}

/* ---------- 永続化インターフェース ---------- */
export interface EntitlementRepository {
  /** イベントを冪等に適用する。DB 実装は同一トランザクションで stripe_events への insert (PK 衝突=処理済み) を先に行うこと */
  applyEvent(event: StripeLikeEvent): Promise<ApplyOutcome>;
  getViewer(userId: string): Promise<Viewer>;
}

/** DEMO / テスト用のインメモリ実装 (プロセス再起動で消える) */
export class InMemoryEntitlementRepository implements EntitlementRepository {
  private state: EntitlementState;
  constructor(initial: EntitlementState = EMPTY_ENTITLEMENTS) {
    this.state = initial;
  }
  async applyEvent(event: StripeLikeEvent) {
    const r = applyStripeEvent(this.state, event);
    this.state = r.state;
    return r.outcome;
  }
  async getViewer(userId: string) {
    return viewerFromEntitlements(this.state, userId);
  }
  snapshot(): EntitlementState {
    return this.state;
  }
}

let repo: EntitlementRepository | null = null;
/** アプリ全体で共有するリポジトリ (DEMO はインメモリ) */
export function getEntitlementRepository(): EntitlementRepository {
  repo ??= new InMemoryEntitlementRepository();
  return repo;
}
/** テスト用 */
export function __setEntitlementRepository(r: EntitlementRepository | null) {
  repo = r;
}
