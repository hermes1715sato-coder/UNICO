/* =========================================================
   現在の閲覧者を取得 (サーバー専用)
   DEMO: Cookie のペルソナ。本番: Supabase Auth のセッション + entitlements。
   ========================================================= */
import "server-only";
import { cookies } from "next/headers";
import { DEMO_PERSONA_COOKIE, findPersona } from "./demo-personas";
import type { Viewer } from "./policy";
import { DEMO_NOW_ISO } from "../demo/generate";

export async function getViewer(): Promise<Viewer> {
  const c = await cookies();
  return findPersona(c.get(DEMO_PERSONA_COOKIE)?.value).viewer;
}

export async function getDemoPersonaId(): Promise<string> {
  const c = await cookies();
  return findPersona(c.get(DEMO_PERSONA_COOKIE)?.value).id;
}

/** 権限・公開判定に使う現在時刻。DEMO 中は固定 (レース当日 12:30) */
export function getNow(): string {
  return DEMO_NOW_ISO;
}
