import clsx from "clsx";
import type { ReactNode } from "react";
import { ChevronDown, Quote } from "lucide-react";
import type { IndexFactor } from "@/lib/types";
import type { HorseProDetail, ProRaceAnalysis, StableTone } from "@/lib/pro/types";
import { INDEX_FACTOR_LABELS, INDEX_FACTOR_ORDER, INDEX_WEIGHTS } from "@/lib/scoring";
import { SectionHeading } from "@/components/ui";
import { HorseNoBox } from "@/components/race/parts";
import { HorseshoeGauge } from "@/components/brand/HorseshoeGauge";
import { HorseCardShell, HorseDetailTabs } from "./HorseCardShell";
import { GradeChip } from "./LiveIndexBoard";
import { deltaClass, jstHM, pct, signed } from "./format";

/** 04 馬別 詳細分析 */
export function HorseDetailList({ a }: { a: ProRaceAnalysis }) {
  return (
    <section aria-labelledby="pro-horses-title">
      <SectionHeading id="pro-horses-title" index="04" en="HORSE ANALYSIS" title="馬別 詳細分析" pro />
      <p className="mb-3 text-[12.5px] leading-relaxed text-ink-2">
        当日指数順。各馬を開くと、指数内訳・当日情報・陣営AI・血統・騎手・追い切り・展開を確認できます。
      </p>
      <ol className="flex flex-col gap-2.5">
        {a.horses.map((h, i) => (
          <li key={h.horseNo}>
            {h.scratched ? <ScratchedRow h={h} /> : <HorseCard h={h} a={a} openOnDesktop={i < 3} />}
          </li>
        ))}
      </ol>
    </section>
  );
}

function ScratchedRow({ h }: { h: HorseProDetail }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-surface-2/60 px-3.5 py-3 text-ink-2 sm:px-4">
      <span className="w-8 text-center text-[11px]">—</span>
      <HorseNoBox no={h.horseNo} frame={h.frame} size="sm" muted />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold line-through">{h.name}</span>
      <span className="rounded-full border border-danger/30 bg-danger-bg px-2 py-[1px] text-[11.5px] font-semibold text-danger">出走取消</span>
    </div>
  );
}

const TONE_STYLE: Record<StableTone, string> = {
  強気: "border-gold/70 text-gold-ink",
  前向き: "border-accent-silver/60 text-ink",
  平常: "border-line text-ink-2",
  慎重: "border-warn/40 text-warn",
};

function ToneChip({ tone }: { tone: StableTone }) {
  return <span className={clsx("inline-flex items-center rounded-full border bg-surface px-2 py-[1px] text-[11px] font-semibold", TONE_STYLE[tone])}>陣営 {tone}</span>;
}

function HorseCard({ h, a, openOnDesktop }: { h: HorseProDetail; a: ProRaceAnalysis; openOnDesktop: boolean }) {
  const first = h.index.rankLive === 1;
  const pending = !a.phase.weightsAnnounced;
  const summary = (
    <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 [&::-webkit-details-marker]:hidden">
      <span className="flex w-8 shrink-0 flex-col items-center leading-none">
        <span className={clsx("num text-[24px] font-extralight tracking-[-0.05em]", first ? "text-gold-ink" : "text-ink")}>{h.index.rankLive}</span>
        <span className="mt-0.5 text-[11px] text-ink-2">位</span>
      </span>
      <HorseNoBox no={h.horseNo} frame={h.frame} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold leading-tight text-ink">{h.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-2">
          <span className="whitespace-nowrap">
            {h.sexAge}・{h.jockeyName}
          </span>
          <span className="hidden sm:inline">
            ・<span className="num">{h.weightCarried}</span>kg
          </span>
          <ToneChip tone={h.stable.tone} />
          <span className="rounded-full border border-line bg-surface px-2 py-[1px] text-[11px] font-semibold text-ink-2">{h.pace.style}</span>
          {h.paddock && <GradeChip grade={h.paddock.grade} size="sm" />}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="num block text-[20px] font-semibold leading-none text-ink">{h.index.live.toFixed(1)}</span>
        <span className={clsx("num mt-1 block text-[11.5px] font-semibold leading-none", deltaClass(h.index.delta))}>{pending ? "" : signed(h.index.delta)}</span>
      </span>
      <ChevronDown size={18} strokeWidth={1.6} className="shrink-0 text-accent-silver transition-transform group-open:rotate-180" aria-hidden />
    </summary>
  );

  const panels: { id: string; col: 0 | 1 | 2; label: string; node: ReactNode }[] = [
    { id: "factors", col: 0, label: "指数内訳", node: <FactorsPanel h={h} /> },
    { id: "day", col: 1, label: "当日", node: <DayPanel h={h} a={a} /> },
    { id: "stable", col: 1, label: "陣営AI", node: <StablePanel h={h} /> },
    { id: "pedigree", col: 2, label: "血統", node: <PedigreePanel h={h} /> },
    { id: "jockey", col: 2, label: "騎手", node: <JockeyPanel h={h} /> },
    { id: "workout", col: 1, label: "追い切り", node: <WorkoutPanel h={h} /> },
    { id: "pace", col: 2, label: "展開", node: <PacePanel h={h} /> },
  ];

  return (
    <HorseCardShell
      openOnDesktop={openOnDesktop}
      summary={summary}
      className={clsx(
        "overflow-hidden rounded-[var(--radius-card)] border bg-surface shadow-[var(--shadow-card)] open:border-silver",
        first ? "edge-silver edge-gold border-line" : "border-line",
      )}
    >
      <div className="border-t border-line bg-surface-2/40 px-3 pt-3 pb-1 sm:px-4 lg:pb-3">
        <HorseDetailTabs panels={panels} />
      </div>
    </HorseCardShell>
  );
}

