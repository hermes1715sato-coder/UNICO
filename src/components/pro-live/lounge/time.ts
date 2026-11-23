/* PRO Lounge の時刻表示 (JST 固定。サーバー描画のため決定的) */

/** ISO → "12:30" (JST) */
export function hhmm(iso: string) {
  const j = new Date(Date.parse(iso) + 9 * 3600 * 1000);
  return `${String(j.getUTCHours()).padStart(2, "0")}:${String(j.getUTCMinutes()).padStart(2, "0")}`;
}

/** now からの相対表示: "たった今" / "5分前" / "2時間前" */
export function ago(iso: string, now: string) {
  const min = Math.floor((Date.parse(now) - Date.parse(iso)) / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  return `${Math.floor(min / 60)}時間前`;
}
