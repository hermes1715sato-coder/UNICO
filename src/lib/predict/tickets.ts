/* =========================================================
   買い目生成 (予想生成層。指数計算 scoring.ts とは分離)
   本線 / 中穴 / 穴同士 を独立した役割として扱う。
   コース適性・展開・追い切りに評価のある穴馬は、総合指数が低くても削除しない。
   ========================================================= */
import type { Entry, IndexBreakdown, PublicIndex } from "../types";
import type { Mark, StakeAllocation, TicketLine, TicketType } from "../predictions/types";
import { rng } from "../demo/generate";

export interface TicketInput {
  raceId: string;
  entries: Entry[];
  index: PublicIndex[];
  breakdowns: Record<string, IndexBreakdown>;
}

export interface GeneratedTickets {
  lines: TicketLine[];
  stakeAllocation: StakeAllocation[];
  totalStake: number;
  marks?: Partial<Record<number, Mark>>;
}

const BUDGET = 3000;

/** 穴候補: 指数6位以下で、適性・展開・追い切りのいずれかが高い馬 */
function longshotCandidates(order: { horseNo: number; bd: IndexBreakdown }[]): number[] {
  return order
    .slice(5)
    .map((h) => ({ no: h.horseNo, v: Math.max(h.bd.aptitude, h.bd.pace, h.bd.workout) + (h.bd.aptitude + h.bd.pace) / 10 }))
    .filter((h) => h.v >= 70)
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map((h) => h.no);
}

function pairs(nos: number[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < nos.length; i++) for (let j = i + 1; j < nos.length; j++) out.push([nos[i], nos[j]].sort((a, b) => a - b));
  return out;
}

function line(ticketType: TicketType, role: TicketLine["role"], combinations: number[][], stakePerPoint: number): TicketLine {
  const uniq = Array.from(new Map(combinations.map((c) => [c.join("-"), c])).values());
  return { ticketType, role, combinations: uniq, points: uniq.length, stakePerPoint, stake: uniq.length * stakePerPoint };
}

function build(order: { horseNo: number; bd: IndexBreakdown }[], withMarks: boolean): GeneratedTickets {
  const top = order.map((o) => o.horseNo);
  const axis = top[0];
  const holes = longshotCandidates(order);
  const lines: TicketLine[] = [];

  // 本線: 軸からワイド3点
  lines.push(line("WIDE", "main", top.slice(1, 4).map((n) => [axis, n].sort((a, b) => a - b)), 400));
  // 中穴: 馬連 軸-2,3位 + 穴1頭目
  const midPartners = [top[1], top[2], holes[0] ?? top[4]];
  lines.push(line("UMAREN", "mid", midPartners.map((n) => [axis, n].sort((a, b) => a - b)), 200));
  // 中穴: 3連複 軸1頭 - 相手4頭
  const trioPartners = [top[1], top[2], top[3], holes[0] ?? top[4]];
  lines.push(line("SANRENPUKU", "mid", pairs(trioPartners).map((p) => [axis, ...p].sort((a, b) => a - b)), 100));
  // 穴同士: ワイド (穴候補が2頭いる場合のみ。1頭なら上位5位と)
  if (holes.length >= 1) {
    const partner = holes[1] ?? top[4];
    lines.push(line("WIDE", "longshot", [[holes[0], partner].sort((a, b) => a - b)], 0));
  }

  // 資金配分: 予算 BUDGET 円に合わせ、穴同士は残額を1点に配分
  const used = lines.reduce((s, l) => s + l.stake, 0);
  const ls = lines.find((l) => l.role === "longshot");
  if (ls) {
    const rest = Math.max(100, Math.floor((BUDGET - used) / 100) * 100);
    ls.stakePerPoint = rest;
    ls.stake = rest * ls.points;
  }
  const totalStake = lines.reduce((s, l) => s + l.stake, 0);
  const stakeAllocation: StakeAllocation[] = lines.map((l) => ({
    role: l.role,
    ticketType: l.ticketType,
    amount: l.stake,
    ratio: Math.round((l.stake / totalStake) * 1000) / 1000,
  }));

  let marks: GeneratedTickets["marks"];
  if (withMarks) {
    marks = {};
    const seq: Mark[] = ["◎", "○", "▲", "△", "△"];
    top.slice(0, 5).forEach((n, i) => (marks![n] = seq[i]));
    if (holes[0] !== undefined && !marks[holes[0]]) marks[holes[0]] = "☆";
    if (holes[1] !== undefined && !marks[holes[1]]) marks[holes[1]] = "注";
  }
  return { lines, stakeAllocation, totalStake, marks };
}

function orderOf(input: TicketInput, adjust?: (horseId: string, score: number) => number) {
  return input.index
    .map((ix) => {
      const e = input.entries.find((x) => x.horseId === ix.horseId)!;
      return { horseNo: e.horseNo, bd: input.breakdowns[ix.horseId], s: adjust ? adjust(ix.horseId, ix.score) : ix.score };
    })
    .sort((a, b) => b.s - a.s);
}

/** 事前買い目: 前日時点の指数で生成。印は含めない (PRO限定データのため) */
export function generatePreRaceTickets(input: TicketInput): GeneratedTickets | null {
  if (input.index.length < 6) return null;
  return build(orderOf(input), false);
}

/**
 * 最終買い目: 当日の馬場・直前オッズ・馬体重などの補正を反映して再評価。
 * DEMO では決定的な疑似補正で再現する。印 (◎○▲△☆注) を含む。
 */
export function generateFinalTickets(input: TicketInput, version: number): GeneratedTickets | null {
  if (input.index.length < 6) return null;
  const r = rng(`final:${input.raceId}:v${version}`);
  const adj = new Map(input.index.map((ix) => [ix.horseId, (r() - 0.5) * 7]));
  return build(orderOf(input, (id, s) => s + (adj.get(id) ?? 0)), true);
}
