"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Info } from "lucide-react";
import type { Entry, IndexMeta, PublicIndex, RaceStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { FrameBadge, SectionHeading } from "@/components/ui";
import { UnicoScore } from "./UnicoScore";
import { IndexPodium } from "./IndexPodium";
import { HorseNoBox, RankMark, Readout, scoreStats, type ScoreStats } from "./parts";

type SortKey = "index" | "horseNo" | "popularity";

interface Row {
  entry: Entry;
  idx?: PublicIndex;
}

/** 指数ランキング (PC: テーブル / スマホ: 行カード) */
export function HorseRanking({
  entries,
  index,
  indexMeta,
  status,
}: {
  entries: Entry[];
  index: PublicIndex[] | null;
  indexMeta: IndexMeta | null;
  status: RaceStatus;
}) {
  const hasIndex = !!index && index.length > 0;
  const hasPopularity = entries.some((e) => !e.scratched && e.popularity !== undefined);
  const [sort, setSort] = useState<SortKey>(hasIndex ? "index" : "horseNo");
  const stats = useMemo(() => scoreStats(index), [index]);

  const rows = useMemo(() => {
    const byId = new Map(index?.map((i) => [i.horseId, i]) ?? []);
    const all: Row[] = entries.map((entry) => ({ entry, idx: byId.get(entry.horseId) }));
    const live = all.filter((r) => !r.entry.scratched);
    const scratched = all.filter((r) => r.entry.scratched).sort((a, b) => a.entry.horseNo - b.entry.horseNo);
    live.sort((a, b) => {
      if (sort === "index" && a.idx && b.idx) return a.idx.rank - b.idx.rank;
      if (sort === "popularity" && a.entry.popularity && b.entry.popularity) return a.entry.popularity - b.entry.popularity;
      return a.entry.horseNo - b.entry.horseNo;
    });
    return [...live, ...scratched];
  }, [entries, index, sort]);

  const tabs: { key: SortKey; label: string; disabled: boolean; reason?: string }[] = [
    { key: "index", label: "指数順", disabled: !hasIndex, reason: "指数の分析完了後に利用できます" },
    { key: "horseNo", label: "馬番順", disabled: false },
    { key: "popularity", label: "人気順", disabled: !hasPopularity, reason: "オッズ発表後に利用できます" },
  ];
  const disabledReasons = tabs.filter((t) => t.disabled && t.reason);
  const liveCount = entries.filter((e) => !e.scratched).length;

  return (
    <section aria-labelledby="ranking-title">
      <SectionHeading id="ranking-title" index="01" en="UNICO INDEX RANKING" title={hasIndex ? "UNICO指数ランキング" : "出走馬一覧"} />

      {/* 上位3頭 (総合指数のみ) */}
      {hasIndex && index && (
        <div className="mb-5">
          <IndexPodium entries={entries} index={index} />
        </div>
      )}

      {/* 状態ノート */}
      {status === "analyzing" && (
        <Notice tone="info" en="ANALYZING">
          出走馬は確定しています。UNICO指数は分析完了後に表示されます。
        </Notice>
      )}
      {status === "finished" && hasIndex && (
        <Notice tone="silver" en="FINISHED">
          レース終了。表示中の指数はレース前に算出したものです。
        </Notice>
      )}

      {/* 並び替え */}
      <div className="mb-2.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <p className="num mt-3 hidden text-[11px] font-semibold tracking-[0.16em] text-accent-silver sm:block">
          ALL RUNNERS<span className="mx-1.5 text-silver">/</span>
          <span className="text-ink">{liveCount}</span>
        </p>
        <div className="w-full sm:w-auto">
          <div role="tablist" aria-label="並び替え" className="flex rounded-full border border-line bg-surface p-[3px] shadow-[var(--shadow-card)]">
            {tabs.map((t) => {
              const active = sort === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-disabled={t.disabled || undefined}
                  disabled={t.disabled}
                  title={t.disabled ? t.reason : undefined}
                  onClick={() => setSort(t.key)}
                  className={clsx(
                    "h-8 flex-1 rounded-full px-4 text-[13px] font-semibold transition-colors sm:flex-none",
                    active && "bg-charcoal text-white",
                    !active && !t.disabled && "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    t.disabled && "cursor-not-allowed text-silver",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          {disabledReasons.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-[11.5px] leading-snug text-ink-2 sm:text-right">
              {disabledReasons.map((t) => (
                <li key={t.key}>
                  {t.label}は{t.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="edge-silver overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
        {/* 指数サマリー (計器の読み取り値 + 分布目盛り) */}
        {stats && index && <IndexReadout stats={stats} index={index} entries={entries} liveCount={liveCount} />}

        <DesktopTable rows={rows} stats={stats} hasPopularity={hasPopularity} hasIndex={hasIndex} />
        <MobileList rows={rows} stats={stats} hasPopularity={hasPopularity} hasIndex={hasIndex} />
      </div>

      {/* 指数メタ */}
      <div className="mt-2.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-1 text-[11.5px] leading-relaxed text-ink-2">
        <p className="flex items-start gap-1">
          <Info size={13} strokeWidth={1.8} className="mt-[2px] shrink-0 text-accent-silver" aria-hidden />
          <span>UNICO指数はレース内の相対評価です。勝率や的中を示すものではありません。</span>
        </p>
        {indexMeta && (
          <p className="num shrink-0">
            指数 {indexMeta.version}・更新 {formatDateTime(indexMeta.computedAt)}
          </p>
        )}
      </div>
    </section>
  );
}

/** 指数の読み取り値 + レース内分布 (各馬の指数位置を目盛りで示す) */
function IndexReadout({
  stats,
  index,
  entries,
  liveCount,
}: {
  stats: ScoreStats;
  index: PublicIndex[];
  entries: Entry[];
  liveCount: number;
}) {
  const byId = new Map(entries.map((e) => [e.horseId, e]));
  const lo = Math.floor(stats.min / 5) * 5;
  const hi = Math.ceil(stats.max / 5) * 5;
  const x = (v: number) => (hi === lo ? 100 : ((v - lo) / (hi - lo)) * 100);
  const marks = index.flatMap((i) => {
    const e = byId.get(i.horseId);
    return e && !e.scratched ? [{ i, e }] : [];
  });
  // 上位3頭のラベル: 近接する場合は段をずらして重ならないようにする (貪欲法で最大3段)
  const lastX: number[] = [];
  const top3 = marks
    .filter((m) => m.i.rank <= 3)
    .sort((p, q) => p.i.score - q.i.score)
    .map((m) => {
      const px = x(m.i.score);
      let row = lastX.findIndex((lx) => px - lx >= 13);
      if (row < 0) row = lastX.length;
      lastX[row] = px;
      return { ...m, row };
    });
  const cell = "bg-surface/75 px-3.5 py-2.5 sm:px-4";
  return (
    <div className="brushed border-b border-line">
      <dl className="grid grid-cols-4 gap-px bg-line/70 lg:grid-cols-[repeat(4,minmax(0,0.8fr))_minmax(0,2.6fr)]">
        <Readout en="RUNNERS" ja="出走" className={cell}>
          <span className="num text-[18px] font-light leading-none">{liveCount}</span>
          <span className="ml-0.5 text-[11.5px] text-ink-2">頭</span>
        </Readout>
        <Readout en="HIGH" ja="最高" className={cell}>
          <span className="num text-[18px] font-semibold leading-none">{stats.max.toFixed(1)}</span>
        </Readout>
        <Readout en="AVG" ja="平均" className={cell}>
          <span className="num inline-flex items-center gap-1.5 text-[18px] font-light leading-none">
            <span aria-hidden className="inline-block h-3 w-px bg-ink-2/60" />
            {stats.avg.toFixed(1)}
          </span>
        </Readout>
        <Readout en="LOW" ja="最低" className={cell}>
          <span className="num text-[18px] font-light leading-none">{stats.min.toFixed(1)}</span>
        </Readout>
        {/* 分布 */}
        <div className={clsx(cell, "col-span-4 lg:col-span-1")}>
          <p className="num flex justify-between text-[11px] font-semibold tracking-[0.16em] text-accent-silver">
            <span>INDEX SPREAD</span>
            <span className="font-normal tracking-normal text-ink-2">
              {lo}–{hi}
            </span>
          </p>
          <div className="relative mx-2.5 mt-1" style={{ height: 30 + Math.max(0, lastX.length - 1) * 14 }} aria-hidden>
            <span className="absolute inset-x-0 bottom-[6px] h-px bg-silver" />
            {[0, 25, 50, 75, 100].map((t) => (
              <span key={t} className="absolute bottom-[3px] h-[7px] w-px bg-silver" style={{ left: `${t}%` }} />
            ))}
            <span className="absolute bottom-[1px] h-[17px] w-px bg-ink-2/50" style={{ left: `${x(stats.avg)}%` }} />
            {marks.map(({ i }) => (
              <span
                key={i.horseId}
                className={clsx(
                  "absolute bottom-[6px] h-[9px] w-[2px] -translate-x-1/2 rounded-full",
                  i.rank === 1 ? "bg-gold" : i.rank <= 3 ? "bg-ink" : "bg-accent-silver/70",
                )}
                style={{ left: `${x(i.score)}%` }}
              />
            ))}
            {top3.map(({ i, e, row }) => (
              <span
                key={`l-${i.horseId}`}
                className={clsx(
                  "num absolute -translate-x-1/2 rounded-[4px] border bg-surface px-[3px] text-[11px] font-bold leading-[13px] text-ink",
                  i.rank === 1 ? "border-gold" : "border-silver",
                )}
                style={{ left: `${x(i.score)}%`, top: (lastX.length - 1 - row) * 14 }}
              >
                {e.horseNo}
              </span>
            ))}
          </div>
        </div>
      </dl>
    </div>
  );
}

function Notice({ tone, en, children }: { tone: "info" | "silver"; en: string; children: React.ReactNode }) {
  return (
    <p
      className={clsx(
        "mb-3 flex items-start gap-2.5 rounded-[10px] border bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed",
        tone === "info" ? "border-info/25 text-info" : "border-silver/70 text-ink-2",
      )}
    >
      <span
        className={clsx(
          "num mt-[2px] shrink-0 rounded-[4px] border px-1.5 text-[11px] font-semibold leading-[17px] tracking-[0.12em]",
          tone === "info" ? "border-info/30 bg-info-bg" : "border-silver bg-silver-surface",
        )}
      >
        {en}
      </span>
      <span>{children}</span>
    </p>
  );
}

/** 上位3頭の控えめなヘアライン */
function topLine(rank?: number) {
  if (rank === 1) return "shadow-[inset_2px_0_0_var(--color-gold)]";
  if (rank === 2 || rank === 3) return "shadow-[inset_2px_0_0_var(--color-silver)]";
  return undefined;
}

interface ListProps {
  rows: Row[];
  stats: ScoreStats | null;
  hasPopularity: boolean;
  hasIndex: boolean;
}

function DesktopTable({ rows, stats, hasPopularity }: ListProps) {
  const th = "px-2 py-2 text-[11.5px] font-semibold tracking-[0.06em] text-accent-silver whitespace-nowrap";
  return (
    <div className="hidden md:block">
      <table className="w-full border-collapse">
        <thead className="bg-surface">
          <tr className="border-b border-line">
            <th scope="col" className={clsx(th, "w-[68px] pl-4 text-left")}>指数順位</th>
            <th scope="col" className={clsx(th, "w-[36px] text-center")}>枠</th>
            <th scope="col" className={clsx(th, "w-[48px] text-center")}>馬番</th>
            <th scope="col" className={clsx(th, "text-left")}>馬名</th>
            <th scope="col" className={clsx(th, "w-[44px] text-center")}>性齢</th>
            <th scope="col" className={clsx(th, "w-[80px] text-left")}>騎手</th>
            <th scope="col" className={clsx(th, "w-[44px] text-right")}>斤量</th>
            <th scope="col" className={clsx(th, "w-[196px] text-left lg:w-[176px] xl:w-[196px]")}>
              <span className="pl-[18px]">UNICO指数</span>
            </th>
            {hasPopularity && (
              <th scope="col" className={clsx(th, "w-[64px] pr-4 text-right")}>
                単勝<span className="text-silver">/</span>人気
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ entry: e, idx }) => {
            const s = e.scratched;
            return (
              <tr
                key={e.horseId}
                className={clsx("border-b border-line last:border-b-0", s ? "bg-surface-2/60" : "hover:bg-surface-2/50", topLine(idx?.rank))}
              >
                <td className="h-[56px] pl-4 pr-2">
                  {idx ? <RankMark rank={idx.rank} /> : <span className="text-[13px] text-silver">—</span>}
                </td>
                <td className="px-2 text-center">
                  <span className={clsx(s && "opacity-50")}>
                    <FrameBadge frame={e.frame} size="sm" />
                  </span>
                </td>
                <td className="px-2 text-center">
                  <HorseNoBox no={e.horseNo} frame={e.frame} size="sm" muted={s} />
                </td>
                <td className="px-2">
                  <span className={clsx("text-[15px] font-bold whitespace-nowrap", s ? "text-ink-2" : "text-ink")}>{e.name}</span>
                </td>
                <td className={clsx("px-2 text-center text-[13px] whitespace-nowrap", s ? "text-ink-2" : "text-ink")}>
                  {e.sex}
                  <span className="num">{e.age}</span>
                </td>
                <td className={clsx("px-2 text-[13px] whitespace-nowrap", s ? "text-ink-2" : "text-ink")}>{e.jockey}</td>
                <td className={clsx("num px-2 text-right text-[13px]", s ? "text-ink-2" : "text-ink")}>{e.weight.toFixed(1)}</td>
                <td className="px-2">
                  {s ? (
                    <ScratchedLabel />
                  ) : idx && stats ? (
                    <UnicoScore score={idx.score} rank={idx.rank} stats={stats} variant="cell" />
                  ) : (
                    <span className="pl-[18px] text-[12.5px] text-ink-2"><Dash /></span>
                  )}
                </td>
                {hasPopularity && (
                  <td className="num pr-4 pl-2 text-right leading-tight">
                    {e.odds !== undefined && e.popularity !== undefined ? (
                      <>
                        <span className="block text-[13.5px] text-ink">{e.odds.toFixed(1)}</span>
                        <span className="block text-[11px] text-ink-2">
                          <span className="font-semibold text-ink">{e.popularity}</span>人気
                        </span>
                      </>
                    ) : (
                      <Dash />
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileList({ rows, stats, hasPopularity, hasIndex }: ListProps) {
  return (
    <ol className="md:hidden">
      {rows.map(({ entry: e, idx }) => {
        const s = e.scratched;
        return (
          <li
            key={e.horseId}
            className={clsx(
              "flex min-h-[70px] items-center gap-2.5 border-b border-line py-2.5 pr-3 pl-3.5 last:border-b-0",
              s && "bg-surface-2/60",
              topLine(idx?.rank),
            )}
          >
            {/* 指数順位 (枠なしの細い大数字 + 位) */}
            {hasIndex && (
              <div className="flex w-[40px] shrink-0 justify-start">
                {idx ? <RankMark rank={idx.rank} /> : <span className="text-[13px] text-silver">—</span>}
              </div>
            )}
            {/* 馬番 (枠付き + 枠色ストリップ) */}
            <HorseNoBox no={e.horseNo} frame={e.frame} muted={s} />
            {/* 馬名・属性 */}
            <div className="min-w-0 flex-1">
              <p className={clsx("text-[15px] font-bold leading-snug break-keep", s ? "text-ink-2" : "text-ink")}>{e.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12.5px] leading-snug text-ink-2">
                <span>
                  {e.sex}
                  <span className="num">{e.age}</span>
                </span>
                <span className="text-silver" aria-hidden>·</span>
                <span className="whitespace-nowrap">{e.jockey}</span>
                <span className="text-silver" aria-hidden>·</span>
                <span className="num">{e.weight.toFixed(1)}</span>
              </p>
              {hasPopularity && !s && (
                <p className="num mt-0.5 text-[12px] leading-snug text-ink-2">
                  {e.odds !== undefined ? (
                    <>
                      単勝 <span className="text-ink">{e.odds.toFixed(1)}</span>
                      <span className="mx-1 text-silver">·</span>
                      <span className="text-ink">{e.popularity}</span>人気
                    </>
                  ) : (
                    "オッズ未発表"
                  )}
                </p>
              )}
            </div>
            {/* 指数 */}
            <div className={clsx("shrink-0", !hasIndex && !s && "hidden")}>
              {s ? (
                <ScratchedLabel />
              ) : idx && stats ? (
                <UnicoScore score={idx.score} rank={idx.rank} stats={stats} variant="compact" />
              ) : (
                <span className="text-[12px] text-ink-2"><Dash /></span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ScratchedLabel() {
  return (
    <span className="inline-flex items-center rounded-[5px] border border-silver bg-surface px-1.5 py-[2px] text-[11.5px] font-semibold text-ink-2 md:ml-[18px]">
      出走取消
    </span>
  );
}

function Dash() {
  return <span className="text-silver">—</span>;
}
