/* =========================================================
   PRO会員専用ページのデータ型
   当日リアルタイム情報 (馬場・馬体重・パドック・各種更新) と詳細分析。
   すべて PRO 限定。サーバーで権限判定した後にのみ生成・返却する。
   ========================================================= */
import type { IndexBreakdown, IndexFactor, TrackCondition } from "../types";

export type Weather = "晴" | "曇" | "小雨" | "雨";
export type BiasLevel = "有利" | "やや有利" | "フラット" | "やや不利" | "不利";

/** 競馬場ごとのリアルタイム馬場状況 */
export interface TrackLive {
  venueCode: string;
  venueName: string;
  updatedAt: string;               // ISO
  weather: Weather;
  windDirection: string;           // 北北西 など
  windSpeed: number;               // m/s
  turf: {
    condition: TrackCondition;
    cushion: number;               // クッション値
    moistureGoal: number;          // 含水率 ゴール前 %
    moisture4c: number;            // 含水率 4コーナー %
    rail: string;                  // Aコース など
  };
  dirt: {
    condition: TrackCondition;
    moistureGoal: number;
    moisture4c: number;
  };
  /** 当日バイアス (芝コース。午前の結果から判定) */
  bias: { inside: BiasLevel; front: BiasLevel; comment: string };
}

export type LiveUpdateKind = "track" | "scratch" | "jockey_change" | "weight" | "paddock" | "index_recalc" | "final_published";

/** 当日の更新タイムライン */
export interface LiveUpdate {
  id: string;
  at: string;                      // ISO
  kind: LiveUpdateKind;
  venueName: string;
  raceId?: string;
  raceLabel?: string;              // 東京6R
  title: string;
  detail: string;
}

export type PaddockGrade = "S" | "A" | "B" | "C";
export type RunningStyle = "逃げ" | "先行" | "差し" | "追込";
export type StableTone = "強気" | "前向き" | "平常" | "慎重";

export interface HorseProDetail {
  horseNo: number;
  frame: number;
  name: string;
  sexAge: string;
  jockeyName: string;
  weightCarried: number;
  scratched: boolean;

  /** 馬体重 (発走約70分前に発表。未発表は null) */
  bodyWeight: { value: number; diff: number; announcedAt: string } | null;
  /** パドック評価 (発走約30分前。未実施は null) */
  paddock: { grade: PaddockGrade; points: string[]; comment: string; at: string } | null;

  /** UNICO指数: 前日時点 → 当日補正後 */
  index: { pre: number; live: number; delta: number; rankPre: number; rankLive: number };
  factors: IndexBreakdown;
  factorNotes: Record<IndexFactor, string>;

  /** 陣営AI指数と陣営コメント */
  stable: {
    aiIndex: number;               // 0-100 (陣営AIの項目スコア)
    tone: StableTone;
    trainer: string;
    comment: string;               // 陣営コメント (DEMO は架空)
    highlights: string[];          // AI が抽出した要点
  };

  pedigree: {
    sire: string;
    sireLine: string;
    damSire: string;
    damSireLine: string;
    distanceFit: string;           // 1600-2000m
    surfaceFit: { turf: string; dirt: string };   // ◎◯△×
    goingFit: { firm: string; soft: string };     // 良 / 道悪
    nick: string;                  // ニックス評価コメント
    sireCourseStats: { starts: number; wins: number; top3: number };
  };

  jockey: {
    name: string;
    courseStats: { rides: number; wins: number; top3: number };   // 当該コース
    withHorse: { rides: number; wins: number };                   // 当該馬とのコンビ
    note: string;
  };

  pace: {
    style: RunningStyle;
    expectedEarly: number;         // 想定 序盤位置 (1=先頭)
    expectedLate: number;          // 想定 4角位置
    note: string;
  };

  workout: {
    date: string;                  // 11/25(水)
    course: string;                // 美浦W / 栗東坂路 など
    time: string;                  // 52.3-37.8-12.1
    rating: "S" | "A" | "B" | "C";
    partner: string | null;        // 併せ馬
    note: string;
  };
}

export interface RacePaceForecast {
  pace: "スロー" | "ミドル" | "ハイ";
  leaders: number[];               // 逃げ・先行想定の馬番
  comment: string;
}

/** レース別 PRO 分析 */
export interface ProRaceAnalysis {
  raceId: string;
  updatedAt: string;
  phase: {
    weightsAnnouncedAt: string;    // 馬体重 発表(予定)時刻
    weightsAnnounced: boolean;
    paddockAt: string;
    paddockDone: boolean;
    closed: boolean;
  };
  track: TrackLive | null;
  paceForecast: RacePaceForecast;
  horses: HorseProDetail[];        // 当日補正後の指数順
  updates: LiveUpdate[];           // このレースに関する更新
}

/** PRO トップ (当日ダッシュボード) */
export interface ProLounge {
  date: string;
  now: string;
  tracks: TrackLive[];
  updates: LiveUpdate[];           // 新しい順
  races: {
    raceId: string;
    venueName: string;
    raceNo: number;
    name: string;
    grade?: "G1" | "G2" | "G3" | "L" | "OP";
    surface: "turf" | "dirt";
    distance: number;
    postTime: string;
    status: "closed" | "paddock" | "weights" | "upcoming";
    finalPublished: boolean;
    topLive: { horseNo: number; name: string; live: number; delta: number }[];
  }[];
}
