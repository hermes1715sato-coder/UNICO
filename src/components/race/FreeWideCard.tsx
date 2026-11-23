import { Ticket } from "lucide-react";
import type { Entry, FreeWidePick, RaceStatus } from "@/lib/types";
import { SectionHeading } from "@/components/ui";
import { HorseNoBox } from "./parts";

/** BOX図の頂点位置 (%) — 3頭: 三角形 / 4頭: 四角形 + 対角線 = 全組み合わせ */
const LAYOUT: Record<number, [number, number][]> = {
  3: [
    [50, 20],
    [16, 80],
    [84, 80],
  ],
  4: [
    [18, 22],
    [82, 22],
    [82, 78],
    [18, 78],
  ],
};

/** 無料ワイド予想 (BOX)。印は表示しない。 */
export function FreeWideCard({
  pick,
  entries,
  status,
}: {
  pick: FreeWidePick | null;
  entries: Entry[];
  status: RaceStatus;
}) {
  const frameOf = (no: number) => entries.find((e) => e.horseNo === no)?.frame;

  return (
    <section aria-labelledby="free-wide-title">
      <SectionHeading id="free-wide-title" index="02" en="FREE WIDE" title="無料ワイド予想" />
      <div className="edge-silver overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
        {pick ? (
          <>
            <BoxDiagram pick={pick} frameOf={frameOf} />

            <ol className="border-t border-line">
              {pick.horses.map((h) => (
                <li key={h.horseNo} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <HorseNoBox no={h.horseNo} frame={frameOf(h.horseNo)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold leading-snug text-ink">{h.name}</p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{h.reason}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="border-t border-line px-4 py-3">
              <p className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">
                COMBINATIONS<span className="ml-1.5 font-normal tracking-normal text-ink-2">組み合わせ（ワイド）</span>
              </p>
              <ul className="mt-2 grid grid-cols-3 gap-1.5">
                {pairs(pick.horses.map((h) => h.horseNo)).map(([a, b]) => (
                  <li
                    key={`${a}-${b}`}
                    className="num flex h-8 items-center justify-center rounded-[6px] border border-line bg-surface-2/60 text-[14px] font-semibold text-ink"
                  >
                    {a}
                    <span aria-hidden className="mx-1.5 inline-block h-px w-3 bg-accent-silver" />
                    <span className="sr-only">-</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <p className="border-t border-line px-4 py-3 text-[11.5px] leading-relaxed text-ink-2">
              UNICO指数の上位馬をもとにした分析支援情報です。的中や利益を保証するものではありません。馬券の購入はご自身の判断でお願いします。
            </p>
          </>
        ) : (
          <div className="flex items-start gap-3 px-4 py-5">
            <span className="silver-plate flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-accent-silver">
              <Ticket size={18} strokeWidth={1.6} aria-hidden />
            </span>
            <div>
              <p className="text-[14px] font-bold text-ink">{emptyTitle(status)}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">{emptyText(status)}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** BOX を図として描く: 馬番プレートをヘアラインで結ぶ (線の本数 = 点数) */
function BoxDiagram({ pick, frameOf }: { pick: FreeWidePick; frameOf: (no: number) => number | undefined }) {
  const n = pick.horses.length;
  const pts = LAYOUT[n];
  const lines: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) lines.push([i, j]);

  return (
    <div className="brushed relative px-4 pt-3 pb-3">
      <div className="flex items-center justify-between">
        <span className="num text-[11px] font-semibold tracking-[0.16em] text-accent-silver">WIDE BOX</span>
        <span className="flex items-center gap-1.5">
          <span className="silver-plate rounded-[6px] px-2 py-[2px] text-[12px] font-bold text-ink">
            <span className="num">{n}</span>頭BOX
          </span>
          <span className="rounded-[6px] border border-line bg-surface px-2 py-[2px] text-[12px] font-semibold text-ink-2">
            <span className="num text-ink">{pick.points}</span>点
          </span>
        </span>
      </div>

      {pts ? (
        <div className="relative mx-auto mt-1 h-[148px] max-w-[300px]" aria-hidden>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {lines.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={pts[a][0]}
                y1={pts[a][1]}
                x2={pts[b][0]}
                y2={pts[b][1]}
                stroke="#899995"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {lines.map(([a, b]) => (
              <circle
                key={`m-${a}-${b}`}
                cx={(pts[a][0] + pts[b][0]) / 2}
                cy={(pts[a][1] + pts[b][1]) / 2}
                r="1.2"
                fill="#b5a078"
              />
            ))}
          </svg>
          {pick.horses.map((h, i) => (
            <span
              key={h.horseNo}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pts[i][0]}%`, top: `${pts[i][1]}%` }}
            >
              <HorseNoBox no={h.horseNo} frame={frameOf(h.horseNo)} size="lg" plate />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function pairs(nos: number[]): [number, number][] {
  const s = [...nos].sort((a, b) => a - b);
  const out: [number, number][] = [];
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) out.push([s[i], s[j]]);
  return out;
}

function emptyTitle(status: RaceStatus) {
  if (status === "before_entry" || status === "analyzing") return "分析完了後に公開します";
  return "このレースは無料ワイド予想の対象外です";
}

function emptyText(status: RaceStatus) {
  if (status === "before_entry") return "出走馬の確定とUNICO指数の分析が完了すると、ここに表示されます。";
  if (status === "analyzing") return "UNICO指数の分析が完了すると、ここに表示されます。";
  return "出走頭数などの条件により、無料ワイド予想を作成していません。指数ランキングをご参照ください。";
}
