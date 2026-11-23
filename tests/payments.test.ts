/* Stripe Webhook → 権限適用 (純関数 + Route Handler) と、Stripe 設定時の Checkout 作成内容 */
import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", async () => (await import("./support/harness")).nextHeadersMock());
// Stripe API へは接続しない: checkout.sessions.create をスパイに差し替える
const createSession = vi.fn(async (params: Record<string, unknown>) => ({
  id: "cs_test_123",
  url: "https://checkout.stripe.com/c/pay/cs_test_123",
  params,
}));
vi.mock("@/lib/payments/stripe", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/payments/stripe")>();
  return {
    ...orig,
    getStripe: () => (process.env.STRIPE_SECRET_KEY ? { checkout: { sessions: { create: createSession } } } : null),
  };
});

import { POST as webhook } from "@/app/api/stripe/webhook/route";
import { POST as postPreCheckout } from "@/app/api/checkout/pre-race/route";
import { POST as postProCheckout } from "@/app/api/checkout/pro/route";
import { canView, isProActive } from "@/lib/access/policy";
import {
  EMPTY_ENTITLEMENTS,
  InMemoryEntitlementRepository,
  __setEntitlementRepository,
  applyStripeEvent,
  viewerFromEntitlements,
  type EntitlementState,
  type StripeLikeEvent,
} from "@/lib/payments/entitlements";
import { getRacePredictionView } from "@/lib/predictions/view";
import { call, DEMO_NOW, postJson, setPersona } from "./support/harness";

const R_TOKYO11 = "20261128-05-11";
const R_PUB = "20261128-05-06";
const R_FIN1122 = "20261122-05-11";
const SECRET = "whsec_test_secret";
const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000);

function preRaceCompleted(
  id: string,
  userId: string,
  raceId: string,
  extra: Record<string, unknown> = {},
): StripeLikeEvent {
  return {
    id,
    type: "checkout.session.completed",
    created: unix("2026-11-28T10:00:00+09:00"),
    data: {
      object: {
        id: `cs_${id}`,
        mode: "payment",
        payment_status: "paid",
        client_reference_id: userId,
        customer: "cus_1",
        payment_intent: `pi_${id}`,
        metadata: { userId, raceId, product: "PRE_RACE_SINGLE" },
        ...extra,
      },
    },
  };
}

function subEvent(
  id: string,
  type: "created" | "updated" | "deleted",
  opts: { status: string; periodEnd: string; cancelAtPeriodEnd?: boolean; created?: string; newApiShape?: boolean },
): StripeLikeEvent {
  const end = unix(opts.periodEnd);
  return {
    id,
    type: `customer.subscription.${type}`,
    created: unix(opts.created ?? "2026-11-28T10:00:00+09:00"),
    data: {
      object: {
        id: "sub_1",
        customer: "cus_1",
        status: opts.status,
        cancel_at_period_end: opts.cancelAtPeriodEnd ?? false,
        metadata: { userId: "u1", product: "PRO_MONTHLY" },
        ...(opts.newApiShape ? { items: { data: [{ current_period_end: end }] } } : { current_period_end: end }),
      },
    },
  };
}

function applyAll(events: StripeLikeEvent[], s: EntitlementState = EMPTY_ENTITLEMENTS) {
  return events.reduce((acc, e) => applyStripeEvent(acc, e).state, s);
}

