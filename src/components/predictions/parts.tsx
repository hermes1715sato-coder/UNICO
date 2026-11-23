import clsx from "clsx";
import type { Mark, PredictionDiff, PredictionStatus, StakeAllocation, TicketLine, TicketRole, TicketType } from "@/lib/predictions/types";
import { ROLE_LABEL, TICKET_LABEL } from "@/lib/predictions/types";
import type { HistoryItem } from "@/lib/predictions/view";
import { HorseNoBox } from "@/components/race/parts";

/* =========================================================
   買い目表示の共通パーツ (Server Component で使用。データは props のみ)
   ========================================================= */

const WD = ["日", "月", "火", "水", "木", "金", "土"];

/** ISO → "11/28(土) 18:00" (JST) */
export function fmtJst(iso: string, withDay = true) {
  const j = new Date(Date.parse(iso) + 9 * 3600 * 1000);
  const hm = `${String(j.getUTCHours()).padStart(2, "0")}:${String(j.getUTCMinutes()).padStart(2, "0")}`;
  if (!withDay) return hm;
  return `${j.getUTCMonth() + 1}/${j.getUTCDate()}(${WD[j.getUTCDay()]}) ${hm}`;
}

export function yen(n: number) {
  return n.toLocaleString("ja-JP");
}

const ROLE_ORDER: TicketRole[] = ["main", "mid", "longshot"];
const ORDERED: TicketType[] = ["UMATAN", "SANRENTAN"];

export type FrameOf = Record<number, number | undefined>;

/** 組み合わせ: 馬番をヘアライン (順序あり券種は ›) でつないだピル */
export function Combination({ combo, ordered }: { combo: number[]; ordered: boolean }) {
  return (
    <span className="num inline-flex h-8 items-center rounded-[7px] border border-line bg-surface px-2 text-[14px] font-semibold text-ink">
      {combo.map((n, i) => (
        <span key={i} className="inline-flex items-center">
          {i > 0 &&
            (ordered ? (
              <span aria-label="→" className="mx-1 text-[12px] font-normal text-accent-silver">›</span>
            ) : (
              <>
                <span aria-hidden className="mx-1.5 inline-block h-px w-2.5 bg-accent-silver" />
                <span className="sr-only">-</span>
              </>
            ))}
          {n}
        </span>
      ))}
    </span>
  );
}

const ROLE_TONE: Record<TicketRole, string> = {
  main: "bg-accent-silver",
  mid: "bg-silver",
  longshot: "bg-silver-surface",
};

function RoleChip({ role, gold = false }: { role: TicketRole; gold?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-[1px] text-[12px] font-bold",
        gold && role === "main" ? "border-gold/60 text-gold-ink" : "border-silver text-ink",
      )}
    >
      <span aria-hidden className={clsx("h-2 w-2 rounded-full", gold && role === "main" ? "bg-gold" : ROLE_TONE[role], role === "longshot" && "border border-silver")} />
      {ROLE_LABEL[role]}
    </span>
  );
}

