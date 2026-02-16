# Operator Config — CONFIG-FIRST Control Layer

Config files that control site behavior without code changes. **Runtime integration will come in a separate task.** These files define the schema and defaults only.

## Files

| File | Purpose |
|------|---------|
| `site-settings.json` | Theme defaults, feature flags, operator preferences |
| `gate-styles.json` | Per-gate flame/glow colors (single-tone, no rainbow) |
| `tool-of-the-day.json` | Featured tool selection and display copy |

## site-settings.json

- **version** — Schema version
- **theme** — `backgroundMode`, `cardOpacity`, `textContrast`
- **flags** — `enableMatrix`, `enableToolOfDay`, `enableNewsletter`
- **operator** — `timezone`, `rotationPolicy`

Edit this file to change global theme and feature toggles. No server restart required once runtime integration exists.

## gate-styles.json

- **defaults** — Fallback flame/glow tokens for gates without overrides
- **gates** — Map of `gateSlug` → `{ flameGlow, borderGlow, underlineGlow }`

Uses single-tone flame colors (no rainbow, no cycling). Add new gate slugs under `gates` to customize per-gate styling.

## tool-of-the-day.json

- **mode** — `"manual"` or `"rotation"`
- **manualToolId** — Tool ID when `mode` is `"manual"`
- **rotation** — `seed`, `cadence`, `categories` for rotation mode
- **display** — `title`, `subtitle`, `ctaText`, `ctaHref`

Edit this file to feature a different tool or change display copy. Runtime will fetch and apply these values.

## Integration

- These configs are **not yet wired** into server or frontend.
- A future task will add loading and application of these values.
- Until then, edits here have no runtime effect.
