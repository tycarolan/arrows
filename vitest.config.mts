import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node by default. The convention across the workshop is that the rules
    // live in pure modules under `src/lib/` and the browser-touching parts —
    // the canvas, the storage, the buttons — hold no rules and go untested.
    // If a component genuinely needs a DOM, add `@vitejs/plugin-react` and
    // `jsdom` and opt that file in with a `@vitest-environment jsdom` docblock
    // rather than switching the default for everything.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
