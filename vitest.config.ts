import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Playwright visual specs run via `npm run visual`, not vitest.
    exclude: ["**/node_modules/**", "tests/visual/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` is a Next.js compile-time fence that throws when imported
      // from a client bundle. In tests we run server modules under Node, so
      // alias it to an empty stub.
      "server-only": path.resolve(__dirname, "lib/security/__tests__/server-only-stub.ts"),
    },
  },
});
