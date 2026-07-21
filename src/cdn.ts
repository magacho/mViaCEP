// CDN / IIFE entry point — the single-file build served as the `mViaCEP` global
// via `<script>`. It bundles the framework-agnostic core PLUS the vanilla DOM
// adapter (both dependency-free), so `<script>` users get `lookup`/`search`
// AND `bindCep` autofill with no build step. Framework adapters (React/Vue/
// Angular) are intentionally excluded — they are npm-only.
export * from "./core";
export { bindCep } from "./adapters/vanilla";
export type { BindCepOptions } from "./adapters/vanilla";
