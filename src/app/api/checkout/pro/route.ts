/* POST /api/checkout/pro
   PRO 月額 (1,280円) の Stripe Checkout Session (mode=subscription) を作成する。
   - 未ログイン 401 / PRO 有効中 409 PRO_ALREADY_ACTIVE
   - STRIPE_SECRET_KEY / STRIPE_PRICE_PRO_MONTHLY 未設定なら 503 PAYMENT_NOT_CONFIGURED */
import { isProActive } from "@/lib/access/policy";
import { getNow, getViewer } from "@/lib/access/session";
import { PRODUCT_PRO_MONTHLY } from "@/lib/payments/entitlements";
import { getProMonthlyPriceId, getStripe } from "@/lib/payments/stripe";
import { error, json, siteOrigin } from "../../_lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "LOGIN_REQUIRED");
  if (isProActive(viewer, getNow())) return error(409, "PRO_ALREADY_ACTIVE");

  const stripe = getStripe();
  const priceId = getProMonthlyPriceId();
  if (!stripe || !priceId) return error(503, "PAYMENT_NOT_CONFIGURED", "Stripe is not configured on this server");

  const origin = siteOrigin(req);
  const metadata = { userId: viewer.userId, product: PRODUCT_PRO_MONTHLY };
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: viewer.userId,
      metadata,
      // customer.subscription.* イベントで userId を特定するため subscription 側にも付与
      subscription_data: { metadata },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/mypage?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro/plans?checkout=cancel`,
    });
  } catch (e) {
    console.error("[checkout] stripe error", e);
    return error(502, "PAYMENT_PROVIDER_ERROR");
  }
  return json({ url: session.url, sessionId: session.id });
}
