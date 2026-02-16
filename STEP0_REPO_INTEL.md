# STEP 0 — REPO INTEL (NO CHANGES)

## A) Root Folder Tree (2 levels)

```
.cursor/    .husky/     .vscode/     ._archive/
config/     content/    core/        docs/
generated_gates/  js/   logs/        node_modules/
public/     RYD_GENERATED_GATES/  RYD_MATRIX/  sandbox/
scripts/    shards/     site/        tests/
tools/      utils/      work/        _archive/
index.html  package.json  package-lock.json  server.cjs  firebase.json  ...
```

## B) Package Manager & Framework

- **Package manager:** npm (`package-lock.json` present)
- **Framework:** Static HTML/JS + Express (NOT Vite/Next/CRA)
  - Express server serves `public/`
  - Firebase hosting targets `public/`
  - No build step for frontend; static assets

## C) Runtime Entrypoints

| Entrypoint | Location | Purpose |
|------------|----------|---------|
| Server | `server.cjs` (root) | Express app, serves public, API routes |
| Static site | `public/` (root) | index.html, insights.html, tools, gates, data, matrix |
| Matrix engine | `site_controller.mjs` + `core/` | Substrate, shard_manager |

## D) Matrix / Tooling Locations

| Category | Location |
|----------|----------|
| Matrix scripts | `work/seo-matrix/` (already moved) |
| Build scripts | `work/seo-matrix/build-matrix.cjs`, build-gates-mapping, etc. |
| Sitemap | `work/seo-matrix/generate-sitemap.cjs` |
| Shared config | `config/` (root) |
| Shared content | `content/` (root) |

## E) Proposed MOVE Plan (MINIMAL, REVERSIBLE)

**Decision:** Do NOT move platform runtime (public, server, core). Risk of breaking server imports, Firebase, and matrix output paths is high. Use **minimal split**:

1. **work/platform-v1** — Add `package.json` with `dev` that invokes root `server.cjs`. Platform "runs from" this folder; files stay at root.
2. **work/seo-matrix** — Add `package.json` with `matrix:dry`, `matrix:build`. Scripts already present.
3. **Root** — Add `dev:platform`, `build:platform`, `dry:matrix`, `build:matrix` that `cd` into work folders.
4. **Workspaces** — Skip (too risky for this stack). Use simple `cd`-based root scripts.

**No git mv of platform files.** Matrix scripts already in work/seo-matrix.
