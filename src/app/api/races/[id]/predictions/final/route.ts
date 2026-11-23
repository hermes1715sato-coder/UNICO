/* GET /api/races/[id]/predictions/final  最終買い目 (有効な PRO のみ。単品購入では不可) */
import { handlePredictionGet } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handlePredictionGet(id, "FINAL");
}
