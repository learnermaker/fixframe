import { defineConfig } from "vitest/config";

// Manual live smoke test only; deliberately not part of `acceptance` or CI.
export default defineConfig({
  test: { include: ["live/**/*.live.ts"], testTimeout: 180_000, hookTimeout: 90_000, fileParallelism: false },
});
