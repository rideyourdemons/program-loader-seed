# Platform v1 Target Structure

## Current Layout

```
work/platform-v1/
├── README.md
├── migration-plan.md
├── WORKING_DIRECTORY_RULE.md
├── STRUCTURE.md
├── package.json
├── app/              # (later) migrated runtime app code
├── assets/           # (later) migrated assets that belong to platform
├── styles/           # safe CSS experiments + UI polish
├── ui/               # components library (if you go modular)
├── adapters/         # wrappers that read from root until cutover
├── tests/            # smoke tests for Platform v1
├── components/       # (legacy placeholder)
├── config/           # (legacy placeholder)
└── views/            # (legacy placeholder)
```

## Folder Purposes

| Folder | Purpose |
|--------|---------|
| `app/` | Migrated runtime app code (server entry, routes, etc.) |
| `assets/` | Migrated static assets that belong to platform |
| `styles/` | Safe CSS experiments and UI polish |
| `ui/` | Component library (if going modular) |
| `adapters/` | Wrappers that read from root until cutover |
| `tests/` | Smoke tests for Platform v1 |

## Repo Context (READ-ONLY)

Root runtime stays untouched. This lane references:

- `public/` — current runtime assets
- `core/` — current runtime core
- `server.cjs` — current server
