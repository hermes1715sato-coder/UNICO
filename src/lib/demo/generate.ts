/* =========================================================
   DEMO データ生成 (架空データ。実在の馬・騎手・レースではない)
   JRA-VAN 未接続時のみ使用し、画面には必ず DEMO と表示する。
   決定的な疑似乱数で生成するため、SSR/CSRで同じ結果になる。
   ========================================================= */
import type {
  Entry,
  IndexBreakdown,
  MeetingDay,
  RaceStatus,
  RaceSummary,
  Surface,
  TrackCondition,
  Venue,
} from "../types";

export const VENUES: Record<string, Venue> = {
  "05": { code: "05", name: "東京", nameEn: "TOKYO" },
  "08": { code: "08", name: "京都", nameEn: "KYOTO" },
  "06": { code: "06", name: "中山", nameEn: "NAKAYAMA" },
  "09": { code: "09", name: "阪神", nameEn: "HANSHIN" },
  "07": { code: "07", name: "中京", nameEn: "CHUKYO" },
  "03": { code: "03", name: "福島", nameEn: "FUKUSHIMA" },
};

/** DEMO開催カレンダー。11/23(月・祝) は開催なし。 */
export const DEMO_MEETINGS: MeetingDay[] = [
  { date: "2026-11-21", venues: [VENUES["05"], VENUES["08"], VENUES["03"]] },
  { date: "2026-11-22", venues: [VENUES["05"], VENUES["08"], VENUES["03"]] },
  { date: "2026-11-28", venues: [VENUES["05"], VENUES["08"]] },
  { date: "2026-11-29", venues: [VENUES["05"], VENUES["08"]] },
  { date: "2026-12-05", venues: [VENUES["06"], VENUES["09"], VENUES["07"]] },
  { date: "2026-12-06", venues: [VENUES["06"], VENUES["09"], VENUES["07"]] },
];

// ---------- PRNG ----------
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
const int = (r: () => number, min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;

// ---------- 架空の名前素材 ----------
const H1 = ["アルジェント", "シルヴァ", "ノクターン", "ミストラル", "ルミナス", "エクリュ", "グラファイト", "セレスタ", "ヴェルデ", "オーロラ", "クォーツ", "ステラ", "フィヨルド", "リュミエール", "カデンツァ", "ブランシュ", "テンペスタ", "ソナタ", "アトラス", "ヘリオス", "ネビュラ", "プリズム", "ミラージュ", "オベリスク", "ジェイド", "ラピス", "コメット", "エテルナ", "パラディン", "ゼフィール"];
const H2 = ["ライン", "ハート", "ロード", "ウィング", "クラウン", "ゲート", "ブリーズ", "スカイ", "ノート", "フレア", "ビート", "ソング", "アロー", "テイル", "ベル", "ダンス", "リーフ", "ムーン", "スター", "ノヴァ"];
const JOCKEYS = ["佐伯 航", "三浦 颯", "高峰 蓮", "北原 悠", "杉本 匠", "宮下 隼", "藤代 樹", "岸田 陸", "長谷 瑛", "沢村 翔", "森永 拓", "早瀬 光", "西園 誠", "黒川 大和", "野々村 唯"];
const SIRES = ["シルバーレガシー", "フォレストキング", "グランアルジェ", "ミッドナイトラン", "ノーザンエコー", "ブリリアントロウ", "ストームクレスト", "ヴァーミリオン", "エメラルドコースト", "ハイランドソウル"];
const DAMSIRES = ["サウザンドリーフ", "ゴールデンアロー", "マウントクラウン", "ブルーラグーン", "レッドオーク", "アイアンメイデン", "ウィンドミル", "シーサイドロマン"];

const RACE_NAMES_FEATURE = ["銀嶺ステークス", "白樺特別", "霜月ステークス", "晩秋カップ", "アイボリーハンデキャップ", "シルバーホーンステークス", "月光特別", "冬麗ステークス"];
const RACE_NAMES_SPECIAL = ["紅葉特別", "清流特別", "初霜特別", "鈴鹿山特別", "銀杏特別", "千両特別", "木枯らし特別", "朝霧特別"];
const CLASSES_EARLY = ["2歳未勝利", "2歳新馬", "3歳以上1勝クラス", "2歳未勝利", "3歳以上1勝クラス", "3歳以上2勝クラス"];

const POST_TIMES = ["10:05", "10:35", "11:05", "11:35", "12:25", "12:55", "13:25", "13:55", "14:25", "15:00", "15:40", "16:15"];

export function raceId(date: string, venueCode: string, raceNo: number) {
  return `${date.replaceAll("-", "")}-${venueCode}-${String(raceNo).padStart(2, "0")}`;
}

export function parseRaceId(id: string) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})-(\d{2})$/.exec(id);
  if (!m) return null;
  return { date: `${m[1]}-${m[2]}-${m[3]}`, venueCode: m[4], raceNo: Number(m[5]) };
}

