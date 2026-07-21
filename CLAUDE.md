# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Greenfield. This document describes the **intended** architecture and tooling agreed with the maintainer; the code is still to be scaffolded. Treat the layout and commands below as the target to build toward, and update this file as reality diverges.

## What this is

**mViaCEP** is an open-source **browser-side library** that wraps the free ViaCEP API (`https://viacep.com.br/ws/`) to add address autofill and validation to community projects. It runs in the end user's browser and is meant to work across most frameworks.

Two consequences drive every design decision:

- **The network is the bottleneck and the failure point.** ViaCEP is a free public API. Caching, debounce, timeouts, and *typed* error handling are core concerns, not add-ons. Critically, ViaCEP returns HTTP 200 with body `{ "erro": true }` for a well-formed-but-nonexistent CEP — the core must translate this into an explicit "not found" error instead of reporting empty success.
- **"Support most frameworks" means framework-agnostic core + thin adapters.** The core knows nothing about React/Vue/Angular — it only fetches, validates, and formats. Each adapter is a small layer on top. Never leak framework types or DOM assumptions into `src/core/`.

## Architecture

```
src/
├── core/          # 100% framework-agnostic — no React/Vue/Angular/DOM imports
│   ├── client.ts  # ViaCEP fetch: timeout, in-memory (+ optional sessionStorage) cache
│   ├── cep.ts     # validate / normalize / mask (00000-000)
│   ├── types.ts   # Address, lookup results
│   ├── errors.ts  # typed errors: InvalidCep | NotFound | Network
│   └── index.ts
├── adapters/
│   ├── vanilla/   # bind to an <input>, write autofill into the DOM
│   ├── react/     # useViaCep() hook
│   ├── vue/       # useViaCep() composable (Vue 3)
│   └── angular/   # service / directive
examples/          # a runnable demo per adapter
tests/
```

**Autofill flow (the central use case):**

```
user input → normalize + validate CEP → cache hit? return
                                       → fetch ViaCEP → map response
                                       → Address | typed error → adapter fills fields
```

Design rules:
- **The core is the source of truth for behavior.** Adapters must not re-implement validation, caching, or error mapping — they call the core and translate its results into framework idioms. A bug fix in behavior belongs in `core/`, not repeated in four adapters.
- **Errors are typed, never thrown-as-strings.** Every failure resolves to one of the `errors.ts` variants so adapters can branch (invalid format vs. not found vs. network down) without string-matching.
- **Cache keys on the normalized CEP** so `01001000`, `01001-000`, and `"01001000 "` share one entry.
- **Reverse lookup** (UF / city / street → list of CEPs, `.../ws/{uf}/{cidade}/{logradouro}/json/`) is a separate core function from the primary CEP → address lookup.

## Tooling & commands (recommended)

TypeScript throughout, bundled with **tsup** (emits ESM + CJS + UMD in one pass), tested with **Vitest**, linted with **ESLint + Prettier**. Once `package.json` exists, wire these scripts:

| Task | Command |
|------|---------|
| Install | `npm install` |
| Build (ESM/CJS/UMD) | `npm run build` |
| Test (watch) | `npm test` |
| Test once (CI) | `npm run test -- run` |
| Single test file | `npx vitest run tests/cep.test.ts` |
| Single test by name | `npx vitest run -t "rejects malformed CEP"` |
| Lint | `npm run lint` |
| Type-check only | `npx tsc --noEmit` |

When testing the client, **mock `fetch`** — never hit the live ViaCEP API from the test suite. Cover the three response shapes explicitly: a valid address, the `{ "erro": true }` not-found body, and a network/timeout failure.

## Development workflow (wave-based, issue-driven)

Work is tracked in **GitHub Issues** grouped into milestones (`M1 Core`, `M2 Adapters`, `M3 Distribuição & Release`) and executed in **waves**. Waves reflect real dependencies: everything in a wave can run in parallel; the next wave starts only once the previous one is integrated.

- **One issue → one branch → one PR.** Branch names: `feat/<area>-<name>` (e.g. `feat/core-cep`, `feat/adapter-react`). PR title ends with the issue number and the body includes `Closes #N`.
- **TDD is mandatory for code issues.** Write the test first, watch it fail, implement until green. Tests live next to nothing framework-specific in the core; adapters test their own integration. Never add a "write tests later" issue.
- **Parallel work must not touch shared files.** Subagents implementing a wave create only their own module + test files and **do not edit the barrels** (`src/index.ts`, `src/core/index.ts`). Barrel/export wiring is done in a single follow-up step after the wave's PRs merge, then validated (`typecheck` → `lint` → `test` → `build`) and committed. This keeps parallel PRs conflict-free.
- **Definition of Done includes docs.** Each adapter PR ships its own usage snippet; the docs site + API reference are consolidated in the docs issue.
- **Merge policy:** squash + delete branch. `.claude/` (agent worktrees) is git-ignored and must never be committed.

### Waves

| Wave | Issues | Depends on |
|------|--------|-----------|
| 0 Bootstrap | #1 | — |
| 1 Core primitives | #2 cep · #3 errors · #4 types | #1 |
| 2 Core runtime | #5 client · #6 reverse search | #2 #3 #4 |
| 3 Adapters (fan-out) | #7 vanilla · #8 react · #9 vue · #10 angular · #11 examples | #5 |
| 4 Distribution | #12 build · #13 docs (VitePress) · #14 release | #7–#10 |

## Distribution

Built with **tsup** into three consumption modes from one source:

- **ESM** (`dist/index.js`) — primary, tree-shakeable. Import per subpath: `mviacep`, `mviacep/react`, `mviacep/vue`, `mviacep/angular`, `mviacep/vanilla`.
- **CJS** (`dist/index.cjs`) — legacy `require()`.
- **IIFE global** (`dist/cdn/mviacep.global.js`) — a single `<script>` exposing `window.mViaCEP`. This bundle packages **core + the vanilla adapter** (so `<script>` users get `lookup`/`search` *and* DOM autofill with no build step). React/Vue/Angular adapters are npm-only and stay out of the global bundle. The CDN entry is a dedicated `src/cdn.ts` re-exporting core + vanilla (wired in #12, depends on #7).
