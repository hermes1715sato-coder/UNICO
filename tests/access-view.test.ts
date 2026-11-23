/* 権限ポリシー + 予想ストア + ビュー (getRacePredictionView) の検証
   クライアント指定のチェック 1〜8 をビュー層で確認する (API 層は api.test.ts) */
import { beforeEach, describe, expect, it } from "vitest";
import { canPurchasePreRace, canView, isProActive, showAds, tierForRace, type Viewer } from "@/lib/access/policy";
import { getRace } from "@/lib/data";
import {
  __resetPredictionCache,
  getCurrentPublished,
  getPublishedHistory,
  getVersionStates,
} from "@/lib/predictions/store";
import type { PredictionVersionState } from "@/lib/predictions/types";
import { getRacePredictionView } from "@/lib/predictions/view";
import { DEMO_NOW, viewerOf } from "./support/harness";

/* スキャンで確認したレース (DEMO 時刻 11/28 12:30 時点)
   R_PUB      FINAL v1 PUBLISHED (未締切) / PRE v1 PUBLISHED        — 単品未購入
   R_DRAFT    FINAL v1 PUBLISHED + v2 DRAFT
   R_SCHED    FINAL v1,v2 SCHEDULED + v3 DRAFT
   R_TOKYO11  FINAL v1 SCHEDULED (14:40) / single・pro_expired が購入済み
   R_PREREV   PRE v1 REVISED → v2 PUBLISHED
   R_FIN1122  11/22 終了済み FINAL v1 CLOSED + v2 DRAFT / single が購入済み
   R_NEXTDAY  11/29: PRE/FINAL とも SCHEDULED */
const R_PUB = "20261128-05-06";
const R_DRAFT = "20261128-05-07";
const R_SCHED = "20261128-05-08";
const R_TOKYO11 = "20261128-05-11";
const R_KYOTO11 = "20261128-08-11";
const R_PREREV = "20261128-08-10";
const R_FIN1122 = "20261122-05-11";
const R_NEXTDAY = "20261129-05-01";
const TARGETS_TODAY = [
  R_PUB,
  R_DRAFT,
  R_SCHED,
  "20261128-05-09",
  "20261128-05-10",
  R_TOKYO11,
  "20261128-08-05",
  R_PREREV,
  R_KYOTO11,
];

const ALL_FIXTURE_RACES = [R_PUB, R_DRAFT, R_SCHED, R_TOKYO11, R_KYOTO11, R_PREREV, R_FIN1122, R_NEXTDAY];

async function race(id: string) {
  const r = await getRace(id);
  if (!r) throw new Error(`fixture race ${id} not found`);
  return r;
}

const view = (id: string, persona: string, now = DEMO_NOW) => getRacePredictionView(id, viewerOf(persona), now);

/** 判定時刻で非公開 (DRAFT/SCHEDULED) の版 */
async function hiddenVersions(id: string, now = DEMO_NOW) {
  const r = await race(id);
  return (["PRE_RACE", "FINAL"] as const).flatMap((t) =>
    getVersionStates(r, t, now).filter((v) => v.predictionStatus === "DRAFT" || v.predictionStatus === "SCHEDULED"),
  );
}

/** JSON に非公開版の中身 (lines / note / 公開予定時刻) が含まれないことを検査 */
async function assertNoHiddenLeak(id: string, json: string, opts: { allowScheduledAt: boolean; now?: string }) {
  const now = opts.now ?? DEMO_NOW;
  const r = await race(id);
  const visibleLines = new Set(
    (["PRE_RACE", "FINAL"] as const).flatMap((t) => getPublishedHistory(r, t, now).map((v) => JSON.stringify(v.lines))),
  );
  for (const h of await hiddenVersions(id, now)) {
    const lines = JSON.stringify(h.lines);
    if (!visibleLines.has(lines)) expect(json, `${h.id} lines leaked`).not.toContain(lines);
    if (h.note) expect(json, `${h.id} note leaked`).not.toContain(h.note);
    // PRE_RACE の公開予定日時は販売告知として全員に返す仕様。FINAL の予定時刻は PRO のみ
    if (h.publishAt && h.predictionType === "FINAL" && !opts.allowScheduledAt)
      expect(json, `${h.id} publishAt leaked`).not.toContain(h.publishAt);
  }
  const parsed = JSON.parse(json);
  const hiddenFinal = (await hiddenVersions(id, now)).filter((v) => v.predictionType === "FINAL").map((v) => v.version);
  const hiddenPre = (await hiddenVersions(id, now))
    .filter((v) => v.predictionType === "PRE_RACE")
    .map((v) => v.version);
  for (const h of parsed.final?.history ?? []) expect(hiddenFinal).not.toContain(h.version);
  for (const h of parsed.preRace?.history ?? []) expect(hiddenPre).not.toContain(h.version);
  if (parsed.final?.data) expect(hiddenFinal).not.toContain(parsed.final.data.version);
  if (parsed.preRace?.data) expect(hiddenPre).not.toContain(parsed.preRace.data.version);
}

