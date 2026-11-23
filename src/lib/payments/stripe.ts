/* =========================================================
   Stripe クライアント (サーバー専用)
   キー未設定時は null を返し、API は 503 PAYMENT_NOT_CONFIGURED を返す (成功を偽装しない)。
   環境変数:
     STRIPE_SECRET_KEY         sk_live_... / sk_test_...
     STRIPE_WEBHOOK_SECRET     whsec_...
     STRIPE_PRICE_PRO_MONTHLY  price_... (月額 1,280円)
     STRIPE_PRICE_PRE_RACE     price_... (任意。未設定なら price_data で 300円)
     NEXT_PUBLIC_SITE_URL      https://... (任意。Checkout の戻り先)
   ========================================================= */
import "server-only";
import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

export function getProMonthlyPriceId(): string | null {
  return process.env.STRIPE_PRICE_PRO_MONTHLY || null;
}

export function getPreRacePriceId(): string | null {
  return process.env.STRIPE_PRICE_PRE_RACE || null;
}
