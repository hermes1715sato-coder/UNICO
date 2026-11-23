/* PRO 当日リアルタイム情報 (PRO Lounge / レース別 PRO 分析) の権限と時刻依存の検証
   - getProLounge / getProRaceAnalysis は PRO 有効期間中のみデータを返す
   - 馬体重 (発走70分前)・パドック (30分前) は時刻に従って出現する
   - /pro の HTML に PRO 以外のペルソナで実データが含まれない (dev サーバー起動時のみ) */
import { describe, expect, it } from "vitest";
import { getProLounge, getProRaceAnalysis } from "@/lib/pro/live";
import type { ProRaceAnalysis } from "@/lib/pro/types";
import { DEMO_NOW, viewerOf } from "./support/harness";

const LOCKED = ["guest", "free", "single", "pro_expired"] as const;
const OPEN = ["pro", "pro_canceling"] as const;
const R_TOKYO11 = "20261128-05-11"; // 15:40 発走 → 馬体重 14:30 / パドック 15:10
const R_TOKYO6 = "20261128-05-06"; // 12:55 発走 → 馬体重 11:45 / パドック 12:25
/** pro_canceling の契約期間終了 (12/1 0:00) より後 */
const AFTER_CANCEL_END = "2026-12-01T10:00:00+09:00";

async function analysis(raceId: string, now: string): Promise<ProRaceAnalysis> {
  const r = await getProRaceAnalysis(raceId, viewerOf("pro"), now);
  if (!r || r.locked || !r.data) throw new Error(`analysis unavailable: ${raceId}`);
  return r.data;
}

describe("getProLounge: 権限", () => {
  it.each(LOCKED)("%s には locked のみ返す (データなし)", async (id) => {
    const r = await getProLounge(viewerOf(id), DEMO_NOW);
    expect(r).toEqual({ locked: true });
  });

  it("pro_canceling は契約期間終了後に locked", async () => {
    expect(await getProLounge(viewerOf("pro_canceling"), AFTER_CANCEL_END)).toEqual({ locked: true });
  });

  it.each(OPEN)("%s (期間内) にはデータを返す", async (id) => {
    const r = await getProLounge(viewerOf(id), DEMO_NOW);
    expect(r.locked).toBe(false);
    if (r.locked) return;
    expect(r.data.date).toBe("2026-11-28");
    expect(r.data.tracks.length).toBeGreaterThan(0);
    expect(r.data.races.length).toBeGreaterThan(0);
    for (const t of r.data.tracks) {
      expect(t.turf.cushion).toBeGreaterThan(0);
      expect(t.bias.comment).toBeTruthy();
    }
    for (const race of r.data.races) {
      expect(race.topLive.length).toBeGreaterThan(0);
      expect(race.topLive.length).toBeLessThanOrEqual(3);
    }
  });

  it("タイムラインは新しい順で、未来の更新を含まない", async () => {
    const r = await getProLounge(viewerOf("pro"), DEMO_NOW);
    if (r.locked) throw new Error("locked");
    const ts = r.data.updates.map((u) => Date.parse(u.at));
    expect(ts.length).toBeGreaterThan(0);
    expect([...ts].sort((a, b) => b - a)).toEqual(ts);
    expect(ts.every((t) => t <= Date.parse(DEMO_NOW))).toBe(true);
  });

  it("レースの状態は時刻に従う (12:30 時点)", async () => {
    const r = await getProLounge(viewerOf("pro"), DEMO_NOW);
    if (r.locked) throw new Error("locked");
    const by = new Map(r.data.races.map((x) => [x.raceId, x]));
    expect(by.get("20261128-05-01")?.status).toBe("closed");
    expect(by.get(R_TOKYO6)?.status).toBe("paddock");
    expect(by.get(R_TOKYO11)?.status).toBe("upcoming");
    // 発走時刻順
    const times = r.data.races.map((x) => x.postTime);
    expect([...times].sort()).toEqual(times);
  });
});

describe("getProRaceAnalysis: 権限", () => {
  it.each(LOCKED)("%s には locked のみ返す", async (id) => {
    expect(await getProRaceAnalysis(R_TOKYO11, viewerOf(id), DEMO_NOW)).toEqual({ locked: true });
  });

  it("pro_canceling は契約期間終了後に locked", async () => {
    expect(await getProRaceAnalysis(R_TOKYO11, viewerOf("pro_canceling"), AFTER_CANCEL_END)).toEqual({ locked: true });
  });

  it.each(OPEN)("%s (期間内) には分析を返す", async (id) => {
    const r = await getProRaceAnalysis(R_TOKYO11, viewerOf(id), DEMO_NOW);
    expect(r && !r.locked && r.data && r.data.raceId).toBe(R_TOKYO11);
  });

  it("存在しないレースは null", async () => {
    expect(await getProRaceAnalysis("20261128-05-99", viewerOf("pro"), DEMO_NOW)).toBeNull();
  });
});

