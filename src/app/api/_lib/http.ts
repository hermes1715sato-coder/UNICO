/* API 共通: 会員別データを返すため、全レスポンスを private, no-store にする */
import { NextResponse } from "next/server";

export const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
} as const;

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export function error(status: number, code: string, message?: string) {
  return json(message ? { error: code, message } : { error: code }, status);
}

/** リクエストボディを JSON として読む。不正なら null */
export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const v = await req.json();
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Checkout の戻り先 URL の基点 */
export function siteOrigin(req: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
}
