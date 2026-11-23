/* =========================================================
   PRO 当日リアルタイム情報・詳細分析 (サーバー専用)
   本番の情報源 (想定):
     馬場状態・含水率・クッション値・馬体重・出走取消・騎手変更 … JRA-VAN 速報系データ
     パドック評価 … UNICO 独自の評価入力 (担当者 / 映像解析)
     陣営コメント … 利用許諾を得た情報源のみ
   DEMO では決定的な疑似データで生成し、画面に必ず DEMO と表示する。
   PRO 以外の閲覧者に対しては、データを生成せず locked を返す。
   ========================================================= */
import "server-only";
import type { Entry, IndexBreakdown, IndexFactor, RaceSummary } from "../types";
import type {
  BiasLevel,
  HorseProDetail,
  LiveUpdate,
  PaddockGrade,
  ProLounge,
  ProRaceAnalysis,
  RunningStyle,
  StableTone,
  TrackLive,
  Weather,
} from "./types";
import { getRace, getRacesOfDay } from "../data";
import { DEMO_MEETINGS, buildEntries, demoTrackBase, rng } from "../demo/generate";
import { computeUnicoIndex, INDEX_FACTOR_LABELS } from "../scoring";
import { getCurrentPublished, isPredictionTarget, raceCloseAt } from "../predictions/store";
import { isProActive, type Viewer } from "../access/policy";

export type Gated<T> = { locked: true } | { locked: false; data: T };

const pick = <T,>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)];
const round1 = (v: number) => Math.round(v * 10) / 10;

