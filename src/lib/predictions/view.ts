/* =========================================================
   閲覧者に応じた予想ビュー (サーバー専用)
   画面 (Server Component) と API はこの関数だけを経由して予想データを得る。
   権限がない/未公開のデータはオブジェクトに一切含めない (クライアントへ送られない)。
   ========================================================= */
import "server-only";
import type { IndexBreakdown } from "../types";
import type { Mark, PredictionDiff, PredictionStatus, PredictionVersionState, StakeAllocation, TicketLine, TicketType } from "./types";
import { getRace } from "../data";
import { buildEntries } from "../demo/generate";
import { rankIndex } from "../scoring";
import {
  getCurrentPublished,
  getNextScheduledAt,
  getPublishedHistory,
  isPredictionTarget,
  raceCloseAt,
} from "./store";
import {
  PRE_RACE_PRICE_JPY,
  canPurchasePreRace,
  canView,
  showAds,
  tierForRace,
  type AccessTier,
  type Viewer,
} from "../access/policy";

/** クライアントへ渡してよい買い目データ (印なし) */
export interface TicketsPayload {
  version: number;
  predictionStatus: PredictionStatus;
  publishedAt: string;
  updatedAt: string;
  lines: TicketLine[];
  stakeAllocation: StakeAllocation[];
  totalStake: number;
}

export interface FinalPayload extends TicketsPayload {
  marks: Partial<Record<number, Mark>>;
}

export interface HistoryItem {
  version: number;
  predictionStatus: PredictionStatus;
  publishedAt: string;
  totalStake: number;
  note?: string;
}

export type PreRaceState =
  | "not_target"   // 予想対象外のレース
  | "not_ready"    // 未作成・公開予定 (データなし)
  | "locked"       // 公開済みだが閲覧権限なし
  | "available";   // 閲覧可

export type FinalState =
  | "not_target"
  | "preparing"    // 最終予想準備中 (未公開)
  | "locked"       // 公開済み・PRO限定
  | "available";

export interface RacePredictionView {
  raceId: string;
  now: string;
  tier: AccessTier;
  showAds: boolean;
  raceClosed: boolean;
  preRace: {
    state: PreRaceState;
    price: number;
    scheduledAt: string | null;      // 次の公開予定 (日時のみ。中身は含まない)
    publishedAt: string | null;
    unlockedBy: "purchase" | "pro" | null;
    purchase: ReturnType<typeof canPurchasePreRace>;
    data: TicketsPayload | null;     // state === "available" のときのみ
    history: HistoryItem[] | null;   // PRO のみ
  };
  final: {
    state: FinalState;
    scheduledAt: string | null;      // PRO にのみ返す
    data: FinalPayload | null;       // PRO かつ公開済みのみ
    history: HistoryItem[] | null;   // PRO のみ
    diff: PredictionDiff | null;     // PRO のみ (事前→最終)
  };
  proAnalysis: {
    state: "locked" | "available" | "not_ready";
    horses: { horseNo: number; name: string; breakdown: IndexBreakdown }[] | null;
  };
}

function toPayload(v: PredictionVersionState): TicketsPayload {
  return {
    version: v.version,
    predictionStatus: v.predictionStatus,
    publishedAt: v.publishedAt!,
    updatedAt: v.updatedAt,
    lines: structuredClone(v.lines), // 複製して返す (保存済みバージョンの不変性を守る)
    stakeAllocation: structuredClone(v.stakeAllocation),
    totalStake: v.totalStake,
  };
}

function toHistory(list: PredictionVersionState[]): HistoryItem[] {
  return list.map((v) => ({
    version: v.version,
    predictionStatus: v.predictionStatus,
    publishedAt: v.publishedAt!,
    totalStake: v.totalStake,
    note: v.note,
  }));
}