describe("entitlements (純関数)", () => {
  it("単品購入 Webhook はそのレースの PRE_RACE のみ付与し、FINAL / PRO 権限は付与しない", async () => {
    const s = applyAll([preRaceCompleted("evt_1", "u1", R_TOKYO11)]);
    const v = viewerFromEntitlements(s, "u1");
    expect(v.purchases).toEqual([
      { raceId: R_TOKYO11, product: "PRE_RACE_SINGLE", purchasedAt: "2026-11-28T01:00:00.000Z" },
    ]);
    expect(v.subscription).toBeNull();
    expect(isProActive(v, DEMO_NOW)).toBe(false);
    expect(canView(v, R_TOKYO11, "PRE_RACE", DEMO_NOW)).toBe(true);
    for (const res of ["FINAL", "PRO_ANALYSIS", "PREDICTION_HISTORY"] as const) {
      expect(canView(v, R_TOKYO11, res, DEMO_NOW)).toBe(false);
    }
    expect(canView(v, R_PUB, "PRE_RACE", DEMO_NOW)).toBe(false);
    // ビュー上も FINAL 公開後に FINAL は見えない
    const view = (await getRacePredictionView(R_TOKYO11, v, "2026-11-28T15:00:00+09:00"))!;
    expect(view.preRace.state).toBe("available");
    expect(view.final.data).toBeNull();
  });

  it("metadata の product が違う / mode=subscription / 未払い / metadata 欠落 は付与しない", () => {
    for (const extra of [
      { metadata: { userId: "u1", raceId: R_TOKYO11, product: "SOMETHING_ELSE" } },
      { mode: "subscription" },
      { payment_status: "unpaid" },
      { metadata: { userId: "u1", product: "PRE_RACE_SINGLE" } },
    ]) {
      const r = applyStripeEvent(EMPTY_ENTITLEMENTS, preRaceCompleted("evt_x", "u1", R_TOKYO11, extra));
      expect(r.outcome.kind).toBe("ignored");
      expect(viewerFromEntitlements(r.state, "u1").purchases).toEqual([]);
    }
  });

  it("イベント ID で冪等 (同一イベントの再送は duplicate・状態不変)", () => {
    const e = preRaceCompleted("evt_1", "u1", R_TOKYO11);
    const a = applyStripeEvent(EMPTY_ENTITLEMENTS, e);
    const b = applyStripeEvent(a.state, e);
    expect(b.outcome).toEqual({ kind: "duplicate" });
    expect(b.state).toBe(a.state);
    // 別イベント ID で同じレースの購入 → 二重付与しない
    const c = applyStripeEvent(a.state, preRaceCompleted("evt_2", "u1", R_TOKYO11));
    expect(c.outcome.kind).toBe("purchase_exists");
    expect(viewerFromEntitlements(c.state, "u1").purchases).toHaveLength(1);
  });

  it("入力 state を変更しない (純関数)", () => {
    const before = JSON.stringify(EMPTY_ENTITLEMENTS);
    applyStripeEvent(EMPTY_ENTITLEMENTS, preRaceCompleted("evt_1", "u1", R_TOKYO11));
    expect(JSON.stringify(EMPTY_ENTITLEMENTS)).toBe(before);
  });

  it("サブスク: created→active / updated(cancel_at_period_end)→期間末まで有効 / deleted→失効", () => {
    let s = applyAll([subEvent("evt_s1", "created", { status: "active", periodEnd: "2026-12-15T00:00:00+09:00" })]);
    let v = viewerFromEntitlements(s, "u1");
    expect(isProActive(v, DEMO_NOW)).toBe(true);
    expect(canView(v, R_PUB, "FINAL", DEMO_NOW)).toBe(true);

    s = applyAll(
      [
        subEvent("evt_s2", "updated", {
          status: "active",
          periodEnd: "2026-12-15T00:00:00+09:00",
          cancelAtPeriodEnd: true,
          created: "2026-11-28T11:00:00+09:00",
        }),
      ],
      s,
    );
    v = viewerFromEntitlements(s, "u1");
    expect(v.subscription?.cancelAtPeriodEnd).toBe(true);
    expect(isProActive(v, "2026-12-14T23:59:59+09:00")).toBe(true);
    expect(isProActive(v, "2026-12-15T00:00:00+09:00")).toBe(false);

    s = applyAll(
      [
        subEvent("evt_s3", "deleted", {
          status: "canceled",
          periodEnd: "2026-12-15T00:00:00+09:00",
          created: "2026-12-15T00:00:05+09:00",
        }),
      ],
      s,
    );
    v = viewerFromEntitlements(s, "u1");
    expect(v.subscription?.status).toBe("canceled");
    expect(isProActive(v, DEMO_NOW)).toBe(false);
  });

  it("新 API 形状 (items.data[].current_period_end) にも対応", () => {
    const s = applyAll([
      subEvent("evt_n", "created", { status: "trialing", periodEnd: "2026-12-15T00:00:00+09:00", newApiShape: true }),
    ]);
    expect(viewerFromEntitlements(s, "u1").subscription?.currentPeriodEnd).toBe("2026-12-14T15:00:00.000Z");
  });

  it("順不同で届いた古い subscription イベントは無視", () => {
    const s1 = applyAll([
      subEvent("evt_new", "deleted", {
        status: "canceled",
        periodEnd: "2026-12-15T00:00:00+09:00",
        created: "2026-12-01T00:00:00+09:00",
      }),
    ]);
    const r = applyStripeEvent(
      s1,
      subEvent("evt_old", "updated", {
        status: "active",
        periodEnd: "2026-12-15T00:00:00+09:00",
        created: "2026-11-20T00:00:00+09:00",
      }),
    );
    expect(r.outcome.kind).toBe("stale_subscription_event");
    expect(viewerFromEntitlements(r.state, "u1").subscription?.status).toBe("canceled");
  });

  it("PRO 解約後も単品購入は保持される", () => {
    const s = applyAll([
      preRaceCompleted("evt_p", "u1", R_TOKYO11),
      subEvent("evt_s1", "created", { status: "active", periodEnd: "2026-11-25T00:00:00+09:00" }),
      subEvent("evt_s2", "deleted", {
        status: "canceled",
        periodEnd: "2026-11-25T00:00:00+09:00",
        created: "2026-11-28T11:00:00+09:00",
      }),
    ]);
    const v = viewerFromEntitlements(s, "u1");
    expect(isProActive(v, DEMO_NOW)).toBe(false);
    expect(canView(v, R_TOKYO11, "PRE_RACE", DEMO_NOW)).toBe(true);
    expect(canView(v, R_TOKYO11, "FINAL", DEMO_NOW)).toBe(false);
  });

  it("past_due / unpaid / paused は PRO として扱わない", () => {
    for (const status of ["past_due", "unpaid", "paused", "incomplete_expired"]) {
      const s = applyAll([subEvent(`evt_${status}`, "updated", { status, periodEnd: "2026-12-15T00:00:00+09:00" })]);
      expect(isProActive(viewerFromEntitlements(s, "u1"), DEMO_NOW)).toBe(false);
    }
  });
});

