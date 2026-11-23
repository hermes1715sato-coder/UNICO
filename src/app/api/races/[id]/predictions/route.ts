/* GET /api/races/[id]/predictions
   閲覧者の権限でフィルタ済みの RacePredictionView を返す (view.ts 経由のみ) */
import { getNow, getViewer } from "@/lib/access/session";
import { getRacePredictionView } from "@/lib/predictions/view";
import { error, json } from "../../../_lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const view = await getRacePredictionView(id, await getViewer(), getNow());
  if (!view) return error(404, "RACE_NOT_FOUND");
  return json(view);
}
