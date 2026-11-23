/* POST /api/stripe/webhook
   Stripe の署名 (STRIPE_WEBHOOK_SECRET) を検証してから entitlements.ts の純関数へ委譲する。
   - シークレット未設定: 503 WEBHOOK_NOT_CONFIGURED (未検証のイベントで権限を付与しない)
   - 署名不正: 400 INVALID_SIGNATURE
   - 同一イベント ID の再送: 200 { outcome: { kind: "duplicate" } } (冪等) */
import Stripe from "stripe";
import { getEntitlementRepository, type StripeLikeEvent } from "@/lib/payments/entitlements";
import { getWebhookSecret } from "@/lib/payments/stripe";
import { error, json } from "../../_lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = getWebhookSecret();
  if (!secret) return error(503, "WEBHOOK_NOT_CONFIGURED");

  const signature = req.headers.get("stripe-signature");
  if (!signature) return error(400, "INVALID_SIGNATURE", "missing stripe-signature header");

  const payload = await req.text(); // 署名検証には生のボディが必要
  let event: StripeLikeEvent;
  try {
    event = Stripe.webhooks.constructEvent(payload, signature, secret) as unknown as StripeLikeEvent;
  } catch {
    return error(400, "INVALID_SIGNATURE");
  }

  const outcome = await getEntitlementRepository().applyEvent(event);
  return json({ received: true, eventId: event.id, outcome });
}
