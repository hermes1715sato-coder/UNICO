/* テスト共通: ペルソナ Cookie と時刻の差し替え、Route Handler の呼び出し */
import { DEMO_PERSONA_COOKIE, findPersona } from "@/lib/access/demo-personas";

export const DEMO_NOW = "2026-11-28T12:30:00+09:00";

export const ctl = {
  persona: undefined as string | undefined,
  now: undefined as string | undefined,
};

export function setPersona(id: string | undefined) {
  ctl.persona = id;
}
export function setNow(iso: string | undefined) {
  ctl.now = iso;
}

export function viewerOf(id: string) {
  return findPersona(id).viewer;
}

/** next/headers の cookies() のモック実装 (session.ts の getViewer() は実物を使う)
 *  使い方: vi.mock("next/headers", async () => (await import("./support/harness")).nextHeadersMock()); */
export function nextHeadersMock() {
  return {
    cookies: async () => ({
      get: (name: string) =>
        name === DEMO_PERSONA_COOKIE && ctl.persona !== undefined ? { name, value: ctl.persona } : undefined,
    }),
    headers: async () => new Headers(),
  };
}

export const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

export async function call(res: Response | Promise<Response>) {
  const r = await res;
  const text = await r.text();
  return { status: r.status, headers: r.headers, text, body: text ? JSON.parse(text) : null };
}

export function postJson(url: string, body: unknown) {
  return new Request(`http://localhost:3000${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