beforeEach(() => __resetPredictionCache());

describe("fixtures (DEMO データの前提)", () => {
  it("想定どおりの公開状態になっている", async () => {
    const st = async (id: string, t: "PRE_RACE" | "FINAL") =>
      getVersionStates(await race(id), t, DEMO_NOW).map((v) => v.predictionStatus);
    expect(await st(R_PUB, "FINAL")).toEqual(["PUBLISHED"]);
    expect(await st(R_DRAFT, "FINAL")).toEqual(["PUBLISHED", "DRAFT"]);
    expect(await st(R_SCHED, "FINAL")).toEqual(["SCHEDULED", "SCHEDULED", "DRAFT"]);
    expect(await st(R_TOKYO11, "FINAL")).toEqual(["SCHEDULED"]);
    expect(getVersionStates(await race(R_TOKYO11), "FINAL", DEMO_NOW)[0].publishAt).toBe("2026-11-28T14:40:00+09:00");
    expect(await st(R_PREREV, "PRE_RACE")).toEqual(["REVISED", "PUBLISHED"]);
    expect(await st(R_FIN1122, "FINAL")).toEqual(["CLOSED", "DRAFT"]);
    expect(await st(R_NEXTDAY, "PRE_RACE")).toContain("SCHEDULED");
  });
});

describe("1) FREE / 未ログインは PRE_RACE・FINAL を取得できない", () => {
  for (const persona of ["guest", "free"]) {
    it(`${persona}: 全対象レースで data/history/diff/分析が null`, async () => {
      for (const id of [...TARGETS_TODAY, R_FIN1122]) {
        const v = (await view(id, persona))!;
        expect(v.preRace.data).toBeNull();
        expect(v.preRace.history).toBeNull();
        expect(v.final.data).toBeNull();
        expect(v.final.history).toBeNull();
        expect(v.final.diff).toBeNull();
        expect(v.final.scheduledAt).toBeNull();
        expect(v.proAnalysis.horses).toBeNull();
        expect(v.showAds).toBe(true);
        expect(["locked", "not_ready"]).toContain(v.preRace.state);
        expect(["locked", "preparing"]).toContain(v.final.state);
      }
    });
  }
  it("FREE は単品購入不可時に理由を返す (未ログイン → LOGIN_REQUIRED)", async () => {
    expect((await view(R_PUB, "guest"))!.preRace.purchase).toEqual({ ok: false, reason: "LOGIN_REQUIRED" });
    expect((await view(R_PUB, "free"))!.preRace.purchase).toEqual({ ok: true });
  });
});

describe("2) 単品購入者は購入レースの PRE_RACE を取得できる", () => {
  for (const id of [R_TOKYO11, R_KYOTO11, R_FIN1122]) {
    it(`single: ${id}`, async () => {
      const v = (await view(id, "single"))!;
      expect(v.tier).toBe("SINGLE_PURCHASE");
      expect(v.preRace.state).toBe("available");
      expect(v.preRace.unlockedBy).toBe("purchase");
      const cur = getCurrentPublished(await race(id), "PRE_RACE", DEMO_NOW)!;
      expect(v.preRace.data?.version).toBe(cur.version);
      expect(v.preRace.data?.lines).toEqual(cur.lines);
      expect(v.preRace.data?.totalStake).toBe(cur.totalStake);
      expect(v.preRace.data?.stakeAllocation.length).toBeGreaterThan(0);
      expect(v.preRace.purchase).toEqual({ ok: false, reason: "ALREADY_PURCHASED" });
      expect(v.showAds).toBe(true);
    });
  }
});