describe("POST /api/stripe/webhook", () => {
  let repo: InMemoryEntitlementRepository;
  const send = (payload: string, sig?: string) =>
    call(
      webhook(
        new Request("http://localhost/api/stripe/webhook", {
          method: "POST",
          headers: sig ? { "stripe-signature": sig } : {},
          body: payload,
        }),
      ),
    );
  const signed = (e: StripeLikeEvent) => {
    const payload = JSON.stringify({ object: "event", ...e });
    return { payload, sig: Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET }) };
  };

  beforeEach(() => {
    repo = new InMemoryEntitlementRepository();
    __setEntitlementRepository(repo);
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    __setEntitlementRepository(null);
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("シークレット未設定なら 503 (未検証イベントで権限付与しない)", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const { payload, sig } = signed(preRaceCompleted("evt_1", "u1", R_TOKYO11));
    const r = await send(payload, sig);
    expect(r.status).toBe(503);
    expect((await repo.getViewer("u1")).purchases).toEqual([]);
  });

  it("署名なし / 不正署名 / 改ざんは 400", async () => {
    const { payload, sig } = signed(preRaceCompleted("evt_1", "u1", R_TOKYO11));
    expect((await send(payload)).status).toBe(400);
    expect((await send(payload, "t=1,v1=deadbeef")).status).toBe(400);
    expect((await send(payload.replace(R_TOKYO11, R_PUB), sig)).status).toBe(400);
    const wrong = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_other" });
    expect((await send(payload, wrong)).status).toBe(400);
    expect((await repo.getViewer("u1")).purchases).toEqual([]);
  });

  it("正しい署名の単品購入 → PRE_RACE のみ付与。再送は duplicate (冪等)", async () => {
    const { payload, sig } = signed(preRaceCompleted("evt_1", "u1", R_TOKYO11));
    const r1 = await send(payload, sig);
    expect(r1.status).toBe(200);
    expect(r1.body.outcome).toEqual({ kind: "purchase_added", userId: "u1", raceId: R_TOKYO11 });
    const r2 = await send(payload, sig);
    expect(r2.status).toBe(200);
    expect(r2.body.outcome).toEqual({ kind: "duplicate" });
    const v = await repo.getViewer("u1");
    expect(v.purchases).toHaveLength(1);
    expect(v.subscription).toBeNull();
    expect(canView(v, R_TOKYO11, "FINAL", DEMO_NOW)).toBe(false);
    expect(canView(v, R_FIN1122, "FINAL", DEMO_NOW)).toBe(false);
  });

  it("subscription.created → PRO 有効", async () => {
    const { payload, sig } = signed(
      subEvent("evt_s", "created", { status: "active", periodEnd: "2026-12-15T00:00:00+09:00" }),
    );
    const r = await send(payload, sig);
    expect(r.body.outcome.kind).toBe("subscription_updated");
    expect(isProActive(await repo.getViewer("u1"), DEMO_NOW)).toBe(true);
  });
});