/* ---------------- panels ---------------- */
function Panel({ en, title, children, demo = false }: { en: string; title: string; children: ReactNode; demo?: boolean }) {
  return (
    <div className="mb-2 rounded-[12px] border border-line bg-surface px-3.5 py-3 lg:mb-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="flex items-baseline gap-1.5">
          <span className="text-[13.5px] font-bold text-ink">{title}</span>
          <span className="num text-[11px] font-semibold tracking-[0.14em] text-accent-silver">{en}</span>
        </p>
        {demo && <span className="text-[11px] font-medium text-warn">DEMO・架空</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
      <dt className="shrink-0 text-[12px] text-ink-2">{k}</dt>
      <dd className="min-w-0 text-right text-[13.5px] text-ink">{children}</dd>
    </div>
  );
}

function FactorsPanel({ h }: { h: HorseProDetail }) {
  return (
    <Panel en="BREAKDOWN" title="指数内訳">
      <ul className="space-y-2">
        {INDEX_FACTOR_ORDER.map((f: IndexFactor) => {
          const v = Math.round(h.factors[f]);
          const note = h.factorNotes[f]?.split("：")[1] ?? "";
          return (
            <li key={f}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-ink">
                  {INDEX_FACTOR_LABELS[f]}
                  <span className="num ml-1 text-[11px] font-normal text-ink-2">{Math.round(INDEX_WEIGHTS[f] * 100)}%</span>
                </span>
                <span className="num text-[13.5px] font-semibold text-ink">{v}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-silver-surface" aria-hidden>
                <div className={clsx("h-full rounded-full", v >= 80 ? "bg-charcoal" : "bg-accent-silver")} style={{ width: `${Math.max(2, Math.min(100, v))}%` }} />
              </div>
              {note && <p className="mt-0.5 text-[11.5px] leading-snug text-ink-2">{note}</p>}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function DayPanel({ h, a }: { h: HorseProDetail; a: ProRaceAnalysis }) {
  const pending = !a.phase.weightsAnnounced;
  return (
    <Panel en="RACE DAY" title="当日情報" demo>
      <dl>
        <Row k="前日 → 当日指数">
          <span className="num">{h.index.pre.toFixed(1)}</span>
          <span className="mx-1 text-silver">→</span>
          <span className="num font-semibold">{h.index.live.toFixed(1)}</span>
          <span className={clsx("num ml-1.5 text-[12px] font-semibold", deltaClass(h.index.delta))}>{pending ? "" : signed(h.index.delta)}</span>
        </Row>
        <Row k="順位">
          <span className="num">{h.index.rankPre}</span>位<span className="mx-1 text-silver">→</span>
          <span className="num font-semibold">{h.index.rankLive}</span>位
        </Row>
        <Row k="馬体重">
          {h.bodyWeight ? (
            <>
              <span className="num font-semibold">{h.bodyWeight.value}</span>kg
              <span className={clsx("num ml-1 text-[12px] font-semibold", Math.abs(h.bodyWeight.diff) >= 10 ? "text-warn" : "text-ink-2")}>
                ({h.bodyWeight.diff > 0 ? `+${h.bodyWeight.diff}` : h.bodyWeight.diff < 0 ? `−${-h.bodyWeight.diff}` : "±0"})
              </span>
            </>
          ) : (
            <span className="text-ink-2">
              発表前（<span className="num">{jstHM(a.phase.weightsAnnouncedAt)}</span>頃）
            </span>
          )}
        </Row>
      </dl>
      <div className="mt-2.5 rounded-[10px] border border-line px-3 py-2.5">
        <p className="flex items-center justify-between text-[12px] font-semibold text-ink-2">
          パドック評価
          {h.paddock && (
            <span className="num text-[11px] font-normal">{jstHM(h.paddock.at)} 評価</span>
          )}
        </p>
        {h.paddock ? (
          <div className="mt-1.5 flex items-start gap-2.5">
            <GradeChip grade={h.paddock.grade} />
            <div className="min-w-0">
              <p className="text-[13.5px] leading-snug text-ink">{h.paddock.comment}</p>
              <p className="mt-1 flex flex-wrap gap-1">
                {h.paddock.points.map((p) => (
                  <span key={p} className="rounded-full bg-surface-2 px-2 py-[1px] text-[11.5px] text-ink-2">
                    {p}
                  </span>
                ))}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-[13px] text-ink-2">
            <span className="num">{jstHM(a.phase.paddockAt)}</span> 頃に評価を反映します。
          </p>
        )}
      </div>
    </Panel>
  );
}

function StablePanel({ h }: { h: HorseProDetail }) {
  const s = h.stable;
  return (
    <Panel en="STABLE AI" title="陣営AI指数" demo>
      <div className="flex items-center gap-3">
        <HorseshoeGauge score={s.aiIndex} size={72} label="STABLE" highlight={s.aiIndex >= 80} />
        <div className="min-w-0">
          <ToneChip tone={s.tone} />
          <p className="mt-1.5 text-[12px] text-ink-2">
            調教師 <span className="font-semibold text-ink">{s.trainer}</span>
          </p>
        </div>
      </div>
      <blockquote className="relative mt-2.5 rounded-[10px] border-l-2 border-gold bg-surface-2/70 py-2 pr-3 pl-7 text-[13.5px] leading-relaxed text-ink">
        <Quote size={12} strokeWidth={1.8} className="absolute top-2.5 left-2.5 text-gold" aria-hidden />
        {s.comment}
      </blockquote>
      <p className="mt-2 text-[11px] font-semibold tracking-[0.1em] text-accent-silver">AI 抽出ポイント</p>
      <ul className="mt-1 flex flex-wrap gap-1">
        {s.highlights.map((x) => (
          <li key={x} className="rounded-full border border-line px-2 py-[1px] text-[12px] text-ink">
            {x}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function FitMark({ m }: { m: string }) {
  return <span className={clsx("text-[15px] font-bold", m === "◎" ? "text-gold-ink" : m === "×" ? "text-ink-2" : "text-ink")}>{m}</span>;
}

function PedigreePanel({ h }: { h: HorseProDetail }) {
  const p = h.pedigree;
  const s = p.sireCourseStats;
  return (
    <Panel en="PEDIGREE" title="血統">
      <dl>
        <Row k="父">
          <span className="font-semibold">{p.sire}</span>
          <span className="ml-1.5 text-[12px] text-ink-2">{p.sireLine}</span>
        </Row>
        <Row k="母父">
          <span className="font-semibold">{p.damSire}</span>
          <span className="ml-1.5 text-[12px] text-ink-2">{p.damSireLine}</span>
        </Row>
        <Row k="距離適性">
          <span className="num">{p.distanceFit}</span>
        </Row>
      </dl>
      <table className="mt-2 w-full table-fixed border-collapse text-center">
        <thead>
          <tr className="text-[11px] text-ink-2">
            {["芝", "ダート", "良", "道悪"].map((x) => (
              <th key={x} scope="col" className="border border-line bg-surface-2 py-1 font-semibold">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {[p.surfaceFit.turf, p.surfaceFit.dirt, p.goingFit.firm, p.goingFit.soft].map((m, i) => (
              <td key={i} className="border border-line py-1">
                <FitMark m={m} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink">{p.nick}</p>
      <div className="mt-2 rounded-[10px] bg-surface-2/70 px-3 py-2">
        <p className="text-[11.5px] text-ink-2">父産駒 当該コース成績</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-3 text-[12px] text-ink-2">
          <span>
            <span className="num font-semibold text-ink">{s.starts}</span>走
          </span>
          <span>
            勝率 <span className="num font-semibold text-ink">{pct(s.wins, s.starts)}</span>
          </span>
          <span>
            複勝率 <span className="num font-semibold text-ink">{pct(s.top3, s.starts)}</span>
          </span>
        </p>
      </div>
    </Panel>
  );
}

function RateBar({ label, part, total }: { label: string; part: number; total: number }) {
  const r = total > 0 ? part / total : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px]">
        <span className="text-ink-2">{label}</span>
        <span className="num font-semibold text-ink">{pct(part, total)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-silver-surface" aria-hidden>
        <div className="h-full rounded-full bg-accent-silver" style={{ width: `${Math.min(100, r * 100)}%` }} />
      </div>
    </div>
  );
}

function JockeyPanel({ h }: { h: HorseProDetail }) {
  const j = h.jockey;
  return (
    <Panel en="JOCKEY" title="騎手">
      <p className="text-[14px] font-bold text-ink">{j.name}</p>
      <p className="mt-0.5 text-[11.5px] text-ink-2">
        当該コース <span className="num">{j.courseStats.rides}</span>騎乗 <span className="num">{j.courseStats.wins}</span>勝
      </p>
      <div className="mt-2 space-y-2">
        <RateBar label="勝率" part={j.courseStats.wins} total={j.courseStats.rides} />
        <RateBar label="複勝率" part={j.courseStats.top3} total={j.courseStats.rides} />
      </div>
      <dl className="mt-2">
        <Row k="この馬とのコンビ">
          {j.withHorse.rides === 0 ? (
            "初騎乗"
          ) : (
            <>
              <span className="num">{j.withHorse.rides}</span>戦<span className="num">{j.withHorse.wins}</span>勝
            </>
          )}
        </Row>
      </dl>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{j.note}</p>
    </Panel>
  );
}

function WorkoutPanel({ h }: { h: HorseProDetail }) {
  const w = h.workout;
  const splits = w.time.split("-");
  const labels = splits.length === 3 ? ["4F", "3F", "1F"] : splits.map((_, i) => `${splits.length - i}`);
  return (
    <Panel en="WORKOUT" title="最終追い切り">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] text-ink-2">
          <span className="num">{w.date}</span>
          <span className="ml-1.5 font-semibold text-ink">{w.course}</span>
        </p>
        <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-2">
          評価
          <span className={clsx("num inline-flex h-6 min-w-6 items-center justify-center rounded-[5px] border px-1.5 text-[13px] font-bold", w.rating === "S" ? "border-gold text-gold-ink" : "border-line text-ink")}>
            {w.rating}
          </span>
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
        {splits.map((t, i) => (
          <div key={i} className="bg-surface px-2 py-1.5 text-center">
            <p className="num text-[11px] font-semibold text-accent-silver">{labels[i]}</p>
            <p className="num text-[16px] font-semibold text-ink">{t}</p>
          </div>
        ))}
      </div>
      <dl className="mt-1.5">
        <Row k="併せ馬">{w.partner ?? "単走"}</Row>
      </dl>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{w.note}</p>
    </Panel>
  );
}

function PacePanel({ h }: { h: HorseProDetail }) {
  const p = h.pace;
  return (
    <Panel en="PACE" title="展開">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-silver bg-silver-surface px-2.5 py-[2px] text-[12.5px] font-bold text-ink">{p.style}</span>
        <span className="text-[13px] text-ink-2">
          序盤 <span className="num font-semibold text-ink">{p.expectedEarly}</span>番手
          <span className="mx-1 text-silver">→</span>
          4角 <span className="num font-semibold text-ink">{p.expectedLate}</span>番手
        </span>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink">{p.note}</p>
    </Panel>
  );
}