describe("3) 単品購入者は FINAL を取得できず、未購入レースの PRE_RACE も取得できない", () => {
  it("終了済み・FINAL 公開済みの 20261122-05-11 でも FINAL は locked", async () => {
    const v = (await view(R_FIN1122, "single"))!;
    expect(getCurrentPublished(await race(R_FIN1122), "FINAL", DEMO_NOW)).not.toBeNull();
    expect(v.final.state).toBe("locked");
    expect(v.final.data).toBeNull();
    expect(v.final.history).toBeNull();
    expect(v.final.diff).toBeNull();
    expect(v.preRace.history).toBeNull(); // 履歴は PRO のみ
    expect(v.proAnalysis.state).toBe("locked");
    expect(JSON.stringify(v)).not.toContain('"marks"');
  });
  it("購入済みレースでも FINAL 公開後に FINAL は見えない (時刻を進めても)", async () => {
    for (const now of [DEMO_NOW, "2026-11-28T15:00:00+09:00", "2026-11-28T18:00:00+09:00"]) {
      const v = (await view(R_TOKYO11, "single", now))!;
      expect(v.final.data).toBeNull();
      expect(canView(viewerOf("single"), R_TOKYO11, "FINAL", now)).toBe(false);
    }
  });
  it("未購入レースの PRE_RACE は locked", async () => {
    for (const id of [R_PUB, R_DRAFT, R_PREREV]) {
      const v = (await view(id, "single"))!;
      expect(v.tier).toBe("FREE");
      expect(v.preRace.state).toBe("locked");
      expect(v.preRace.data).toBeNull();
    }
  });
});

describe("4) PRO は全対象レースの PRE_RACE + FINAL を取得できる", () => {
  for (const persona of ["pro", "pro_canceling"]) {
    it(`${persona}: 今日の全対象レース`, async () => {
      for (const id of TARGETS_TODAY) {
        const r = await race(id);
        const v = (await view(id, persona))!;
        expect(v.tier).toBe("PRO");
        expect(v.showAds).toBe(false);
        expect(v.preRace.state).toBe("available");
        expect(v.preRace.unlockedBy).toBe("pro");
        expect(v.preRace.data).not.toBeNull();
        expect(v.preRace.purchase).toEqual({ ok: false, reason: "PRO_INCLUDED" }); // 300円を要求しない
        expect(v.proAnalysis.state).toBe("available");
        const fin = getCurrentPublished(r, "FINAL", DEMO_NOW);
        if (fin) {
          expect(v.final.state).toBe("available");
          expect(v.final.data?.version).toBe(fin.version);
          expect(v.final.data?.marks).toEqual(fin.marks ?? {});
          expect(v.final.diff).not.toBeNull();
        } else {
          expect(v.final.state).toBe("preparing");
          expect(v.final.data).toBeNull();
        }
        expect(v.preRace.history).not.toBeNull();
        expect(v.final.history).not.toBeNull();
      }
    });
  }
  it("PRO: 終了済みレース (CLOSED) の FINAL も閲覧できる", async () => {
    const v = (await view(R_FIN1122, "pro"))!;
    expect(v.final.state).toBe("available");
    expect(v.final.data?.predictionStatus).toBe("CLOSED");
  });
});

