import { defineConfig } from "tsup";

export default defineConfig([
  // npm entries: core + adapters, ESM + CJS with types
  {
    entry: {
      index: "src/index.ts",
      "adapters/vanilla/index": "src/adapters/vanilla/index.ts",
      "adapters/react/index": "src/adapters/react/index.ts",
      "adapters/vue/index": "src/adapters/vue/index.ts",
      "adapters/angular/index": "src/adapters/angular/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
  },
  // CDN bundle: core only, UMD-style global `mViaCEP`
  {
    entry: { mviacep: "src/index.ts" },
    format: ["iife"],
    globalName: "mViaCEP",
    outDir: "dist/cdn",
    minify: true,
    sourcemap: true,
  },
]);
