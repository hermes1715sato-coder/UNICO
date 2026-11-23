import type { Direction, RaceStatus, Surface } from "./types";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export function parseDate(date: string) {
  const d = new Date(date + "T00:00:00Z");
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: d.getUTCDay() };
}

/** 11/28(土) */
export function formatDateShort(date: string) {
  const p = parseDate(date);
  return `${p.m}/${p.d}(${WEEK[p.w]})`;
}

/** 2026年11月28日(土) */
export function formatDateLong(date: string) {
  const p = parseDate(date);
  return `${p.y}年${p.m}月${p.d}日(${WEEK[p.w]})`;
}

export function weekdayOf(date: string) {
  return WEEK[parseDate(date).w];
}

/** 日本の祝日 (DEMO 範囲のみ。本番は祝日マスタを使用) */
const HOLIDAYS = new Set(["2026-11-03", "2026-11-23"]);
export function isHoliday(date: string) {
  return HOLIDAYS.has(date);
}

export const SURFACE_LABEL: Record<Surface, string> = { turf: "芝", dirt: "ダート" };
export const DIRECTION_LABEL: Record<Direction, string> = { right: "右", left: "左", straight: "直線" };

export const RACE_STATUS_LABEL: Record<RaceStatus, string> = {
  before_entry: "出走確定前",
  analyzing: "分析中",
  analyzed: "分析完了",
  finished: "レース終了",
};

export function formatYen(n: number) {
  return `${n.toLocaleString("ja-JP")}円`;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const j = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${j.getUTCMonth() + 1}/${j.getUTCDate()} ${String(j.getUTCHours()).padStart(2, "0")}:${String(j.getUTCMinutes()).padStart(2, "0")}`;
}
