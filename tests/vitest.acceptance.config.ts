import { defineConfig } from "vitest/config";

// `*.acceptance.ts` is deliberately not matched by Vitest's default include,
// so the root `npm test` (unit tests) never tries to start the built app.
export default defineConfig({
  test: {
    include: ["acceptance/**/*.acceptance.ts"],
    testTimeout: 120_000,
    hookTimeout: 90_000,
    fileParallelism: false,
  },
});
