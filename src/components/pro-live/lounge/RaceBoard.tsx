import Link from "next/link";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import type { ProLounge } from "@/lib/pro/types";
import { HorseNoBox } from "@/components/race/parts";
import { UnicornMark } from "@/components/brand/UnicornMark";

/* =========================================================
   本日の PRO 対象レース一覧 (Server Component)
   進行中 → このあと → 発走済 の順にまとめ、各行は /pro/race/{id} へ。
   ========================================================= */

type LoungeRace = ProLounge["races"][number];
type Status = LoungeRace["status"];

const STATUS: Record<Status, { label: string; className: string }> = {
  closed: { label: "発走済", className: "border-silver/70 bg-silver-surface text-ink-2" },
  paddock: { label: "パドック評価済", className: "border-ok/30 bg-ok-bg text-ok" },
  weights: { label: "馬体重発表済", className: "border-info/30 bg-info-bg text-info" },
  upcoming: { label: "発表前", className: "border-dashed border-silver bg-surface text-ink-2" },
};

function shift(hm: string, minutes: number) {
  const [h, m] = hm.split(":").map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function StatusChip({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[11.5px] font-semibold leading-[18px]", s.className)}>
      {(status === "paddock" || status === "weights") && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />}
      {s.label}
    </span>
  );
}

export function Delta({ value, className }: { value: number; className?: string }) {
  if (Math.abs(value) < 0.05) {
    return <span className={clsx("num text-[11.5px] text-ink-2", className)} aria-label="変動なし">±0</span>;
  }
  const up = value > 0;
  return (
    <span className={clsx("num text-[11.5px] font-semibold", up ? "text-ok" : "text-danger", className)} aria-label={`前日比 ${up ? "+" : ""}${value.toFixed(1)}`}>
      {up ? "▲" : "▼"}
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

function RaceRow({ race }: { race: LoungeRace }) {
  const closed = race.status === "closed";
  const upcoming = race.status === "upcoming";
  return (
    <li>
      <Link href={`/pro/race/${race.raceId}`} className="group block px-4 py-3.5 transition-colors hover:bg-surface-2">
        <div className="flex items-baseline gap-2.5">
          {/* 発走時刻 */}
          <span className={clsx("num shrink-0 text-[18px] font-light leading-none tracking-[-0.02em]", closed ? "text-ink-2" : "text-ink")} aria-label={`${race.postTime}発走`}>
            {race.postTime}
          </span>
          <p className="min-w-0 truncate text-[15px] font-bold leading-snug text-ink">
            <span className="num mr-1.5">
              {race.venueName}
              {race.raceNo}R
            </span>
            <span className="font-medium">{race.name}</span>
          </p>
          <ChevronRight size={16} className="ml-auto shrink-0 self-center text-accent-silver transition-transform group-hover:translate-x-0.5" aria-hidden />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusChip status={race.status} />
          {race.finalPublished && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/55 bg-surface px-2 py-[1px] text-[11.5px] font-semibold leading-[18px] text-gold-ink">
              <UnicornMark size={13} tone="gold" />
              最終買い目 公開済み
            </span>
          )}
          {race.status === "upcoming" && (
            <span className="text-[11.5px] text-ink-2">
              馬体重 <span className="num">{shift(race.postTime, -70)}</span>・パドック <span className="num">{shift(race.postTime, -30)}</span> 予定
            </span>
          )}
        </div>

        {/* 当日指数 上位3頭 */}
        <ol className="mt-2.5 grid grid-cols-3 gap-1.5" aria-label={upcoming ? "UNICO指数 上位3頭（前日時点）" : "当日UNICO指数 上位3頭"}>
          {race.topLive.map((h, i) => (
            <li key={h.horseNo} className={clsx("min-w-0 rounded-[9px] border px-2 py-1.5", i === 0 ? "border-gold/40 bg-surface" : "border-line bg-surface-2/50")}>
              <div className="flex items-center gap-1.5">
                <HorseNoBox no={h.horseNo} size="sm" plate={i === 0} />
                <div className="min-w-0 leading-none">
                  <p className={clsx("num text-[15px] font-medium", closed ? "text-ink-2" : "text-ink")}>{h.live.toFixed(1)}</p>
                  {upcoming ? <span className="text-[11px] text-ink-2">前日</span> : <Delta value={h.delta} />}
                </div>
              </div>
              <p className="mt-1 truncate text-[12px] text-ink-2">{h.name}</p>
            </li>
          ))}
        </ol>
      </Link>
    </li>
  );
}

function Group({ title, en, races, note, visible }: { title: string; en: string; races: LoungeRace[]; note?: string; visible?: number }) {
  if (!races.length) return null;
  const head = visible ? races.slice(0, visible) : races;
  const rest = visible ? races.slice(visible) : [];
  return (
    <div>
      <div className="flex items-baseline gap-2 px-4 pt-3.5 pb-1.5">
        <p className="num text-[11px] font-semibold tracking-[0.18em] text-gold-ink">{en}</p>
        <p className="text-[13px] font-bold text-ink">{title}</p>
        <p className="num text-[11.5px] text-ink-2">{races.length}R</p>
        {note && <p className="ml-auto hidden text-[11.5px] text-ink-2 sm:block">{note}</p>}
      </div>
      <ul className="divide-y divide-line">
        {head.map((r) => (
          <RaceRow key={r.raceId} race={r} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group/more border-t border-line">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-1 px-4 py-3 text-[13px] font-semibold text-ink-2 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
            <span className="group-open/more:hidden">
              残り <span className="num">{rest.length}</span> レースを表示
            </span>
            <span className="hidden group-open/more:inline">閉じる</span>
            <ChevronRight size={14} className="rotate-90 transition-transform group-open/more:-rotate-90" aria-hidden />
          </summary>
          <ul className="divide-y divide-line border-t border-line">
            {rest.map((r) => (
              <RaceRow key={r.raceId} race={r} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function RaceBoard({ races }: { races: LoungeRace[] }) {
  const live = races.filter((r) => r.status === "paddock" || r.status === "weights");
  const next = races.filter((r) => r.status === "upcoming");
  const done = races.filter((r) => r.status === "closed");

  if (!races.length) {
    return <p className="rounded-[var(--radius-card)] border border-dashed border-silver bg-surface px-4 py-8 text-center text-[14px] text-ink-2">本日のPRO対象レースはありません。</p>;
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="divide-y divide-line">
        <Group en="NOW" title="当日情報 反映中" races={live} note="馬体重・パドック評価を反映した指数" />
        <Group en="NEXT" title="このあと" races={next} note="前日時点の指数（当日情報は発表後に反映）" visible={4} />
        {done.length > 0 && (
          <details className="group/done">
            <summary className="flex cursor-pointer list-none items-baseline gap-2 px-4 py-3.5 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
              <p className="num text-[11px] font-semibold tracking-[0.18em] text-accent-silver">DONE</p>
              <p className="text-[13px] font-bold text-ink">発走済</p>
              <p className="num text-[11.5px] text-ink-2">{done.length}R</p>
              <ChevronRight size={15} className="ml-auto self-center text-accent-silver transition-transform group-open/done:rotate-90" aria-hidden />
            </summary>
            <ul className="divide-y divide-line border-t border-line">
              {done.map((r) => (
                <RaceRow key={r.raceId} race={r} />
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
