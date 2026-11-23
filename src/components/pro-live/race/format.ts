/* PRO レース分析ページ用の表示ヘルパー (サーバー / クライアント共用・データ非依存) */

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → JST の HH:mm */
export function jstHM(iso: string) {
  const d = new Date(Date.parse(iso) + 9 * 3600 * 1000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** 符号付き表記 (+1.2 / −0.8 / ±0) */
export function signed(n: number, digits = 1) {
  if (n === 0) return "±0";
  const abs = Math.abs(n).toFixed(digits);
  return n > 0 ? `+${abs}` : `−${abs}`;
}

export function pct(part: number, total: number) {
  if (total <= 0) return "—";
  return `${((part / total) * 100).toFixed(1)}%`;
}

/** 当日補正値の色 (落ち着いたトーン) */
export function deltaClass(n: number) {
  if (n >= 0.5) return "text-ok";
  if (n <= -0.5) return "text-danger";
  return "text-ink-2";
}
