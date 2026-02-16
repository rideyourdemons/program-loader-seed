# Platform v1 — Refactor Lane (Docs & Plan Only)

This folder is the **development lane** for future platform refactoring. It is **NOT** the deployed source yet.

## Purpose

- **Document** the refactor strategy and migration phases
- **Reference** current components and assets at repo root (`public/`, `server.cjs`, etc.)
- **Plan** for modularization; no code moves into this folder until explicitly approved

## Rules

- Do NOT move runtime code here until migration phases are complete
- Do NOT break the current app at root
- All active development runs from repo root; deploy stays at root

## Baseline

The current production app remains at root. Tag `platform-baseline-20250216` (or `baseline-before-matrix-split-*`) marks stable states.

## See Also

- `migration-plan.md` — phases, rules, and rollout strategy
