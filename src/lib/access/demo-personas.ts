/* =========================================================
   DEMO 会員状態 (Supabase Auth / Stripe 未接続の間の検証用)
   本番では session.ts の getViewer() を Supabase Auth + entitlements テーブル参照に差し替える。
   ========================================================= */
import type { Viewer } from "./policy";

export const DEMO_PERSONA_COOKIE = "unico_demo_persona";

export interface DemoPersona {
  id: string;
  label: string;
  description: string;
  viewer: Viewer;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "guest",
    label: "未ログイン",
    description: "無料指数・無料ワイドのみ",
    viewer: { userId: null, subscription: null, purchases: [] },
  },
  {
    id: "free",
    label: "無料会員",
    description: "ログイン済み・購入なし",
    viewer: { userId: "demo-free", displayName: "無料会員", subscription: null, purchases: [] },
  },
  {
    id: "single",
    label: "事前買い目 購入者",
    description: "11/28 東京11R・京都11R・11/22 東京11R を300円で購入済み",
    viewer: {
      userId: "demo-single",
      displayName: "単品購入者",
      subscription: null,
      purchases: [
        { raceId: "20261128-05-11", product: "PRE_RACE_SINGLE", purchasedAt: "2026-11-27T19:02:00+09:00" },
        { raceId: "20261128-08-11", product: "PRE_RACE_SINGLE", purchasedAt: "2026-11-27T19:05:00+09:00" },
        { raceId: "20261122-05-11", product: "PRE_RACE_SINGLE", purchasedAt: "2026-11-21T20:10:00+09:00" },
      ],
    },
  },
  {
    id: "pro",
    label: "PRO会員",
    description: "月額1,280円・契約中",
    viewer: {
      userId: "demo-pro",
      displayName: "PRO会員",
      subscription: { plan: "PRO_MONTHLY", status: "active", currentPeriodEnd: "2026-12-15T00:00:00+09:00", cancelAtPeriodEnd: false },
      purchases: [],
    },
  },
  {
    id: "pro_canceling",
    label: "PRO 解約予約中",
    description: "解約済み・12/1 まで利用可能",
    viewer: {
      userId: "demo-pro-canceling",
      displayName: "PRO解約予約",
      subscription: { plan: "PRO_MONTHLY", status: "active", currentPeriodEnd: "2026-12-01T00:00:00+09:00", cancelAtPeriodEnd: true },
      purchases: [],
    },
  },
  {
    id: "pro_expired",
    label: "PRO 期間終了",
    description: "11/25 にPRO期間終了。以前に11/28 東京11Rを単品購入",
    viewer: {
      userId: "demo-pro-expired",
      displayName: "PRO期間終了",
      subscription: { plan: "PRO_MONTHLY", status: "canceled", currentPeriodEnd: "2026-11-25T00:00:00+09:00", cancelAtPeriodEnd: true },
      purchases: [{ raceId: "20261128-05-11", product: "PRE_RACE_SINGLE", purchasedAt: "2026-11-20T21:00:00+09:00" }],
    },
  },
];

export function findPersona(id: string | undefined | null): DemoPersona {
  return DEMO_PERSONAS.find((p) => p.id === id) ?? DEMO_PERSONAS[0];
}
