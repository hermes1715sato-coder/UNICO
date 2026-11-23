/* =========================================================
   データアクセス層 (サーバー専用)
   現在は DEMO ジェネレータを返す。JRA-VAN / Supabase 接続後は
   この関数群の実装だけを差し替える。画面側は変更不要。
   PRO情報 (印・買い目・項目別指数) はこの層から無料画面へ返さない。
   ========================================================= */
import "server-only";
import type { MeetingDay, RaceDetailPublic, RaceSummary } from "./types";
import { DEMO_MEETINGS, DEMO_NOW, buildEntries, buildRace, parseRaceId } from "./demo/generate";
import { INDEX_VERSION, rankIndex } from "./scoring";
import { buildFreeWide } from "./predict/free-wide";

export const IS_DEMO = true;

/** 基準日 (DEMO中は固定日付) */
export function getToday(): string {
  return DEMO_NOW;
}

export async function getMeetingDays(): Promise<MeetingDay[]> {
  return DEMO_MEETINGS;
}

/** 既定で表示する開催日: 今日以降で最も近い開催日、なければ直近の過去開催 */
export async function getDefaultDate(): Promise<string> {
  const today = getToday();
  const next = DEMO_MEETINGS.find((m) => m.date >= today);
  return (next ?? DEMO_MEETINGS[DEMO_MEETINGS.length - 1]).date;
}

export async function getRaces(date: string, venueCode: string): Promise<RaceSummary[]> {
  const day = DEMO_MEETINGS.find((m) => m.date === date);
  if (!day) return [];
  const vi = day.venues.findIndex((v) => v.code === venueCode);
  if (vi < 0) return [];
  return Array.from({ length: 12 }, (_, i) => buildRace(date, day.venues[vi], i + 1, vi));
}

/** 指定日の全競馬場のレース (注目レース抽出用) */
export async function getRacesOfDay(date: string): Promise<RaceSummary[]> {
  const day = DEMO_MEETINGS.find((m) => m.date === date);
  if (!day) return [];
  return day.venues.flatMap((v, vi) => Array.from({ length: 12 }, (_, i) => buildRace(date, v, i + 1, vi)));
}

export async function getRace(id: string): Promise<RaceSummary | null> {
  const p = parseRaceId(id);
  if (!p || p.raceNo < 1 || p.raceNo > 12) return null;
  const day = DEMO_MEETINGS.find((m) => m.date === p.date);
  if (!day) return null;
  const vi = day.venues.findIndex((v) => v.code === p.venueCode);
  if (vi < 0) return null;
  return buildRace(p.date, day.venues[vi], p.raceNo, vi);
}

/** レース詳細 (無料公開範囲のみ) */
export async function getRaceDetailPublic(id: string): Promise<RaceDetailPublic | null> {
  const race = await getRace(id);
  if (!race) return null;
  const { entries, breakdowns } = buildEntries(race);
  const analyzed = race.status === "analyzed" || race.status === "finished";
  const index = analyzed
    ? rankIndex(entries.map((e) => ({ horseId: e.horseId, breakdown: breakdowns[e.horseId], scratched: e.scratched })))
    : null;
  return {
    race,
    entries: race.status === "before_entry" ? [] : entries,
    index,
    indexMeta: index ? { version: INDEX_VERSION, computedAt: `${race.date}T09:30:00+09:00` } : null,
    freeWide: index && race.freeWide ? buildFreeWide(entries, index, breakdowns) : null,
    isDemo: IS_DEMO,
  };
}
