/* =========================================================
   予想 (買い目) データの型
   PRE_RACE (事前買い目) と FINAL (最終買い目) は別データとして保存し、
   バージョンごとに不変 (immutable)。最終予想の公開で事前予想を上書きしない。
   ========================================================= */

export type PredictionType = "PRE_RACE" | "FINAL";

/**
 * DRAFT     下書き (非公開)
 * SCHEDULED 公開予定 (非公開)
 * PUBLISHED 公開済み (最新版)
 * REVISED   更新版あり (旧版。履歴として保持)
 * CLOSED    公開終了 (レース終了後。権限保持者は閲覧可)
 */
export type PredictionStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "REVISED" | "CLOSED";

export type TicketType = "TANSHO" | "FUKUSHO" | "WIDE" | "UMAREN" | "UMATAN" | "SANRENPUKU" | "SANRENTAN";

/** 買い目の役割: 本線 / 中穴 / 穴同士 (独立して扱う) */
export type TicketRole = "main" | "mid" | "longshot";

export type Mark = "◎" | "○" | "▲" | "△" | "☆" | "注";

export interface TicketLine {
  ticketType: TicketType;
  role: TicketRole;
  combinations: number[][];   // 馬番の組み合わせ
  points: number;             // 点数
  stakePerPoint: number;      // 1点あたり金額 (円)
  stake: number;              // この行の合計 (円)
}

export interface StakeAllocation {
  role: TicketRole;
  ticketType: TicketType;
  amount: number;             // 円
  ratio: number;              // 0-1
}

/** 1バージョン分の予想 (不変) */
export interface PredictionRecord {
  id: string;                 // `${raceId}:${type}:v${version}`
  raceId: string;
  predictionType: PredictionType;
  version: number;
  /** 公開予定/公開日時 (ISO)。DRAFT は null */
  publishAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: TicketLine[];        // ticket_type / combinations を行ごとに保持
  stakeAllocation: StakeAllocation[];
  totalStake: number;
  /** PRO限定データ: 予想印。FINAL のみ保持。PRE_RACE には含めない */
  marks?: Partial<Record<number, Mark>>;
  note?: string;              // 更新理由など (PRO向け)
}

/** 判定時刻での状態付き */
export interface PredictionVersionState extends PredictionRecord {
  predictionStatus: PredictionStatus;
  publishedAt: string | null; // 実際に公開された日時 (未公開は null)
}

/** 事前→最終の差分 (PRO限定) */
export interface PredictionDiff {
  added: { ticketType: TicketType; combination: number[] }[];
  removed: { ticketType: TicketType; combination: number[] }[];
  totalStakeBefore: number;
  totalStakeAfter: number;
}

export const TICKET_LABEL: Record<TicketType, string> = {
  TANSHO: "単勝",
  FUKUSHO: "複勝",
  WIDE: "ワイド",
  UMAREN: "馬連",
  UMATAN: "馬単",
  SANRENPUKU: "3連複",
  SANRENTAN: "3連単",
};

export const ROLE_LABEL: Record<TicketRole, string> = {
  main: "本線",
  mid: "中穴",
  longshot: "穴",
};