describe("getProRaceAnalysis: 時刻による馬体重・パドック", () => {
  it(`${R_TOKYO11} 12:30 は馬体重・パドックとも未発表`, async () => {
    const a = await analysis(R_TOKYO11, DEMO_NOW);
    expect(a.phase.weightsAnnounced).toBe(false);
    expect(a.phase.paddockDone).toBe(false);
    expect(a.horses.every((h) => h.bodyWeight === null && h.paddock === null)).toBe(true);
    // 当日補正前は指数変動なし
    expect(a.horses.every((h) => h.index.delta === 0)).toBe(true);
  });

  it(`${R_TOKYO11} 14:40 は馬体重のみ発表済み`, async () => {
    const a = await analysis(R_TOKYO11, "2026-11-28T14:40:00+09:00");
    expect(a.phase.weightsAnnounced).toBe(true);
    expect(a.phase.paddockDone).toBe(false);
    const runners = a.horses.filter((h) => !h.scratched);
    expect(runners.every((h) => h.bodyWeight !== null && h.paddock === null)).toBe(true);
  });

  it(`${R_TOKYO11} 15:10 は馬体重・パドックとも反映`, async () => {
    const a = await analysis(R_TOKYO11, "2026-11-28T15:10:00+09:00");
    expect(a.phase.weightsAnnounced).toBe(true);
    expect(a.phase.paddockDone).toBe(true);
    const runners = a.horses.filter((h) => !h.scratched);
    expect(runners.length).toBeGreaterThan(0);
    expect(runners.every((h) => h.bodyWeight !== null && h.paddock !== null)).toBe(true);
    expect(a.horses.filter((h) => h.scratched).every((h) => h.bodyWeight === null && h.paddock === null)).toBe(true);
  });

  it(`${R_TOKYO6} 12:30 は馬体重・パドックとも反映済み`, async () => {
    const a = await analysis(R_TOKYO6, DEMO_NOW);
    expect(a.phase.weightsAnnounced && a.phase.paddockDone).toBe(true);
    expect(a.horses.filter((h) => !h.scratched).every((h) => h.bodyWeight && h.paddock)).toBe(true);
    expect(a.updates.some((u) => u.kind === "weight")).toBe(true);
    expect(a.updates.some((u) => u.kind === "paddock")).toBe(true);
  });

  it("同じ時刻なら決定的 (再計算しても同値)", async () => {
    const a = await analysis(R_TOKYO6, DEMO_NOW);
    const b = await analysis(R_TOKYO6, DEMO_NOW);
    expect(b).toEqual(a);
  });
});

/* ---------------------------------------------------------------- HTML (dev サーバー起動時のみ) */
const BASE = process.env.UNICO_BASE_URL ?? "http://localhost:3000";

async function serverUp() {
  try {
    const r = await fetch(`${BASE}/pro`, { signal: AbortSignal.timeout(20000) });
    return r.ok;
  } catch {
    return false;
  }
}
const up = await serverUp();

async function html(persona: string) {
  const r = await fetch(`${BASE}/pro`, { headers: { Cookie: `unico_demo_persona=${persona}` }, signal: AbortSignal.timeout(60000) });
  expect(r.status).toBe(200);
  return r.text();
}

describe.skipIf(!up)("/pro の HTML (要 dev サーバー)", () => {
  it("PRO には実データ、PRO 以外には一切含まれない", { timeout: 180000 }, async () => {
    const lounge = await getProLounge(viewerOf("pro"), DEMO_NOW);
    if (lounge.locked) throw new Error("locked");
    const track = lounge.data.tracks[0];
    const nextRace = lounge.data.races.find((r) => r.status !== "closed")!;
    // PRO HTML に必ず出る値 (クッション値・当日指数の上位馬名・レースへのリンク)
    const secrets = [
      `>${track.turf.cushion.toFixed(1)}<`, // 馬場パネルのクッション値表示
      `クッション値${track.turf.cushion}`, // タイムラインの馬場更新
      track.bias.comment,
      nextRace.topLive[0].name,
      `/pro/race/${nextRace.raceId}`,
    ];

    const pro = await html("pro");
    for (const s of secrets) expect(pro, `PRO HTML should contain ${s}`).toContain(s);
    expect(pro).toContain("リアルタイム馬場");

    for (const id of LOCKED) {
      const body = await html(id);
      expect(body).toContain("PRO会員専用ページです");
      expect(body).toContain("/pro/plans");
      for (const s of secrets) expect(body, `${id} HTML must not contain ${s}`).not.toContain(s);
      expect(body).not.toContain("TRACK LIVE");
    }
  });
});
