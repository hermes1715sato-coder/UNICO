import { Info } from "lucide-react";
import { Card } from "@/components/ui";

const EXAMPLES = [
  {
    title: "3頭BOX",
    en: "WIDE BOX 3",
    points: 3,
    when: "指数上位に明確な差があるレース",
    horses: [3, 7, 12],
  },
  {
    title: "4頭BOX",
    en: "WIDE BOX 4",
    points: 6,
    when: "上位の指数が拮抗した混戦レース",
    horses: [2, 5, 9, 14],
  },
];

function pairs(h: number[]) {
  const out: [number, number][] = [];
  for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) out.push([h[i], h[j]]);
  return out;
}

/** 無料ワイド予想の紹介 (無料版は印を出さない) */
export function FreeWideIntro() {
  return (
    <Card className="p-4 lg:p-6">
      <p className="text-[14px] leading-relaxed text-ink-2">
        分析完了したレースでは、UNICO指数の上位馬から<span className="font-semibold text-ink">ワイドのBOX</span>
        を無料で公開します。上位の指数差に応じて3頭または4頭を選び、各馬の評価ポイントを添えて表示します。
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <div key={ex.title} className="overflow-hidden rounded-[12px] border border-line bg-surface">
            <div className="brushed flex items-end justify-between gap-2 border-b border-line px-3.5 py-2.5">
              <div>
                <p className="num text-[11px] font-semibold tracking-[0.18em] text-accent-silver">{ex.en}</p>
                <p className="mt-0.5 text-[15px] font-bold text-ink">
                  ワイド <span className="num">{ex.title}</span>
                </p>
              </div>
              <p className="text-[13px] text-ink-2">
                <span className="num text-[24px] font-light leading-none tracking-[-0.02em] text-ink">{ex.points}</span>
                <span className="ml-0.5">点</span>
              </p>
            </div>
            <div className="px-3.5 pb-3 pt-2.5">
              <p className="text-[12.5px] text-ink-2">{ex.when}</p>
              <div className="mt-2.5 flex items-center gap-1.5" aria-label={`例: ${ex.horses.join("・")}番`}>
                <span className="num mr-1 text-[11px] font-semibold tracking-[0.14em] text-accent-silver">EX.</span>
                {ex.horses.map((n) => (
                  <span key={n} className="silver-plate num flex h-9 w-9 items-center justify-center rounded-[8px] text-[15px] font-bold text-ink">
                    {n}
                  </span>
                ))}
              </div>
              <ul className="num mt-2.5 flex flex-wrap gap-1 text-[12px] text-ink-2" aria-label="組み合わせ">
                {pairs(ex.horses).map(([a, b]) => (
                  <li key={`${a}-${b}`} className="rounded-[5px] border border-line px-1.5 leading-[20px]">
                    {a}
                    <span className="mx-[1px] text-silver">-</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-[12.5px] leading-relaxed text-ink-2">
        <Info size={15} strokeWidth={1.8} className="mt-[2px] shrink-0 text-accent-silver" aria-hidden />
        無料版では◎○▲などの印や本命・対抗の区別は付けず、馬番順に表示します。印・買い目の詳細はPROで提供します。
      </p>
    </Card>
  );
}
