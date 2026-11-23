/* POST /api/checkout/pre-race  body: { raceId }
   事前買い目 (300円・レース単位) の Stripe Checkout Session (mode=payment) を作成する。
   - 未ログイン 401 / PRO 有効 409 PRO_INCLUDED (課金しない) / 購入済み 409 / 未公開・締切後 409
   - STRIPE_SECRET_KEY 未設定なら 503 PAYMENT_NOT_CONFIGURED (成功を偽装しない)
   権限付与は Webhook (checkout.session.completed) でのみ行う。ここでは付与しない。 */
import { PRE_RACE_PRICE_JPY } from "@/lib/access/policy";
import { getNow, getViewer } from "@/lib/access/session";
import { PRODUCT_PRE_RACE_SINGLE } from "@/lib/payments/entitlements";
import { getPreRacePriceId, getStripe } from "@/lib/payments/stripe";
import { getRacePredictionView } from "@/lib/predictions/view";
import { error, json, readJson, siteOrigin } from "../../_lib/http";

export const dynamic = "force-dynamic";

const STATUS_BY_REASON = {
  LOGIN_REQUIRED: 401,
  PRO_INCLUDED: 409,
  ALREADY_PURCHASED: 409,
  NOT_PUBLISHED: 409,
  RACE_CLOSED: 409,
} as const;

export async function POST(req: Request) {
  const body = await readJson(req);
  const raceId = typeof body?.raceId === "string" ? body.raceId : null;
  if (!raceId) return error(400, "INVALID_REQUEST", "raceId is required");

  const viewer = await getViewer();
  const now = getNow();
  if (!viewer.userId) return error(401, "LOGIN_REQUIRED");

  const view = await getRacePredictionView(raceId, viewer, now);
  if (!view) return error(404, "RACE_NOT_FOUND");
  if (view.preRace.state === "not_target") return error(404, "NOT_TARGET");

  const check = view.preRace.purchase; // = canPurchasePreRace(viewer, raceId, now, {...})
  if (!check.ok) return error(STATUS_BY_REASON[check.reason ?? "NOT_PUBLISHED"], check.reason ?? "NOT_PURCHASABLE");

  const stripe = getStripe();
  if (!stripe) return error(503, "PAYMENT_NOT_CONFIGURED", "Stripe is not configured on this server");

  const origin = siteOrigin(req);
  const metadata = { userId: viewer.userId, raceId, product: PRODUCT_PRE_RACE_SINGLE };
  const priceId = getPreRacePriceId();
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: viewer.userId,
      metadata,
      payment_intent_data: { metadata },
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: "jpy",
                unit_amount: PRE_RACE_PRICE_JPY, // JPY はゼロ小数通貨
                product_data: { name: `UNICO 事前買い目 ${raceId}` },
              },
            },
      ],
      success_url: `${origin}/race/${encodeURIComponent(raceId)}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/race/${encodeURIComponent(raceId)}?checkout=cancel`,
    });
  } catch (e) {
    console.error("[checkout] stripe error", e);
    return error(502, "PAYMENT_PROVIDER_ERROR");
  }
  return json({ url: session.url, sessionId: session.id });
}
