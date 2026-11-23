/* =========================================================
   UNICO ドメイン型定義
   データ取得層 → DB → 指数計算 → 画面表示 の各層で共有する契約。
   ========================================================= */

export type Surface = "turf" | "dirt";
export type Direction = "right" | "left" | "straight";
export type TrackCondition = "良" | "稍重" | "重" | "不良";

/** レースの進行状態 (UI状態設計: 18章) */
export type RaceStatus =
  | "before_entry"   // 出走確定前
  | "analyzing"      // 分析中
  | "analyzed"       // 分析完了
  | "finished";      // レース終了

/** PRO公開状況 */
export type ProAvailability = "on_sale" | "preparing" | "none";

export interface Venue {
  code: string;      // JRA場コード (05=東京 など)
  name: string;      // 東京
  nameEn: string;    // TOKYO
}

export interface MeetingDay {
  date: string;          // YYYY-MM-DD
  venues: Venue[];       // その日に実際に開催される競馬場のみ
}

export interface RaceSummary {
  id: string;            // 例: 20261128-05-11
  date: string;
  venue: Venue;
  raceNo: number;        // 1..12
  name: string;          // レース名
  grade?: "G1" | "G2" | "G3" | "L" | "OP";
  className: string;     // 3歳以上2勝クラス など
  postTime: string;      // HH:mm
  surface: Surface;
  distance: number;      // m
  direction: Direction;
  trackCondition?: TrackCondition; // 未発表なら undefined
  fieldSize: number;     // 出走頭数
  status: RaceStatus;
  freeWide: boolean;     // 無料ワイド予想の有無
  pro: ProAvailability;
  featured?: boolean;    // 本日の注目レース
}

/** UNICO指数の構成9項目 (0-100) */
export interface IndexBreakdown {
  ability: number;   // 基礎能力 20%
  recent: number;    // 近走内容 6%
  aptitude: number;  // コース・距離・馬場適性 10%
  pace: number;      // 展開 10%
  workout: number;   // 追い切り 10%
  stable: number;    // 陣営AI 8%
  jockey: number;    // 騎手 15%
  drawWeight: number;// 枠順・斤量 6%
  pedigree: number;  // 血統 15%
}

export type IndexFactor = keyof IndexBreakdown;

export interface Entry {
  horseId: string;
  frame: number;        // 枠番 1-8
  horseNo: number;      // 馬番
  name: string;
  sex: "牡" | "牝" | "セ";
  age: number;
  jockey: string;
  weight: number;       // 斤量 (kg)
  odds?: number;        // 単勝オッズ (未取得なら undefined)
  popularity?: number;  // 人気 (未取得なら undefined)
  scratched?: boolean;  // 出走取消
  sire: string;         // 父
  damSire: string;      // 母父
}

/** 無料で公開してよい指数情報 (総合指数のみ) */
export interface PublicIndex {
  horseId: string;
  score: number;        // 総合UNICO指数 (0-100, 小数1桁)
  rank: number;         // 指数順位
}

export interface IndexMeta {
  version: string;      // 指数バージョン 例: "v2.0"
  computedAt: string;   // ISO 更新日時
}

export interface FreeWidePick {
  type: "box3" | "box4";
  horses: { horseNo: number; name: string; reason: string }[];
  points: number;       // 点数 (3頭BOX=3, 4頭BOX=6)
}

/** レース詳細ページ (無料閲覧) に渡すデータ。PRO情報は含めない。 */
export interface RaceDetailPublic {
  race: RaceSummary;
  entries: Entry[];
  index: PublicIndex[] | null;   // 分析前は null
  indexMeta: IndexMeta | null;
  freeWide: FreeWidePick | null;
  isDemo: boolean;
}