describe("5) 解約後は currentPeriodEnd まで利用可・以降は不可", () => {
  const canceling = viewerOf("pro_canceling"); // currentPeriodEnd 2026-12-01T00:00+09:00, cancelAtPeriodEnd
  const justBefore = "2026-11-30T23:59:59+09:00";
  const atEnd = "2026-12-01T00:00:00+09:00";
  const after = "2026-12-05T12:00:00+09:00";

  it("policy: 期限直前は PRO、期限ちょうど以降は失効", () => {
    expect(isProActive(canceling, justBefore)).toBe(true);
    expect(isProActive(canceling, atEnd)).toBe(false);
    expect(isProActive(canceling, after)).toBe(false);
    expect(showAds(canceling, justBefore)).toBe(false);
    expect(showAds(canceling, atEnd)).toBe(true);
    for (const res of ["PRE_RACE", "FINAL", "PRO_ANALYSIS", "PREDICTION_HISTORY"] as const) {
      expect(canView(canceling, R_PUB, res, justBefore)).toBe(true);
      expect(canView(canceling, R_PUB, res, atEnd)).toBe(false);
    }
  });
  it("view: 期限前は FINAL available、期限後は locked + データなし", async () => {
    const before = (await getRacePredictionView(R_PUB, canceling, justBefore))!;
    expect(before.final.state).toBe("available");
    expect(before.final.data).not.toBeNull();
    const end = (await getRacePredictionView(R_PUB, canceling, atEnd))!;
    expect(end.tier).toBe("FREE");
    expect(end.final.state).toBe("locked");
    expect(end.final.data).toBeNull();
    expect(end.preRace.data).toBeNull();
    expect(end.final.history).toBeNull();
    expect(end.proAnalysis.horses).toBeNull();
  });
  it("status が canceled / past_due / unpaid なら期間内でも PRO ではない", () => {
    for (const status of ["canceled", "past_due", "unpaid", "incomplete"] as const) {
      const v: Viewer = { ...canceling, subscription: { ...canceling.subscription!, status } };
      expect(isProActive(v, DEMO_NOW)).toBe(false);
    }
    const trial: Viewer = { ...canceling, subscription: { ...canceling.subscription!, status: "trialing" } };
    expect(isProActive(trial, DEMO_NOW)).toBe(true);
  });
});

describe("6) 単品購入した PRE_RACE は PRO 終了後も閲覧可能", () => {
  it("pro_expired: 購入済み 20261128-05-11 の PRE_RACE は available、FINAL は不可", async () => {
    const v = (await view(R_TOKYO11, "pro_expired"))!;
    expect(v.tier).toBe("SINGLE_PURCHASE");
    expect(v.preRace.state).toBe("available");
    expect(v.preRace.unlockedBy).toBe("purchase");
    expect(v.final.data).toBeNull();
    expect(v.final.scheduledAt).toBeNull();
    expect(v.proAnalysis.state).toBe("locked");
    expect(v.showAds).toBe(true);
    // FINAL 公開後 (14:40 以降) でも不可
    const later = (await view(R_TOKYO11, "pro_expired", "2026-11-28T15:00:00+09:00"))!;
    expect(later.final.state).toBe("locked");
    expect(later.final.data).toBeNull();
    expect(later.preRace.state).toBe("available");
  });
  it("pro_expired: 未購入レースは PRE_RACE も locked", async () => {
    const v = (await view(R_PUB, "pro_expired"))!;
    expect(v.preRace.state).toBe("locked");
    expect(v.preRace.purchase).toEqual({ ok: true }); // 期間終了後は300円で購入可能
  });
});