/** 券種行 (本線/中穴/穴でグループ化) */
export function TicketGroups({ lines, gold = false }: { lines: TicketLine[]; gold?: boolean }) {
  return (
    <div className="space-y-3">
      {ROLE_ORDER.map((role) => {
        const ls = lines.filter((l) => l.role === role);
        if (!ls.length) return null;
        const subtotal = ls.reduce((a, l) => a + l.stake, 0);
        return (
          <div key={role} className="rounded-[12px] border border-line bg-surface">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <RoleChip role={role} gold={gold} />
              <span className="text-[12px] text-ink-2">
                小計 <span className="num text-[14px] font-semibold text-ink">{yen(subtotal)}</span>円
              </span>
            </div>
            <ul className="divide-y divide-line">
              {ls.map((l, i) => (
                <li key={i} className="px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-[14px] font-bold text-ink">{TICKET_LABEL[l.ticketType]}</p>
                    <p className="text-[12px] text-ink-2">
                      <span className="num font-semibold text-ink">{l.points}</span>点 ×{" "}
                      <span className="num font-semibold text-ink">{yen(l.stakePerPoint)}</span>円 ={" "}
                      <span className="num text-[14px] font-semibold text-ink">{yen(l.stake)}</span>円
                    </p>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`${TICKET_LABEL[l.ticketType]}の組み合わせ`}>
                    {l.combinations.map((c, j) => (
                      <li key={j}>
                        <Combination combo={c} ordered={ORDERED.includes(l.ticketType)} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** 資金配分バー (役割ごとのセグメント) + 凡例 */
export function StakeBar({ allocation, total, gold = false }: { allocation: StakeAllocation[]; total: number; gold?: boolean }) {
  const byRole = ROLE_ORDER.map((role) => {
    const items = allocation.filter((a) => a.role === role);
    return { role, amount: items.reduce((s, a) => s + a.amount, 0), types: items.map((a) => TICKET_LABEL[a.ticketType]) };
  }).filter((r) => r.amount > 0);
  const sum = byRole.reduce((s, r) => s + r.amount, 0) || 1;
  return (
    <div>
      <p className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">
        ALLOCATION<span className="ml-1.5 font-normal tracking-normal text-ink-2">推奨資金配分</span>
      </p>
      <div className="mt-2 flex h-3 overflow-hidden rounded-full border border-line bg-surface-2" role="img" aria-label="資金配分">
        {byRole.map((r) => (
          <span
            key={r.role}
            className={clsx("h-full border-r border-surface last:border-r-0", gold && r.role === "main" ? "bg-gold/70" : ROLE_TONE[r.role])}
            style={{ width: `${(r.amount / sum) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-3 gap-2">
        {byRole.map((r) => (
          <li key={r.role} className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <span aria-hidden className={clsx("h-2 w-2 shrink-0 rounded-full", gold && r.role === "main" ? "bg-gold/70" : ROLE_TONE[r.role], r.role === "longshot" && "border border-silver")} />
              {ROLE_LABEL[r.role]}
              <span className="num ml-auto text-ink-2">{Math.round((r.amount / sum) * 100)}%</span>
            </p>
            <p className="num mt-0.5 text-[13px] text-ink">{yen(r.amount)}<span className="text-[11px] text-ink-2">円</span></p>
            <p className="truncate text-[11px] text-ink-2">{[...new Set(r.types)].join("・")}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-[13px] font-semibold text-ink-2">合計推奨金額</span>
        <span className="text-ink">
          <span className="num text-[26px] font-light leading-none tracking-[-0.03em]">{yen(total)}</span>
          <span className="ml-0.5 text-[13px] font-semibold">円</span>
        </span>
      </div>
    </div>
  );
}

export const STATUS_LABEL: Record<PredictionStatus, string> = {
  DRAFT: "下書き",
  SCHEDULED: "公開予定",
  PUBLISHED: "公開済み",
  REVISED: "更新版あり",
  CLOSED: "公開終了",
};

export function StatusBadge({ status }: { status: PredictionStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-[1px] text-[11px] font-semibold",
        status === "PUBLISHED" && "border-charcoal/30 bg-surface text-ink",
        status === "REVISED" && "border-dashed border-silver bg-surface text-ink-2",
        status === "CLOSED" && "border-silver/60 bg-silver-surface text-ink-2",
        (status === "DRAFT" || status === "SCHEDULED") && "border-line text-ink-2",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** 公開日時 + バージョン + 状態 */
export function PublishMeta({ publishedAt, version, status }: { publishedAt: string; version: number; status: PredictionStatus }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-2">
      <span>
        公開 <span className="num text-ink">{fmtJst(publishedAt)}</span>
      </span>
      <span className="num rounded-[4px] border border-line px-1 text-[11px] font-semibold text-ink-2">v{version}</span>
      <StatusBadge status={status} />
    </p>
  );
}

const MARK_ORDER: Mark[] = ["◎", "○", "▲", "△", "☆", "注"];

/** 予想印 (PRO) */
export function MarkList({
  marks,
  names,
  frameOf,
}: {
  marks: Partial<Record<number, Mark>>;
  names: Record<number, string>;
  frameOf: FrameOf;
}) {
  const items = Object.entries(marks)
    .map(([no, m]) => ({ no: Number(no), mark: m as Mark }))
    .sort((a, b) => MARK_ORDER.indexOf(a.mark) - MARK_ORDER.indexOf(b.mark) || a.no - b.no);
  return (
    <div>
      <p className="num text-[11px] font-semibold tracking-[0.16em] text-gold-ink">
        AI MARKS<span className="ml-1.5 font-normal tracking-normal text-ink-2">AI予想印</span>
      </p>
      <ul className="mt-2 grid grid-cols-1 gap-1">
        {items.map((it) => (
          <li
            key={it.no}
            className={clsx(
              "flex min-w-0 items-center gap-2 rounded-[10px] border bg-surface px-2 py-1",
              it.mark === "◎" ? "border-gold/45 py-1.5" : "border-line",
            )}
          >
            <span
              className={clsx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[15px] font-bold leading-none",
                it.mark === "◎" ? "border-gold/70 text-gold-ink" : "border-silver text-ink",
              )}
              aria-label={`印 ${it.mark}`}
            >
              {it.mark}
            </span>
            <HorseNoBox no={it.no} frame={frameOf[it.no]} size="sm" />
            <span className={clsx("min-w-0 truncate font-semibold text-ink", it.mark === "◎" ? "text-[15px]" : "text-[13px]")}>{names[it.no] ?? "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 公開履歴 */
export function HistoryList({ title, items }: { title: string; items: HistoryItem[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[12px] font-bold text-ink">{title}</p>
      <ol className="mt-1.5 space-y-1.5">
        {[...items].reverse().map((h) => (
          <li key={h.version} className="rounded-[10px] border border-line bg-surface px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="num rounded-[4px] border border-line px-1 text-[11px] font-semibold text-ink-2">v{h.version}</span>
              <StatusBadge status={h.predictionStatus} />
              <span className="num text-[12px] text-ink-2">{fmtJst(h.publishedAt)}</span>
              <span className="ml-auto text-[12px] text-ink-2">
                <span className="num font-semibold text-ink">{yen(h.totalStake)}</span>円
              </span>
            </div>
            {h.note && <p className="mt-1 text-[12px] text-ink-2">{h.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 事前 → 最終の変更点 */
export function DiffView({ diff }: { diff: PredictionDiff }) {
  const delta = diff.totalStakeAfter - diff.totalStakeBefore;
  const Group = ({ label, sign, list }: { label: string; sign: "+" | "−"; list: PredictionDiff["added"] }) => (
    <div>
      <p className="text-[12px] font-bold text-ink">
        {label}
        <span className="num ml-1 font-normal text-ink-2">{list.length}</span>
      </p>
      {list.length ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {list.map((c, i) => (
            <li key={i} className="inline-flex items-center gap-1">
              <span className={clsx("num w-3 text-center text-[13px] font-bold", sign === "+" ? "text-ink" : "text-ink-2")} aria-hidden>
                {sign}
              </span>
              <span className="text-[11px] text-ink-2">{TICKET_LABEL[c.ticketType]}</span>
              <span className={clsx(sign === "−" && "opacity-60 line-through decoration-ink-2")}>
                <Combination combo={c.combination} ordered={ORDERED.includes(c.ticketType)} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[12px] text-ink-2">なし</p>
      )}
    </div>
  );
  return (
    <div className="space-y-3">
      <Group label="追加された組み合わせ" sign="+" list={diff.added} />
      <Group label="外れた組み合わせ" sign="−" list={diff.removed} />
      <div className="flex flex-wrap items-baseline gap-x-2 rounded-[10px] border border-line bg-surface-2/60 px-3 py-2 text-[13px] text-ink-2">
        合計推奨金額
        <span className="num text-ink">{yen(diff.totalStakeBefore)}円</span>
        <span aria-label="から">→</span>
        <span className="num font-semibold text-ink">{yen(diff.totalStakeAfter)}円</span>
        <span className="num text-[12px]">{delta === 0 ? "（増減なし）" : `（${delta > 0 ? "+" : "−"}${yen(Math.abs(delta))}円）`}</span>
      </div>
    </div>
  );
}

/** 免責 */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={clsx("text-[11.5px] leading-relaxed text-ink-2", className)}>
      買い目・資金配分はUNICO指数等にもとづく分析支援情報です。的中や利益を保証するものではありません。馬券の購入はご自身の判断と責任でお願いします。
    </p>
  );
}