/** 基準日 (DEMO の「現在」)。実運用では JST 現在日時。 */
export const DEMO_NOW = "2026-11-23";

function statusFor(date: string, raceNo: number, r: () => number): RaceStatus {
  if (date < DEMO_NOW) return "finished";
  const days = (Date.parse(date) - Date.parse(DEMO_NOW)) / 86400000;
  if (days <= 6) return raceNo >= 11 || r() < 0.85 ? "analyzed" : "analyzing";
  if (days <= 7) return r() < 0.5 ? "analyzing" : "before_entry";
  return "before_entry";
}

export function buildRace(date: string, venue: Venue, raceNo: number, venueIndex: number): RaceSummary {
  const r = rng(`race:${date}:${venue.code}:${raceNo}`);
  const isMain = raceNo === 11;
  const isSpecial = raceNo === 9 || raceNo === 10 || raceNo === 12;
  const surface: Surface = isMain ? "turf" : r() < 0.5 ? "turf" : "dirt";
  const distances = surface === "turf" ? [1200, 1400, 1600, 1800, 2000, 2200, 2400] : [1200, 1400, 1600, 1700, 1800, 1900, 2100];
  const distance = isMain ? pick(r, [1600, 1800, 2000, 2400]) : pick(r, distances);
  const status = statusFor(date, raceNo, r);
  const conds: TrackCondition[] = ["良", "良", "良", "稍重", "重"];
  const trackCondition = status === "finished" ? pick(r, conds) : date <= addDays(DEMO_NOW, 6) ? pick(r, conds) : undefined;
  const fieldSize = isMain ? int(r, 14, 18) : int(r, 9, 16);

  let name: string;
  let className: string;
  let grade: RaceSummary["grade"];
  if (isMain) {
    // 同日内で競馬場ごとに必ず異なる名前になるよう、日付ハッシュ + 場インデックスで選ぶ
    name = RACE_NAMES_FEATURE[(hash(date) + venueIndex * 3) % RACE_NAMES_FEATURE.length];
    grade = venueIndex === 0 ? pick(r, ["G2", "G3"] as const) : pick(r, ["L", "OP", "G3"] as const);
    className = grade === "OP" || grade === "L" ? "3歳以上オープン" : "3歳以上";
  } else if (isSpecial) {
    name = RACE_NAMES_SPECIAL[(hash(date + venue.code + raceNo)) % RACE_NAMES_SPECIAL.length];
    className = pick(r, ["3歳以上2勝クラス", "3歳以上1勝クラス", "3歳以上3勝クラス"]);
  } else {
    className = raceNo <= 4 ? pick(r, CLASSES_EARLY.slice(0, 2)) : pick(r, CLASSES_EARLY);
    name = className;
  }

  // 開催場ごとに発走時刻を少しずらす
  const [hh, mm] = POST_TIMES[raceNo - 1].split(":").map(Number);
  const t = hh * 60 + mm + venueIndex * 10;
  const postTime = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

  return {
    id: raceId(date, venue.code, raceNo),
    date,
    venue,
    raceNo,
    name,
    grade,
    className,
    postTime,
    surface,
    distance,
    direction: venue.code === "05" || venue.code === "07" ? "left" : "right",
    trackCondition,
    fieldSize,
    status,
    freeWide: status === "analyzed" || status === "finished",
    pro: status === "analyzed" ? (raceNo >= 9 || r() < 0.6 ? "on_sale" : "none") : status === "analyzing" ? "preparing" : "none",
    featured: isMain && venueIndex === 0,
  };
}