function jst(date: string, hhmm: string) {
  return `${date}T${hhmm}:00+09:00`;
}
function shiftTime(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
const before = (iso: string, now: string) => Date.parse(iso) <= Date.parse(now);

// ---------------------------------------------------------------- 馬場
const WIND = ["北", "北北西", "北西", "西北西", "西", "南西", "南", "東"];

export function buildTrackLive(date: string, venueCode: string, venueName: string, now: string): TrackLive {
  const base = demoTrackBase(date, venueCode);
  const r = base.rng; // 以降の値 (風・クッション値など) は同じ乱数列の続きから
  const weather: Weather = base.weather;
  const turfMoist = base.turfMoist;
  const dirtMoist = base.dirtMoist;
  const bias: BiasLevel[] = ["有利", "やや有利", "フラット", "やや不利"];
  const inside = pick(r, bias);
  const front = pick(r, bias);
  // 更新時刻: 当日 7:30 以降、30分刻みで直近
  const nowMs = Date.parse(now);
  const dayStart = Date.parse(jst(date, "07:30"));
  const steps = Math.max(0, Math.floor((Math.min(nowMs, Date.parse(jst(date, "16:30"))) - dayStart) / (30 * 60000)));
  const updatedAt = new Date(dayStart + steps * 30 * 60000).toISOString();
  return {
    venueCode,
    venueName,
    updatedAt,
    weather,
    windDirection: pick(r, WIND),
    windSpeed: round1(0.5 + r() * 5),
    turf: { condition: base.turfCondition, cushion: round1(8 + r() * 2.8), moistureGoal: turfMoist, moisture4c: round1(turfMoist - 0.8 + r() * 1.6), rail: pick(r, ["Aコース", "Bコース", "Cコース"]) },
    dirt: { condition: base.dirtCondition, moistureGoal: dirtMoist, moisture4c: round1(dirtMoist - 0.6 + r() * 1.2) },
    bias: {
      inside,
      front,
      comment: `内側は${inside}、${front === "有利" || front === "やや有利" ? "先行勢が粘る" : front === "フラット" ? "脚質の偏りは小さい" : "差しが届く"}傾向。午前の結果から判定。`,
    },
  };
}

// ---------------------------------------------------------------- 馬ごとの詳細
const TRAINERS = ["相沢 修", "片桐 恵一", "大城 進", "宮園 隆", "西条 実", "柴田 和彦", "堀江 透", "南雲 聡"];
const SIRE_LINES: Record<string, string> = {
  シルバーレガシー: "サンデー系",
  フォレストキング: "キングマンボ系",
  グランアルジェ: "ノーザンダンサー系",
  ミッドナイトラン: "ミスプロ系",
  ノーザンエコー: "ノーザンダンサー系",
  ブリリアントロウ: "サンデー系",
  ストームクレスト: "ストームキャット系",
  ヴァーミリオン: "ロベルト系",
  エメラルドコースト: "ミスプロ系",
  ハイランドソウル: "ナスルーラ系",
};
const DAMSIRE_LINES = ["サンデー系", "ノーザンダンサー系", "ミスプロ系", "ナスルーラ系", "ロベルト系"];
const PADDOCK_POINTS = ["毛艶が良い", "踏み込みが深い", "落ち着いている", "トモの張りが良い", "気合い乗り良好", "やや発汗", "テンションが高め", "馬体に締まり"];
const STABLE_COMMENTS: Record<StableTone, string[]> = {
  強気: ["状態は今季一番。この条件なら勝ち負けを意識している。", "追い切りの動きが抜群。自信を持って送り出せる。"],
  前向き: ["順調に調整できた。展開ひとつで上位に来られる。", "前走より上積みがある。距離も合っている。"],
  平常: ["いつも通りの仕上がり。力は出せる状態。", "大きな変わり身はないが、崩れずに走れるはず。"],
  慎重: ["休み明けで課題はある。叩いての上積みを見込んでいる。", "馬場が鍵。渋るようならマイナス材料。"],
};
const COURSES = ["美浦W", "美浦坂路", "栗東CW", "栗東坂路", "美浦南P"];

function fit(v: number) {
  return v >= 80 ? "◎" : v >= 68 ? "◯" : v >= 55 ? "△" : "×";
}

function factorNote(k: IndexFactor, v: number): string {
  const lvl = v >= 80 ? "高評価" : v >= 65 ? "標準以上" : v >= 50 ? "標準" : "課題あり";
  const base: Record<IndexFactor, string> = {
    ability: "過去走の時計・上がり・相手関係から算出",
    recent: "直近3走の内容と着差を重視",
    aptitude: "当該コース・距離・当日馬場との適合",
    pace: "想定隊列と脚質の噛み合い",
    workout: "最終追い切りの時計と内容",
    stable: "陣営コメントと出走意図のAI評価",
    jockey: "騎手の当該コース成績と相性",
    drawWeight: "枠の有利不利と斤量差",
    pedigree: "父系・母父系の条件適性",
  };
  return `${INDEX_FACTOR_LABELS[k]}：${lvl}（${base[k]}）`;
}

function buildHorse(race: RaceSummary, e: Entry, bd: IndexBreakdown, now: string, weightsAt: string, paddockAt: string): Omit<HorseProDetail, "index"> & { pre: number; live: number } {
  const r = rng(`pro:${race.id}:${e.horseNo}`);
  const pre = computeUnicoIndex(bd);

  const weightsAnnounced = before(weightsAt, now);
  const paddockDone = before(paddockAt, now);
  const diff = Math.round((r() - 0.5) * 20 / 2) * 2;
  const bodyWeight = weightsAnnounced && !e.scratched ? { value: 440 + Math.round(r() * 80 / 2) * 2, diff, announcedAt: weightsAt } : null;

  let paddock: HorseProDetail["paddock"] = null;
  let paddockAdj = 0;
  if (paddockDone && !e.scratched) {
    const g = r();
    const grade: PaddockGrade = g > 0.88 ? "S" : g > 0.6 ? "A" : g > 0.22 ? "B" : "C";
    paddockAdj = { S: 2.5, A: 1, B: 0, C: -2 }[grade];
    const pts = [...PADDOCK_POINTS].sort(() => r() - 0.5).slice(0, 2);
    paddock = { grade, points: pts, comment: grade === "S" || grade === "A" ? "好気配。状態面の不安はない。" : grade === "B" ? "平常の気配。" : "やや気になる点がある。", at: paddockAt };
  }
  // 当日補正: 馬場適性 + 馬体重増減 + パドック
  const trackAdj = (bd.aptitude - 65) / 20;
  const weightAdj = bodyWeight ? (Math.abs(bodyWeight.diff) >= 10 ? -1.2 : bodyWeight.diff >= 4 ? 0.4 : 0) : 0;
  const live = round1(pre + (weightsAnnounced ? trackAdj + weightAdj : 0) + paddockAdj);

  const tone: StableTone = bd.stable >= 82 ? "強気" : bd.stable >= 68 ? "前向き" : bd.stable >= 52 ? "平常" : "慎重";
  const styleRoll = (bd.pace + r() * 40) / 140;
  const style: RunningStyle = styleRoll > 0.78 ? "逃げ" : styleRoll > 0.6 ? "先行" : styleRoll > 0.4 ? "差し" : "追込";
  const n = race.fieldSize;
  const early = style === "逃げ" ? 1 + Math.floor(r() * 2) : style === "先行" ? 2 + Math.floor(r() * 4) : style === "差し" ? Math.ceil(n * 0.45) + Math.floor(r() * 4) : n - Math.floor(r() * 3);
  const starts = 20 + Math.floor(r() * 120);
  const rides = 15 + Math.floor(r() * 140);
  const combo = Math.floor(r() * 6);
  const t1 = (51 + r() * 4).toFixed(1);
  const t2 = (37 + r() * 2).toFixed(1);
  const t3 = (11.6 + r() * 1).toFixed(1);

  return {
    horseNo: e.horseNo,
    frame: e.frame,
    name: e.name,
    sexAge: `${e.sex}${e.age}`,
    jockeyName: e.jockey,
    weightCarried: e.weight,
    scratched: !!e.scratched,
    bodyWeight,
    paddock,
    pre,
    live,
    factors: bd,
    factorNotes: Object.fromEntries((Object.keys(bd) as IndexFactor[]).map((k) => [k, factorNote(k, bd[k])])) as Record<IndexFactor, string>,
    stable: {
      aiIndex: bd.stable,
      tone,
      trainer: pick(r, TRAINERS),
      comment: pick(r, STABLE_COMMENTS[tone]),
      highlights: [
        tone === "強気" || tone === "前向き" ? "仕上がりに自信" : "状態面に課題",
        bd.workout >= 75 ? "追い切り好内容" : "追い切りは平凡",
        bd.aptitude >= 75 ? "条件好転" : "条件は据え置き",
      ],
    },
    pedigree: {
      sire: e.sire,
      sireLine: SIRE_LINES[e.sire] ?? "その他",
      damSire: e.damSire,
      damSireLine: pick(r, DAMSIRE_LINES),
      distanceFit: `${Math.max(1000, race.distance - 400 + Math.round(r() * 2) * 200)}-${race.distance + Math.round(r() * 2) * 200}m`,
      surfaceFit: { turf: fit(race.surface === "turf" ? bd.pedigree : bd.pedigree - 15), dirt: fit(race.surface === "dirt" ? bd.pedigree : bd.pedigree - 15) },
      goingFit: { firm: fit(bd.pedigree + 5), soft: fit(bd.aptitude - 5 + r() * 10) },
      nick: bd.pedigree >= 78 ? "父×母父の組み合わせは当コースで好成績" : bd.pedigree >= 60 ? "配合面は標準的" : "当条件での実績が少ない配合",
      sireCourseStats: { starts, wins: Math.round(starts * (0.05 + bd.pedigree / 1000)), top3: Math.round(starts * (0.18 + bd.pedigree / 600)) },
    },
    jockey: {
      name: e.jockey,
      courseStats: { rides, wins: Math.round(rides * (0.04 + bd.jockey / 900)), top3: Math.round(rides * (0.15 + bd.jockey / 450)) },
      withHorse: { rides: combo, wins: Math.min(combo, Math.floor(r() * 3)) },
      note: combo >= 3 ? "継続騎乗で手の内に入れている" : combo === 0 ? "初騎乗" : "騎乗経験あり",
    },
    pace: {
      style,
      expectedEarly: Math.min(n, Math.max(1, early)),
      expectedLate: Math.min(n, Math.max(1, early - (style === "差し" || style === "追込" ? 3 + Math.floor(r() * 4) : Math.floor(r() * 2)))),
      note: style === "逃げ" ? "ハナを主張する可能性が高い" : style === "先行" ? "好位で流れに乗れる" : style === "差し" ? "中団から末脚勝負" : "後方待機から一発を狙う",
    },
    workout: {
      date: "11/25(水)",
      course: pick(r, COURSES),
      time: `${t1}-${t2}-${t3}`,
      rating: bd.workout >= 85 ? "S" : bd.workout >= 72 ? "A" : bd.workout >= 58 ? "B" : "C",
      partner: r() < 0.5 ? `${pick(r, ["古馬2勝", "3歳1勝", "古馬OP"])}と併入` : null,
      note: bd.workout >= 72 ? "終いの伸びが目立つ" : "馬なりで調整程度",
    },
  };
}

function phaseOf(race: RaceSummary, now: string) {
  const weightsAnnouncedAt = jst(race.date, shiftTime(race.postTime, -70));
  const paddockAt = jst(race.date, shiftTime(race.postTime, -30));
  return {
    weightsAnnouncedAt,
    weightsAnnounced: before(weightsAnnouncedAt, now),
    paddockAt,
    paddockDone: before(paddockAt, now),
    closed: race.status === "finished" || before(raceCloseAt(race), now),
  };
}

function computeRace(race: RaceSummary, now: string): ProRaceAnalysis | null {
  if (race.status !== "analyzed" && race.status !== "finished") return null;
  const { entries, breakdowns } = buildEntries(race);
  const phase = phaseOf(race, now);
  const raw = entries.map((e) => buildHorse(race, e, breakdowns[e.horseId], now, phase.weightsAnnouncedAt, phase.paddockAt));
  const live = raw.filter((h) => !h.scratched);
  const rankBy = (key: "pre" | "live") => new Map([...live].sort((a, b) => b[key] - a[key]).map((h, i) => [h.horseNo, i + 1]));
  const rp = rankBy("pre");
  const rl = rankBy("live");
  const horses: HorseProDetail[] = raw
    .map(({ pre, live: lv, ...rest }) => ({
      ...rest,
      index: { pre, live: lv, delta: round1(lv - pre), rankPre: rp.get(rest.horseNo) ?? 0, rankLive: rl.get(rest.horseNo) ?? 0 },
    }))
    .sort((a, b) => (a.scratched ? 1 : 0) - (b.scratched ? 1 : 0) || a.index.rankLive - b.index.rankLive);

  const leaders = horses.filter((h) => !h.scratched && (h.pace.style === "逃げ" || h.pace.style === "先行")).map((h) => h.horseNo);
  const nige = horses.filter((h) => !h.scratched && h.pace.style === "逃げ").length;
  const pace = nige >= 3 ? "ハイ" : nige === 0 ? "スロー" : "ミドル";
  const day = DEMO_MEETINGS.find((m) => m.date === race.date);
  const isRaceDay = day && race.date === now.slice(0, 10);
  const track = isRaceDay ? buildTrackLive(race.date, race.venue.code, race.venue.name, now) : null;
  const label = `${race.venue.name}${race.raceNo}R`;
  const updates: LiveUpdate[] = [];
  if (phase.weightsAnnounced) updates.push({ id: `${race.id}:w`, at: phase.weightsAnnouncedAt, kind: "weight", venueName: race.venue.name, raceId: race.id, raceLabel: label, title: "馬体重 発表", detail: "全馬の馬体重を反映し、指数を再計算しました。" });
  if (phase.paddockDone) updates.push({ id: `${race.id}:p`, at: phase.paddockAt, kind: "paddock", venueName: race.venue.name, raceId: race.id, raceLabel: label, title: "パドック評価 反映", detail: `S評価: ${horses.filter((h) => h.paddock?.grade === "S").map((h) => h.horseNo).join("・") || "なし"}` });
  for (const h of horses.filter((x) => x.scratched)) updates.push({ id: `${race.id}:s${h.horseNo}`, at: jst(race.date, "08:10"), kind: "scratch", venueName: race.venue.name, raceId: race.id, raceLabel: label, title: `${h.horseNo}番 ${h.name} 出走取消`, detail: "取消馬を除外して指数・買い目を再計算しました。" });
  const fin = isPredictionTarget(race) ? getCurrentPublished(race, "FINAL", now) : null;
  if (fin?.publishedAt) updates.push({ id: `${race.id}:f`, at: fin.publishedAt, kind: "final_published", venueName: race.venue.name, raceId: race.id, raceLabel: label, title: "最終買い目 公開", detail: `v${fin.version} を公開しました。` });
  updates.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return {
    raceId: race.id,
    updatedAt: updates[0]?.at ?? track?.updatedAt ?? jst(race.date, "07:30"),
    phase,
    track,
    paceForecast: {
      pace,
      leaders,
      comment: pace === "ハイ" ? "逃げ候補が複数。前半から流れが速くなり、差し馬に展開が向く想定。" : pace === "スロー" ? "明確な逃げ馬が不在。先行有利の上がり勝負を想定。" : "平均的な流れ。好位の馬と末脚のある馬の比較。",
    },
    horses,
    updates,
  };
}

// ---------------------------------------------------------------- 公開関数 (権限判定つき)

export async function getProRaceAnalysis(raceId: string, viewer: Viewer, now: string): Promise<Gated<ProRaceAnalysis | null> | null> {
  const race = await getRace(raceId);
  if (!race) return null;
  if (!isProActive(viewer, now)) return { locked: true };
  return { locked: false, data: computeRace(race, now) };
}

export async function getProLounge(viewer: Viewer, now: string): Promise<Gated<ProLounge>> {
  if (!isProActive(viewer, now)) return { locked: true };
  const date = now.slice(0, 10);
  const day = DEMO_MEETINGS.find((m) => m.date === date);
  const tracks = day ? day.venues.map((v) => buildTrackLive(date, v.code, v.name, now)) : [];
  const races = (await getRacesOfDay(date)).filter(isPredictionTarget);
  const analyses = races.map((r) => ({ race: r, a: computeRace(r, now) }));

  const updates: LiveUpdate[] = analyses.flatMap((x) => x.a?.updates ?? []);
  for (const t of tracks) updates.push({ id: `track:${t.venueCode}`, at: t.updatedAt, kind: "track", venueName: t.venueName, title: `${t.venueName} 馬場状態更新`, detail: `芝 ${t.turf.condition}（含水率${t.turf.moistureGoal}%・クッション値${t.turf.cushion}）／ダート ${t.dirt.condition}（含水率${t.dirt.moistureGoal}%）` });
  updates.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return {
    locked: false,
    data: {
      date,
      now,
      tracks,
      updates: updates.filter((u) => before(u.at, now)).slice(0, 30),
      races: analyses
        .filter((x) => x.a)
        .map(({ race, a }) => ({
          raceId: race.id,
          venueName: race.venue.name,
          raceNo: race.raceNo,
          name: race.name,
          grade: race.grade,
          surface: race.surface,
          distance: race.distance,
          postTime: race.postTime,
          status: (a!.phase.closed ? "closed" : a!.phase.paddockDone ? "paddock" : a!.phase.weightsAnnounced ? "weights" : "upcoming") as ProLounge["races"][number]["status"],
          finalPublished: !!getCurrentPublished(race, "FINAL", now),
          topLive: a!.horses.filter((h) => !h.scratched).slice(0, 3).map((h) => ({ horseNo: h.horseNo, name: h.name, live: h.index.live, delta: h.index.delta })),
        }))
        .sort((x, y) => x.postTime.localeCompare(y.postTime) || x.venueName.localeCompare(y.venueName)),
    },
  };
}
