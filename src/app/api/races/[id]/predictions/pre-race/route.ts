/* GET /api/races/[id]/predictions/pre-race  事前買い目 (単品購入者 or PRO) */
import { handlePredictionGet } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handlePredictionGet(id, "PRE_RACE");
}
