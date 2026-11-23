/* Route Handler をプロセス内で直接呼び出して検証する。
   next/headers の cookies() だけをモックし、session.ts の getViewer() は実物を使う。
   getNow() は時刻を変える検証のために差し替え可能にする (既定は DEMO 時刻)。 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", async () => (await import("./support/harness")).nextHeadersMock());
vi.mock("@/lib/access/session", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/access/session")>();
  const h = await import("./support/harness");
  return { ...orig, getNow: () => h.ctl.now ?? orig.getNow() };
});

import { GET as getView } from "@/app/api/races/[id]/predictions/route";
import { GET as getPre } from "@/app/api/races/[id]/predictions/pre-race/route";
import { GET as getFinal } from "@/app/api/races/[id]/predictions/final/route";
import { POST as postPreCheckout } from "@/app/api/checkout/pre-race/route";
import { POST as postProCheckout } from "@/app/api/checkout/pro/route";
import { getRace } from "@/lib/data";
import { __resetPredictionCache, getCurrentPublished, getVersionStates } from "@/lib/predictions/store";
import { call, ctx, DEMO_NOW, postJson, setNow, setPersona } from "./support/harness";

const R_PUB = "20261128-05-06";
const R_DRAFT = "20261128-05-07";
const R_SCHED = "20261128-05-08";
const R_TOKYO11 = "20261128-05-11";
const R_FIN1122 = "20261122-05-11";
const R_NEXTDAY = "20261129-05-01";
const R_NONTARGET = "20261128-05-02";
const R_UNKNOWN = "20261128-05-13";
const R_CLOSED_TODAY = "20261128-05-05"; // 12:25 発走 → 12:30 時点で締切

const PERSONAS = ["guest", "free", "single", "pro", "pro_canceling", "pro_expired"] as const;

const pre = (id: string) => call(getPre(new Request(`http://x/api/races/${id}/predictions/pre-race`), ctx(id)));
const fin = (id: string) => call(getFinal(new Request(`http://x/api/races/${id}/predictions/final`), ctx(id)));
const all = (id: string) => call(getView(new Request(`http://x/api/races/${id}/predictions`), ctx(id)));

const savedEnv = { ...process.env };
beforeEach(() => {
  __resetPredictionCache();
  setPersona(undefined);
  setNow(undefined);
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_PRO_MONTHLY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
});
afterEach(() => {
  process.env = { ...savedEnv };
});

describe("共通ヘッダ", () => {
  it("全レスポンスが Cache-Control: private, no-store", async () => {
    setPersona("pro");
    for (const r of [await all(R_PUB), await pre(R_PUB), await fin(R_PUB), await fin(R_UNKNOWN)]) {
      expect(r.headers.get("cache-control")).toBe("private, no-store");
    }
    setPersona("guest");
    expect((await pre(R_PUB)).headers.get("cache-control")).toBe("private, no-store");
    expect((await call(postProCheckout(postJson("/api/checkout/pro", {})))).headers.get("cache-control")).toBe(
      "private, no-store",
    );
  });
});

describe("GET /api/races/[id]/predictions", () => {
  it("未知のレースは 404", async () => {
    setPersona("pro");
    expect((await all(R_UNKNOWN)).status).toBe(404);
    expect((await all("../../etc")).status).toBe(404);
  });
  it("Cookie なし = guest として 200 (データは null)", async () => {
    const r = await all(R_PUB);
    expect(r.status).toBe(200);
    expect(r.body.tier).toBe("GUEST");
    expect(r.body.preRace.data).toBeNull();
    expect(r.body.final.data).toBeNull();
  });
  it("不正なペルソナ Cookie は guest 扱い", async () => {
    setPersona("admin");
    const r = await all(R_PUB);
    expect(r.body.tier).toBe("GUEST");
    expect(r.body.final.data).toBeNull();
  });
  it("PRO は PRE_RACE + FINAL を受け取り、FREE は受け取らない", async () => {
    setPersona("pro");
    const p = await all(R_PUB);
    expect(p.body.preRace.data).not.toBeNull();
    expect(p.body.final.data.marks).toBeDefined();
    setPersona("free");
    const f = await all(R_PUB);
    expect(f.body.preRace.data).toBeNull();
    expect(f.body.final.data).toBeNull();
    expect(f.text).not.toContain('"marks"');
    expect(f.text).not.toContain('"breakdown"');
  });
});

describe("1) FREE / guest は PRE_RACE・FINAL API で 401/403", () => {
  it("guest → 401", async () => {
    for (const id of [R_PUB, R_TOKYO11, R_FIN1122]) {
      expect((await pre(id)).status).toBe(401);
      expect((await fin(id)).status).toBe(401);
    }
  });
  it("free → 403", async () => {
    setPersona("free");
    for (const id of [R_PUB, R_TOKYO11, R_FIN1122]) {
      const p = await pre(id);
      expect(p.status).toBe(403);
      expect(p.body).toEqual({ error: "PURCHASE_OR_PRO_REQUIRED" });
      const f = await fin(id);
      expect(f.status).toBe(403);
      expect(f.body).toEqual({ error: "PRO_REQUIRED" });
    }
  });
});

describe("2) 単品購入者は購入レースの PRE_RACE を取得", () => {
  it("single: 20261128-05-11 → 200 / 現在の公開版のみ / marks なし", async () => {
    setPersona("single");
    const r = await pre(R_TOKYO11);
    expect(r.status).toBe(200);
    expect(r.body.predictionType).toBe("PRE_RACE");
    expect(r.body.unlockedBy).toBe("purchase");
    const cur = getCurrentPublished((await getRace(R_TOKYO11))!, "PRE_RACE", DEMO_NOW)!;
    expect(r.body.prediction.version).toBe(cur.version);
    expect(r.body.prediction.lines).toEqual(cur.lines);
    expect(r.body.prediction.totalStake).toBe(cur.totalStake);
    expect(r.text).not.toContain("marks");
    expect(r.body.history).toBeUndefined();
  });
  it("single: 終了済み 20261122-05-11 の PRE_RACE (CLOSED) も 200", async () => {
    setPersona("single");
    const r = await pre(R_FIN1122);
    expect(r.status).toBe(200);
    expect(r.body.prediction.predictionStatus).toBe("CLOSED");
  });
});

describe("3) 単品購入者は FINAL 不可・未購入レースの PRE_RACE 不可", () => {
  it("FINAL 公開済み (終了) の 20261122-05-11 でも 403", async () => {
    setPersona("single");
    const r = await fin(R_FIN1122);
    expect(r.status).toBe(403);
    expect(r.text).not.toContain("combinations");
  });
  it("FINAL 公開後の時刻でも購入レースの FINAL は 403", async () => {
    setPersona("single");
    setNow("2026-11-28T15:00:00+09:00");
    expect((await fin(R_TOKYO11)).status).toBe(403);
    expect((await pre(R_TOKYO11)).status).toBe(200);
  });
  it("未購入レースの PRE_RACE は 403", async () => {
    setPersona("single");
    expect((await pre(R_PUB)).status).toBe(403);
    expect((await pre(R_DRAFT)).status).toBe(403);
  });
});

describe("4) PRO は全対象レースの PRE_RACE + FINAL", () => {
  for (const persona of ["pro", "pro_canceling"] as const) {
    it(`${persona}: 公開済みは 200、FINAL 未公開は 404`, async () => {
      setPersona(persona);
      for (const id of [R_PUB, R_DRAFT, R_SCHED, R_TOKYO11, R_FIN1122]) {
        const race = (await getRace(id))!;
        const p = await pre(id);
        expect(p.status).toBe(200);
        expect(p.body.unlockedBy).toBe("pro");
        expect(p.text).not.toContain("marks");
        const f = await fin(id);
        const cur = getCurrentPublished(race, "FINAL", DEMO_NOW);
        if (cur) {
          expect(f.status).toBe(200);
          expect(f.body.prediction.version).toBe(cur.version);
          expect(f.body.prediction.marks).toEqual(cur.marks ?? {});
        } else {
          expect(f.status).toBe(404);
          expect(f.body).toEqual({ error: "NOT_PUBLISHED" });
        }
      }
    });
  }
  it("対象外レースは 404 NOT_TARGET、未知レースは 404 RACE_NOT_FOUND", async () => {
    setPersona("pro");
    expect((await pre(R_NONTARGET)).body).toEqual({ error: "NOT_TARGET" });
    expect((await fin(R_NONTARGET)).body).toEqual({ error: "NOT_TARGET" });
    expect((await fin(R_UNKNOWN)).body).toEqual({ error: "RACE_NOT_FOUND" });
  });
  it("翌日レース (PRE_RACE 未公開) は PRO でも 404", async () => {
    setPersona("pro");
    expect((await pre(R_NEXTDAY)).status).toBe(404);
    expect((await fin(R_NEXTDAY)).status).toBe(404);
  });
});

describe("5) 解約後は期間終了まで利用可", () => {
  it("pro_canceling: 11/30 23:59:59 は 200、12/1 00:00 以降は 403", async () => {
    setPersona("pro_canceling");
    setNow("2026-11-30T23:59:59+09:00");
    expect((await fin(R_PUB)).status).toBe(200);
    expect((await pre(R_PUB)).status).toBe(200);
    setNow("2026-12-01T00:00:00+09:00");
    expect((await fin(R_PUB)).status).toBe(403);
    expect((await pre(R_PUB)).status).toBe(403);
    const v = await all(R_PUB);
    expect(v.body.tier).toBe("FREE");
    expect(v.body.showAds).toBe(true);
  });
  it("pro_expired は FINAL 403", async () => {
    setPersona("pro_expired");
    expect((await fin(R_PUB)).status).toBe(403);
    expect((await fin(R_FIN1122)).status).toBe(403);
  });
});

describe("6) PRO 終了後も単品購入の PRE_RACE は閲覧可", () => {
  it("pro_expired: 20261128-05-11 PRE_RACE 200 / FINAL 403 / 未購入レース 403", async () => {
    setPersona("pro_expired");
    const p = await pre(R_TOKYO11);
    expect(p.status).toBe(200);
    expect(p.body.unlockedBy).toBe("purchase");
    expect((await fin(R_TOKYO11)).status).toBe(403);
    expect((await pre(R_PUB)).status).toBe(403);
  });
});

describe("7) FINAL 公開前後で PRE_RACE API の応答が同一", () => {
  it("PRO / single で 14:39 と 14:41 の PRE_RACE 応答が一致", async () => {
    for (const persona of ["pro", "single"]) {
      setPersona(persona);
      setNow("2026-11-28T14:39:00+09:00");
      const before = await pre(R_TOKYO11);
      setNow("2026-11-28T14:41:00+09:00");
      const after = await pre(R_TOKYO11);
      expect(after.status).toBe(200);
      expect(after.body).toEqual(before.body);
      if (persona === "pro") expect((await fin(R_TOKYO11)).status).toBe(200);
    }
  });
});

describe("8) 未公開 FINAL は API から漏れない", () => {
  it("20261128-05-11 12:30 (FINAL 14:40 予定): 全ペルソナで FINAL の中身なし。非 PRO は 401/403 (404 ではない)", async () => {
    const race = (await getRace(R_TOKYO11))!;
    const hidden = getVersionStates(race, "FINAL", DEMO_NOW);
    expect(hidden.map((v) => v.predictionStatus)).toEqual(["SCHEDULED"]);
    const expected: Record<string, number> = {
      guest: 401,
      free: 403,
      single: 403,
      pro_expired: 403,
      pro: 404,
      pro_canceling: 404,
    };
    for (const persona of PERSONAS) {
      setPersona(persona);
      const f = await fin(R_TOKYO11);
      expect(f.status, persona).toBe(expected[persona]);
      const v = await all(R_TOKYO11);
      for (const text of [f.text, v.text]) {
        expect(text).not.toContain(JSON.stringify(hidden[0].lines));
        expect(text).not.toContain('"marks"');
      }
      if (!["pro", "pro_canceling"].includes(persona)) expect(v.text).not.toContain("2026-11-28T14:40");
    }
  });
  it("権限判定が公開状態より先: 非 PRO は FINAL 公開済み / 未公開 / DRAFT のみ に関わらず同じ 403", async () => {
    setPersona("single");
    const codes = await Promise.all([R_PUB, R_DRAFT, R_SCHED, R_TOKYO11, R_FIN1122, R_NEXTDAY].map((id) => fin(id)));
    expect(new Set(codes.map((c) => c.status))).toEqual(new Set([403]));
    expect(new Set(codes.map((c) => c.text)).size).toBe(1);
  });
  it("DRAFT / SCHEDULED を含むレースで PRO にも非公開版を返さない", async () => {
    setPersona("pro");
    for (const id of [R_DRAFT, R_SCHED, R_FIN1122]) {
      const race = (await getRace(id))!;
      const hidden = getVersionStates(race, "FINAL", DEMO_NOW).filter((v) =>
        ["DRAFT", "SCHEDULED"].includes(v.predictionStatus),
      );
      expect(hidden.length).toBeGreaterThan(0);
      const f = await fin(id);
      const v = await all(id);
      for (const h of hidden) {
        if (f.status === 200) expect(f.body.prediction.version).not.toBe(h.version);
        expect((v.body.final.history ?? []).map((x: { version: number }) => x.version)).not.toContain(h.version);
        // 公開済み版 (PRE_RACE 含む) と買い目が偶然同一の場合は文字列検査できないため除外
        const visible = [v.body.final.data, v.body.preRace.data].filter(Boolean).map((d) => JSON.stringify(d.lines));
        if (!visible.includes(JSON.stringify(h.lines))) {
          expect(f.text).not.toContain(JSON.stringify(h.lines));
          expect(v.text).not.toContain(JSON.stringify(h.lines));
        }
        if (h.note) expect(v.text).not.toContain(h.note);
      }
    }
  });
});

describe("POST /api/checkout/pre-race", () => {
  const post = (body: unknown) => call(postPreCheckout(postJson("/api/checkout/pre-race", body)));

  it("PRO は 409 PRO_INCLUDED (課金しない) — Stripe 設定の有無に関わらず", async () => {
    setPersona("pro");
    expect(await post({ raceId: R_PUB })).toMatchObject({ status: 409, body: { error: "PRO_INCLUDED" } });
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    expect(await post({ raceId: R_PUB })).toMatchObject({ status: 409, body: { error: "PRO_INCLUDED" } });
    setPersona("pro_canceling");
    expect((await post({ raceId: R_PUB })).body.error).toBe("PRO_INCLUDED");
  });
  it("未ログイン 401 / 購入済み 409 / 未公開 409 / 締切後 409 / 不正 body 400 / 未知 404 / 対象外 404", async () => {
    expect((await post({ raceId: R_PUB })).status).toBe(401);
    setPersona("single");
    expect(await post({ raceId: R_TOKYO11 })).toMatchObject({ status: 409, body: { error: "ALREADY_PURCHASED" } });
    setPersona("free");
    expect(await post({ raceId: R_NEXTDAY })).toMatchObject({ status: 409, body: { error: "NOT_PUBLISHED" } });
    expect(await post({ raceId: R_CLOSED_TODAY })).toMatchObject({ status: 409, body: { error: "RACE_CLOSED" } });
    expect(await post({ raceId: R_FIN1122 })).toMatchObject({ status: 409, body: { error: "RACE_CLOSED" } });
    expect((await post({})).status).toBe(400);
    expect((await post([1, 2])).status).toBe(400);
    expect((await post({ raceId: 123 })).status).toBe(400);
    expect((await post({ raceId: R_UNKNOWN })).status).toBe(404);
    expect((await post({ raceId: R_NONTARGET })).status).toBe(404);
  });
  it("購入可能でも STRIPE_SECRET_KEY 未設定なら 503 PAYMENT_NOT_CONFIGURED (成功を偽装しない)", async () => {
    for (const persona of ["free", "single", "pro_expired"]) {
      setPersona(persona);
      const r = await post({ raceId: R_PUB });
      expect(r.status).toBe(503);
      expect(r.body.error).toBe("PAYMENT_NOT_CONFIGURED");
      expect(r.body.url).toBeUndefined();
    }
  });
  it("不正な JSON は 400", async () => {
    setPersona("free");
    const req = new Request("http://localhost/api/checkout/pre-race", { method: "POST", body: "{not json" });
    expect((await call(postPreCheckout(req))).status).toBe(400);
  });
});

describe("POST /api/checkout/pro", () => {
  const post = () => call(postProCheckout(postJson("/api/checkout/pro", {})));
  it("未ログイン 401 / PRO 有効 409 / 解約予約中も期間内は 409", async () => {
    expect((await post()).status).toBe(401);
    setPersona("pro");
    expect(await post()).toMatchObject({ status: 409, body: { error: "PRO_ALREADY_ACTIVE" } });
    setPersona("pro_canceling");
    expect((await post()).status).toBe(409);
  });
  it("Stripe 未設定は 503 (キーだけ設定・価格未設定でも 503)", async () => {
    for (const persona of ["free", "single", "pro_expired"]) {
      setPersona(persona);
      expect(await post()).toMatchObject({ status: 503, body: { error: "PAYMENT_NOT_CONFIGURED" } });
    }
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    setPersona("free");
    expect((await post()).status).toBe(503);
  });
  it("期間終了後の pro_canceling は再加入可能 (503 = 決済未設定まで到達)", async () => {
    setPersona("pro_canceling");
    setNow("2026-12-01T00:00:00+09:00");
    expect((await post()).body.error).toBe("PAYMENT_NOT_CONFIGURED");
  });
});
