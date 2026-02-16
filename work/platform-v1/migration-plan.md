# Platform v1 Migration Plan

## Phases

### Phase 1 — Matrix Split (DONE)

- Move non-runtime matrix tooling to `/work/seo-matrix`
- Keep `public/`, `server.cjs`, `core/` at root
- Matrix outputs go to `public/matrix/`; tooling runs from `work/seo-matrix`

### Phase 2 — Platform Lane (Current)

- Create `/work/platform-v1` as docs/plan only
- No code moves
- Runtime stays at root

### Phase 3 — Incremental Migration (Future)

- Move platform code into `work/platform-v1` in micro-batches
- After each batch: verify `npm run dev` and `npm run build` from root
- Update `firebase.json` hosting path only when platform-v1 is deploy-ready

### Phase 4 — Deploy Switch (Future)

- Point `firebase.json` at `work/platform-v1/public` (or equivalent)
- Root becomes workspace controller only

## Rules

1. **Non-destructive**: Every change must be reversible
2. **Verify after each batch**: Run build or dev before committing
3. **No runtime moves** until platform-v1 is proven runnable on its own
4. **Use `git mv`** for all moves
5. **Document** what moved and what stayed in each phase