describe("7) FINAL を公開しても PRE_RACE は上書きされない", () => {
  const strip = (l: PredictionVersionState[]) =>
    l.map(({ predictionStatus: _s, ...rest }) => {
      void _s;
      return rest;
    });

  for (const id of [R_TOKYO11, R_SCHED, R_PREREV]) {
    it(`${id}: FINAL 公開前後で PRE_RACE の全版が同一`, async () => {
      const r = await race(id);
      const fin = getVersionStates(r, "FINAL", DEMO_NOW).find((v) => v.publishAt)!;
      const beforeT = new Date(Date.parse(fin.publishAt!) - 60_000).toISOString();
      const afterT = new Date(Date.parse(fin.publishAt!) + 60_000).toISOString();
      expect(getCurrentPublished(r, "FINAL", beforeT)).toBeNull();
      expect(getCurrentPublished(r, "FINAL", afterT)).not.toBeNull();

      const preBefore = getVersionStates(r, "PRE_RACE", beforeT);
      const preAfter = getVersionStates(r, "PRE_RACE", afterT);
      expect(strip(preAfter)).toEqual(strip(preBefore));
      expect(preAfter.map((v) => v.predictionStatus)).toEqual(preBefore.map((v) => v.predictionStatus));
      expect(getPublishedHistory(r, "PRE_RACE", afterT)).toEqual(getPublishedHistory(r, "PRE_RACE", beforeT));
      for (const v of preAfter) {
        expect(v.predictionType).toBe("PRE_RACE");
        expect(v.marks).toBeUndefined();
      }

      // ビュー上の PRE_RACE ペイロードも同一 (PRO 視点)
      const vb = (await view(id, "pro", beforeT))!;
      const va = (await view(id, "pro", afterT))!;
      expect(va.preRace.data).toEqual(vb.preRace.data);
      expect(va.preRace.history).toEqual(vb.preRace.history);
    });
  }

  it("PRE_RACE 更新版でも旧版は REVISED として残る", async () => {
    const r = await race(R_PREREV);
    const h = getPublishedHistory(r, "PRE_RACE", DEMO_NOW);
    expect(h.map((v) => [v.version, v.predictionStatus])).toEqual([
      [1, "REVISED"],
      [2, "PUBLISHED"],
    ]);
    // 単品購入者向け data は最新版のみ (履歴は PRO 限定)
    const pro = (await view(R_PREREV, "pro"))!;
    expect(pro.preRace.data?.version).toBe(2);
    expect(pro.preRace.history?.map((x) => x.version)).toEqual([1, 2]);
  });

  // KNOWN BUG (lead 担当 view.ts / store.ts): toPayload がキャッシュ内の lines 配列をそのまま返すため、
  // 回帰テスト: 呼び出し側の書き換えが保存済みレコード (全ユーザー共有キャッシュ) に波及しないこと。
  it("ビューの返却値を呼び出し側が書き換えても、保存済み PRE_RACE は変化しない (不変性)", async () => {
    const r = await race(R_TOKYO11);
    const snapshot = JSON.stringify(getVersionStates(r, "PRE_RACE", DEMO_NOW));
    const v = (await view(R_TOKYO11, "single"))!;
    v.preRace.data!.lines[0].combinations.push([99, 99]);
    v.preRace.data!.lines[0].stake = 999999;
    expect(JSON.stringify(getVersionStates(r, "PRE_RACE", DEMO_NOW))).toBe(snapshot);
  });
});

describe("8) 未公開 (DRAFT / SCHEDULED) の FINAL は漏れない", () => {
  const personas = ["guest", "free", "single", "pro", "pro_canceling", "pro_expired"];
  for (const persona of personas) {
    it(`${persona}: 全フィクスチャで DRAFT/SCHEDULED の中身が JSON に含まれない`, async () => {
      for (const id of ALL_FIXTURE_RACES) {
        const v = await view(id, persona);
        const json = JSON.stringify(v);
        const pro = isProActive(viewerOf(persona), DEMO_NOW);
        await assertNoHiddenLeak(id, json, { allowScheduledAt: pro });
        expect(json).not.toContain("下書き");
      }
    });
  }
  it("20261128-05-11 12:30: FINAL は 14:40 公開予定 → 誰にもデータなし。非 PRO には公開予定時刻も返さない", async () => {
    for (const persona of personas) {
      const v = (await view(R_TOKYO11, persona))!;
      expect(v.final.data).toBeNull();
      expect(v.final.history ?? []).toEqual([]);
      expect(v.final.diff).toBeNull();
      if (!isProActive(viewerOf(persona), DEMO_NOW)) {
        expect(v.final.scheduledAt).toBeNull();
        expect(JSON.stringify(v)).not.toContain("2026-11-28T14:40");
      } else {
        expect(v.final.scheduledAt).toBe("2026-11-28T14:40:00+09:00");
        expect(v.final.state).toBe("preparing");
      }
    }
  });
  it("PRO: R_DRAFT の FINAL は v1 のみ (v2 DRAFT は history にも data にもない)", async () => {
    const v = (await view(R_DRAFT, "pro"))!;
    expect(v.final.data?.version).toBe(1);
    expect(v.final.history?.map((h) => h.version)).toEqual([1]);
  });
  it("PRO: 公開時刻の 1 秒前は data なし、公開時刻ちょうどで data あり", async () => {
    const r = await race(R_TOKYO11);
    const at = getVersionStates(r, "FINAL", DEMO_NOW)[0].publishAt!;
    const b = (await view(R_TOKYO11, "pro", new Date(Date.parse(at) - 1000).toISOString()))!;
    const a = (await view(R_TOKYO11, "pro", at))!;
    expect(b.final.data).toBeNull();
    expect(a.final.data?.version).toBe(1);
  });
});

