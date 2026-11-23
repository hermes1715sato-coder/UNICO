/* PRE_RACE / FINAL 単体取得の共通処理
   判定順: 401 未ログイン → 404 レースなし → 403 権限なし → 404 対象外/未公開 → 200
   権限判定を公開状態より先に行うため、権限のない閲覧者には
   FINAL の公開予定・下書きの有無が (ステータスコードの差でも) 漏れない。 */
import { canView } from "@/lib/access/policy";
import { getNow, getViewer } from "@/lib/access/session";
import { getRacePredictionView } from "@/lib/predictions/view";
import { error, json } from "../../../_lib/http";

export async function handlePredictionGet(id: string, type: "PRE_RACE" | "FINAL") {
  const viewer = await getViewer();
  const now = getNow();
  if (!viewer.userId) return error(401, "LOGIN_REQUIRED");

  const view = await getRacePredictionView(id, viewer, now);
  if (!view) return error(404, "RACE_NOT_FOUND");

  if (!canView(viewer, id, type, now)) {
    return error(403, type === "FINAL" ? "PRO_REQUIRED" : "PURCHASE_OR_PRO_REQUIRED");
  }

  if (type === "PRE_RACE") {
    if (view.preRace.state === "not_target") return error(404, "NOT_TARGET");
    const d = view.preRace.data;
    if (!d) return error(404, "NOT_PUBLISHED");
    // PRE_RACE には印を含めない (型上も含まれないが、念のため明示的に組み立てる)
    return json({
      raceId: id,
      predictionType: "PRE_RACE",
      unlockedBy: view.preRace.unlockedBy,
      prediction: {
        version: d.version,
        predictionStatus: d.predictionStatus,
        publishedAt: d.publishedAt,
        updatedAt: d.updatedAt,
        lines: d.lines,
        stakeAllocation: d.stakeAllocation,
        totalStake: d.totalStake,
      },
    });
  }

  if (view.final.state === "not_target") return error(404, "NOT_TARGET");
  const f = view.final.data;
  if (!f) return error(404, "NOT_PUBLISHED");
  return json({ raceId: id, predictionType: "FINAL", prediction: f });
}