export function buildEntries(race: RaceSummary): { entries: Entry[]; breakdowns: Record<string, IndexBreakdown> } {
  const r = rng(`entries:${race.id}`);
  const n = race.fieldSize;
  const entries: Entry[] = [];
  const breakdowns: Record<string, IndexBreakdown> = {};
  const usedNames = new Set<string>();
  const hasOdds = race.status === "analyzed" || race.status === "finished";

  // 馬ごとの「地力」から各項目を生成
  const strength = Array.from({ length: n }, () => r());
  for (let i = 0; i < n; i++) {
    const horseNo = i + 1;
    const frame = frameOf(horseNo, n);
    let name = "";
    do {
      name = pick(r, H1) + pick(r, H2);
    } while (usedNames.has(name) || name.length > 9);
    usedNames.add(name);

    const s = strength[i];
    const f = (spread: number) => Math.round(Math.min(98, Math.max(28, 45 + s * 40 + (r() - 0.5) * spread)));
    const bd: IndexBreakdown = {
      ability: f(18),
      recent: f(40),
      aptitude: f(34),
      pace: f(40),
      workout: f(36),
      stable: f(30),
      jockey: f(30),
      drawWeight: f(30),
      pedigree: f(34),
    };
    const horseId = `${race.id}-${String(horseNo).padStart(2, "0")}`;
    breakdowns[horseId] = bd;
    const isNewcomer = race.className.includes("新馬");
    entries.push({
      horseId,
      frame,
      horseNo,
      name,
      sex: race.className.includes("牝") ? "牝" : (pick(r, ["牡", "牡", "牝", "セ"] as const)),
      age: race.className.startsWith("2歳") ? 2 : int(r, 3, 6),
      jockey: pick(r, JOCKEYS),
      weight: isNewcomer ? 55 : pick(r, [54, 55, 56, 57, 58]),
      sire: pick(r, SIRES),
      damSire: pick(r, DAMSIRES),
      scratched: false,
    });
  }

  // オッズ・人気 (地力 + ノイズ)
  if (hasOdds) {
    const market = entries.map((e, i) => ({ e, v: strength[i] + (r() - 0.5) * 0.5 }));
    market.sort((a, b) => b.v - a.v);
    market.forEach((m, i) => {
      m.e.popularity = i + 1;
      m.e.odds = Math.round((1.8 + i * i * 0.55 + i * 1.6 + r() * 2) * 10) / 10;
    });
  }

  // 一部レースで出走取消を1頭
  if (race.status !== "before_entry" && r() < 0.15) {
    const idx = int(r, 0, n - 1);
    entries[idx].scratched = true;
    entries[idx].odds = undefined;
    entries[idx].popularity = undefined;
    // 人気を詰め直す
    const live = entries.filter((e) => !e.scratched && e.popularity !== undefined).sort((a, b) => a.popularity! - b.popularity!);
    live.forEach((e, i) => (e.popularity = i + 1));
  }

  return { entries, breakdowns };
}

/** 頭数に応じた枠番割り当て (JRA方式) */
export function frameOf(horseNo: number, n: number): number {
  if (n <= 8) return horseNo;
  const frames: number[] = [];
  const base = Math.floor(n / 8);
  const extra = n % 8; // 外枠から2頭ずつ
  for (let f = 1; f <= 8; f++) {
    const count = base + (f > 8 - extra ? 1 : 0);
    for (let k = 0; k < count; k++) frames.push(f);
  }
  return frames[horseNo - 1];
}

function addDays(date: string, d: number) {
  const t = new Date(date + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
}