describe("ペイロード形状", () => {
  it("PRE_RACE ペイロードに marks を含めない (PRO でも)", async () => {
    for (const id of [...TARGETS_TODAY, R_FIN1122]) {
      for (const persona of ["single", "pro"]) {
        const v = (await view(id, persona))!;
        if (v.preRace.data) expect(Object.keys(v.preRace.data)).not.toContain("marks");
        expect(JSON.stringify(v.preRace)).not.toContain('"marks"');
      }
    }
  });
  it("FINAL ペイロードには marks を含む (PRO)", async () => {
    const v = (await view(R_PUB, "pro"))!;
    expect(v.final.data?.marks).toBeDefined();
    expect(Object.values(v.final.data!.marks)).toContain("◎");
  });
  it("未知のレース → null / 対象外レース → not_target", async () => {
    expect(await view("20261128-05-13", "pro")).toBeNull();
    expect(await view("garbage", "pro")).toBeNull();
    const nt = (await view("20261128-05-02", "pro"))!;
    expect(nt.preRace.state).toBe("not_target");
    expect(nt.final.state).toBe("not_target");
    expect(nt.preRace.data).toBeNull();
  });
  it("翌日レース: PRE_RACE は未公開 (not_ready) → 誰も購入不可・閲覧不可", async () => {
    for (const persona of ["free", "single", "pro"]) {
      const v = (await view(R_NEXTDAY, persona))!;
      expect(v.preRace.state).toBe("not_ready");
      expect(v.preRace.data).toBeNull();
    }
    expect((await view(R_NEXTDAY, "free"))!.preRace.purchase).toEqual({ ok: false, reason: "NOT_PUBLISHED" });
  });
});

describe("policy 単体", () => {
  it("tierForRace", () => {
    expect(tierForRace(viewerOf("guest"), R_TOKYO11, DEMO_NOW)).toBe("GUEST");
    expect(tierForRace(viewerOf("free"), R_TOKYO11, DEMO_NOW)).toBe("FREE");
    expect(tierForRace(viewerOf("single"), R_TOKYO11, DEMO_NOW)).toBe("SINGLE_PURCHASE");
    expect(tierForRace(viewerOf("single"), R_PUB, DEMO_NOW)).toBe("FREE");
    expect(tierForRace(viewerOf("pro"), R_PUB, DEMO_NOW)).toBe("PRO");
  });
  it("canPurchasePreRace: PRO には決して課金しない (締切・未公開より優先)", () => {
    const pro = viewerOf("pro");
    for (const opts of [
      { preRacePublished: true, raceClosed: false },
      { preRacePublished: false, raceClosed: false },
      { preRacePublished: true, raceClosed: true },
    ]) {
      expect(canPurchasePreRace(pro, R_PUB, DEMO_NOW, opts)).toEqual({ ok: false, reason: "PRO_INCLUDED" });
    }
    expect(canPurchasePreRace(viewerOf("free"), R_PUB, DEMO_NOW, { preRacePublished: true, raceClosed: true })).toEqual(
      {
        ok: false,
        reason: "RACE_CLOSED",
      },
    );
  });
  it("単品購入は他の resource に波及しない", () => {
    const s = viewerOf("single");
    expect(canView(s, R_TOKYO11, "PRE_RACE", DEMO_NOW)).toBe(true);
    for (const res of ["FINAL", "PRO_ANALYSIS", "PREDICTION_HISTORY"] as const) {
      expect(canView(s, R_TOKYO11, res, DEMO_NOW)).toBe(false);
    }
  });
});