describe("Checkout (Stripe 設定時・API はスパイ)", () => {
  beforeEach(() => {
    createSession.mockClear();
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_monthly";
  });
  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_PRO_MONTHLY;
  });

  it("pre-race: mode=payment, 300円, metadata {userId, raceId, product}", async () => {
    setPersona("free");
    const r = await call(postPreCheckout(postJson("/api/checkout/pre-race", { raceId: R_PUB })));
    expect(r.status).toBe(200);
    expect(r.body.url).toContain("checkout.stripe.com");
    expect(createSession).toHaveBeenCalledTimes(1);
    const p = createSession.mock.calls[0][0] as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(p.mode).toBe("payment");
    expect(p.metadata).toEqual({ userId: "demo-free", raceId: R_PUB, product: "PRE_RACE_SINGLE" });
    expect(p.payment_intent_data.metadata).toEqual(p.metadata);
    expect(p.line_items[0].price_data).toMatchObject({ currency: "jpy", unit_amount: 300 });
  });

  it("pre-race: PRO は Stripe を一切呼ばない (409)", async () => {
    for (const persona of ["pro", "pro_canceling"]) {
      setPersona(persona);
      const r = await call(postPreCheckout(postJson("/api/checkout/pre-race", { raceId: R_PUB })));
      expect(r.status).toBe(409);
    }
    expect(createSession).not.toHaveBeenCalled();
  });

  it("pro: mode=subscription, price=env, subscription_data.metadata に userId", async () => {
    setPersona("pro_expired");
    const r = await call(postProCheckout(postJson("/api/checkout/pro", {})));
    expect(r.status).toBe(200);
    const p = createSession.mock.calls[0][0] as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(p.mode).toBe("subscription");
    expect(p.line_items).toEqual([{ price: "price_pro_monthly", quantity: 1 }]);
    expect(p.subscription_data.metadata).toEqual({ userId: "demo-pro-expired", product: "PRO_MONTHLY" });
  });

  it("Stripe API エラーは 502 (成功扱いにしない)", async () => {
    createSession.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    setPersona("free");
    const r = await call(postPreCheckout(postJson("/api/checkout/pre-race", { raceId: R_PUB })));
    expect(r.status).toBe(502);
    expect(r.body.error).toBe("PAYMENT_PROVIDER_ERROR");
  });
});
