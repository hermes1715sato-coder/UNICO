/* =========================================================
   予想ストア (DEMO 実装)
   本番では Supabase の predictions / prediction_versions テーブルに置き換える。
   - PRE_RACE と FINAL を別レコード列として保持 (互いに上書きしない)
   - 各バージョンは不変。新版の公開で旧版は REVISED として履歴に残る
   - DRAFT / SCHEDULED は非公開。このモジュールの外へは view.ts の権限判定を経由してのみ出る
   ========================================================= */
import "server-only";
import type { RaceSummary } from "../types";
import type { PredictionRecord, PredictionStatus, PredictionType, PredictionVersionState } from "./types";
import { buildEntries, rng } from "../demo/generate";
import { rankIndex } from "../scoring";
import { generateFinalTickets, generatePreRaceTickets, type TicketInput } from "../predict/tickets";

/** JST の日時文字列 */
function jst(date: string, hhmm: string) {
  return `${date}T${hhmm}:00+09:00`;
}
function shiftDate(date: string, days: number) {
  const t = new Date(date + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}
function shiftTime(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** 予想対象レースか (事前・最終を作成するレース) */
export function isPredictionTarget(race: RaceSummary) {
  return race.pro === "on_sale";
}

/** レースの締切 (発走時刻)。これ以降は CLOSED */
export function raceCloseAt(race: RaceSummary) {
  return jst(race.date, race.postTime);
}

const cache = new Map<string, PredictionRecord[]>();

function inputFor(race: RaceSummary): TicketInput | null {
  if (race.status !== "analyzed" && race.status !== "finished") return null;
  const { entries, breakdowns } = buildEntries(race);
  const index = rankIndex(entries.map((e) => ({ horseId: e.horseId, breakdown: breakdowns[e.horseId], scratched: e.scratched })));
  return { raceId: race.id, entries, breakdowns, index };
}

/** レースの全予想レコード (DRAFT 含む・内部用) */
function allRecords(race: RaceSummary): PredictionRecord[] {
  const hit = cache.get(race.id);
  if (hit) return hit;
  const out: PredictionRecord[] = [];
  const input = isPredictionTarget(race) ? inputFor(race) : null;
  if (input) {
    const r = rng(`publish:${race.id}`);
    const prevDay = shiftDate(race.date, -1);

    // ---- PRE_RACE: 前日18:00 公開。一部は前日21:30 に更新版 ----
    const preVersions: { at: string; note?: string; jitter: number }[] = [{ at: jst(prevDay, "18:00"), jitter: 0 }];
    if (r() < 0.3) preVersions.push({ at: jst(prevDay, "21:30"), note: "出走取消・騎手変更を反映", jitter: 1 });
    preVersions.forEach((v, i) => {
      const t = v.jitter ? generateFinalTickets({ ...input, raceId: `${race.id}:pre` }, i + 1) : generatePreRaceTickets(input);
      if (!t) return;
      out.push({
        id: `${race.id}:PRE_RACE:v${i + 1}`,
        raceId: race.id,
        predictionType: "PRE_RACE",
        version: i + 1,
        publishAt: v.at,
        createdAt: jst(prevDay, "17:00"),
        updatedAt: v.at,
        lines: t.lines,
        stakeAllocation: t.stakeAllocation,
        totalStake: t.totalStake,
        note: v.note,
        // PRE_RACE には印を保存しない
      });
    });

    // ---- FINAL: 発走60分前に公開。一部は発走20分前に更新版。さらに未公開の DRAFT ----
    const finalVersions: { at: string | null; note?: string }[] = [{ at: jst(race.date, shiftTime(race.postTime, -60)) }];
    if (r() < 0.35) finalVersions.push({ at: jst(race.date, shiftTime(race.postTime, -20)), note: "直前オッズ・馬場状態を反映" });
    if (r() < 0.5) finalVersions.push({ at: null, note: "下書き (未公開)" });
    finalVersions.forEach((v, i) => {
      const t = generateFinalTickets(input, i + 1);
      if (!t) return;
      out.push({
        id: `${race.id}:FINAL:v${i + 1}`,
        raceId: race.id,
        predictionType: "FINAL",
        version: i + 1,
        publishAt: v.at,
        createdAt: jst(race.date, "09:00"),
        updatedAt: v.at ?? jst(race.date, "09:00"),
        lines: t.lines,
        stakeAllocation: t.stakeAllocation,
        totalStake: t.totalStake,
        marks: t.marks,
        note: v.note,
      });
    });
  }
  cache.set(race.id, out);
  return out;
}

/** 判定時刻 now における各バージョンの状態 (DRAFT 含む・内部用) */
export function getVersionStates(race: RaceSummary, type: PredictionType, now: string): PredictionVersionState[] {
  const nowMs = Date.parse(now);
  const recs = allRecords(race)
    .filter((p) => p.predictionType === type)
    .sort((a, b) => a.version - b.version);
  const isPublished = (p: PredictionRecord) => p.publishAt !== null && Date.parse(p.publishAt) <= nowMs;
  const closed = race.status === "finished" || nowMs >= Date.parse(raceCloseAt(race));
  return recs.map((p) => {
    let status: PredictionStatus;
    if (p.publishAt === null) status = "DRAFT";
    else if (!isPublished(p)) status = "SCHEDULED";
    else if (recs.some((q) => q.version > p.version && isPublished(q))) status = "REVISED";
    else status = closed ? "CLOSED" : "PUBLISHED";
    return { ...p, predictionStatus: status, publishedAt: isPublished(p) ? p.publishAt : null };
  });
}

const VISIBLE: PredictionStatus[] = ["PUBLISHED", "REVISED", "CLOSED"];

/** 公開済みの履歴 (古い順)。DRAFT / SCHEDULED は含まない */
export function getPublishedHistory(race: RaceSummary, type: PredictionType, now: string) {
  return getVersionStates(race, type, now).filter((v) => VISIBLE.includes(v.predictionStatus));
}

/** 現在の公開版 (最新の公開済みバージョン) */
export function getCurrentPublished(race: RaceSummary, type: PredictionType, now: string) {
  const h = getPublishedHistory(race, type, now);
  return h.length ? h[h.length - 1] : null;
}

/** 次の公開予定日時 (SCHEDULED の最も早いもの)。データ本体は返さない */
export function getNextScheduledAt(race: RaceSummary, type: PredictionType, now: string): string | null {
  const s = getVersionStates(race, type, now).filter((v) => v.predictionStatus === "SCHEDULED");
  return s.length ? s[0].publishAt : null;
}

/** テスト用: キャッシュクリア */
export function __resetPredictionCache() {
  cache.clear();
}
