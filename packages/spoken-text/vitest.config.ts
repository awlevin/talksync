import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    // The component tests render, so they need a DOM. The alignment tests do
    // not care either way.
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
  },
});
