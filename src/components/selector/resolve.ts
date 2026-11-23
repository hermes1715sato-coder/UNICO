/* =========================================================
   開催日・競馬場の選択状態を URL パラメータから解決する (サーバー専用)
   不正な ?date / ?venue は既定値へフォールバックする。
   ========================================================= */
import "server-only";
import type { MeetingDay, RaceSummary, Venue } from "@/lib/types";
import { getDefaultDate, getMeetingDays, getRaces, getToday } from "@/lib/data";

export type SearchParams = Record<string, string | string[] | undefined>;

export interface DateOption {
  date: string;
  isToday: boolean;
  hasMeeting: boolean;
}

export interface RaceSelection {
  today: string;
  dates: DateOption[];
  date: string;
  venues: Venue[];
  venue: Venue | null;
  races: RaceSummary[];
  /** 選択日に開催がない場合の次回開催日 */
  nextMeetingDate: string | null;
  meetings: MeetingDay[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export async function resolveSelection(sp: SearchParams): Promise<RaceSelection> {
  const [meetings, defaultDate] = await Promise.all([getMeetingDays(), getDefaultDate()]);
  const today = getToday();

  // 日付タブ: 開催日 + 今日 (開催がなくても表示)
  const set = new Set(meetings.map((m) => m.date));
  set.add(today);
  const dates: DateOption[] = [...set].sort().map((d) => ({
    date: d,
    isToday: d === today,
    hasMeeting: meetings.some((m) => m.date === d),
  }));

  const rawDate = first(sp.date);
  const date = rawDate && DATE_RE.test(rawDate) && set.has(rawDate) ? rawDate : defaultDate;

  const day = meetings.find((m) => m.date === date);
  const venues = day?.venues ?? [];
  const rawVenue = first(sp.venue);
  const venue = venues.find((v) => v.code === rawVenue) ?? venues[0] ?? null;

  const races = venue ? await getRaces(date, venue.code) : [];
  const nextMeetingDate = day ? null : (meetings.find((m) => m.date > date)?.date ?? null);

  return { today, dates, date, venues, venue, races, nextMeetingDate, meetings };
}

export function selectionHref(basePath: string, date: string, venueCode?: string, hash?: string) {
  const q = new URLSearchParams({ date });
  if (venueCode) q.set("venue", venueCode);
  return `${basePath}?${q.toString()}${hash ? `#${hash}` : ""}`;
}
