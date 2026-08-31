import { defineConfig } from "tsup";

/**
 * One output file per source file, rather than one bundle. That keeps the
 * `"use client"` directive on the two modules that need it, so a React Server
 * Component can still import `alignTokens` or `tokenize` without crossing a
 * client boundary.
 */
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/__tests__/**"],
  outDir: "dist",
  format: ["esm"],
  target: "es2020",
  bundle: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Declarations come from `tsc -p tsconfig.build.json`, which emits one
  // `.d.ts` per source file to match this output.
  dts: false,
});
