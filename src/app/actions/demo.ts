"use server";

import { cookies } from "next/headers";
import { DEMO_PERSONAS, DEMO_PERSONA_COOKIE } from "@/lib/access/demo-personas";

/**
 * DEMO 会員状態の切り替え (検証用)。
 * 本番では Supabase Auth のセッションに置き換えるため、このアクションは削除する。
 */
export async function setDemoPersona(id: string): Promise<{ ok: boolean }> {
  if (!DEMO_PERSONAS.some((p) => p.id === id)) return { ok: false };
  const c = await cookies();
  c.set(DEMO_PERSONA_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  return { ok: true };
}
