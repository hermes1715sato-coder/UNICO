import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // "server-only" はバンドラ外では throw するため、テストでは空モジュールに置換
      { find: /^server-only$/, replacement: r("./tests/support/empty.ts") },
      { find: /^@\/(.*)$/, replacement: r("./src/$1") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