function diffOf(pre: PredictionVersionState, fin: PredictionVersionState): PredictionDiff {
  const key = (t: TicketType, c: number[]) => `${t}:${c.join("-")}`;
  const set = (p: PredictionVersionState) => new Map(p.lines.flatMap((l) => l.combinations.map((c) => [key(l.ticketType, c), { ticketType: l.ticketType, combination: c }] as const)));
  const a = set(pre);
  const b = set(fin);
  return {
    added: [...b].filter(([k]) => !a.has(k)).map(([, v]) => v),
    removed: [...a].filter(([k]) => !b.has(k)).map(([, v]) => v),
    totalStakeBefore: pre.totalStake,
    totalStakeAfter: fin.totalStake,
  };
}

export async function getRacePredictionView(raceId: string, viewer: Viewer, now: string): Promise<RacePredictionView | null> {
  const race = await getRace(raceId);
  if (!race) return null;

  const tier = tierForRace(viewer, raceId, now);
  const target = isPredictionTarget(race);
  const raceClosed = race.status === "finished" || Date.parse(now) >= Date.parse(raceCloseAt(race));

  // ---------- PRE_RACE ----------
  const preCurrent = target ? getCurrentPublished(race, "PRE_RACE", now) : null;
  const canPre = canView(viewer, raceId, "PRE_RACE", now);
  const preState: PreRaceState = !target ? "not_target" : !preCurrent ? "not_ready" : canPre ? "available" : "locked";
  const canHistory = canView(viewer, raceId, "PREDICTION_HISTORY", now);

  // ---------- FINAL ----------
  const canFinal = canView(viewer, raceId, "FINAL", now);
  // 権限のない閲覧者に対しては、未公開版・公開版いずれの中身も取得しない
  const finCurrent = target ? getCurrentPublished(race, "FINAL", now) : null;
  const finalState: FinalState = !target ? "not_target" : !finCurrent ? "preparing" : canFinal ? "available" : "locked";

  // ---------- PRO 分析 ----------
  const canAnalysis = canView(viewer, raceId, "PRO_ANALYSIS", now);
  let horses: RacePredictionView["proAnalysis"]["horses"] = null;
  const analyzed = race.status === "analyzed" || race.status === "finished";
  if (canAnalysis && analyzed) {
    const { entries, breakdowns } = buildEntries(race);
    const order = rankIndex(entries.map((e) => ({ horseId: e.horseId, breakdown: breakdowns[e.horseId], scratched: e.scratched })));
    horses = order.map((o) => {
      const e = entries.find((x) => x.horseId === o.horseId)!;
      return { horseNo: e.horseNo, name: e.name, breakdown: breakdowns[e.horseId] };
    });
  }

  return {
    raceId,
    now,
    tier,
    showAds: showAds(viewer, now),
    raceClosed,
    preRace: {
      state: preState,
      price: PRE_RACE_PRICE_JPY,
      scheduledAt: target && !preCurrent ? getNextScheduledAt(race, "PRE_RACE", now) : null,
      publishedAt: preCurrent?.publishedAt ?? null,
      unlockedBy: preState === "available" ? (tier === "PRO" ? "pro" : "purchase") : null,
      purchase: canPurchasePreRace(viewer, raceId, now, { preRacePublished: !!preCurrent, raceClosed }),
      data: preState === "available" && preCurrent ? toPayload(preCurrent) : null,
      history: canHistory && target ? toHistory(getPublishedHistory(race, "PRE_RACE", now)) : null,
    },
    final: {
      state: finalState,
      scheduledAt: canFinal && target && !finCurrent ? getNextScheduledAt(race, "FINAL", now) : null,
      data: finalState === "available" && finCurrent ? { ...toPayload(finCurrent), marks: structuredClone(finCurrent.marks ?? {}) } : null,
      history: canHistory && target ? toHistory(getPublishedHistory(race, "FINAL", now)) : null,
      diff: canHistory && preCurrent && finCurrent ? diffOf(preCurrent, finCurrent) : null,
    },
    proAnalysis: {
      state: !canAnalysis ? "locked" : horses ? "available" : "not_ready",
      horses,
    },
  };
}
