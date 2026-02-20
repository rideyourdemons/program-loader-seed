# Tool Content Schema

Recommended schema for RYD tools. Use this for future content generation to produce mechanism-backed, non-template content.

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (e.g. `how-do-i-build-confidence-standard-practice`) |
| `slug` | string | URL-safe identifier, usually same as `id` |
| `title` | string | Human-readable title. Must NOT start with "Action:" |
| `purpose` | string | 1 paragraph describing what the tool does and when to use it |
| `steps` | string[] | Numbered, executable steps (plain language) |
| `mechanism` | string | The psychological principle in plain language (not therapist tone) |
| `howAndWhyItWorks` | string | Unique explanation tied to mechanism. No boilerplate. |
| `disclaimer` | string | Short medical/educational disclaimer |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `variants` | object | 5/15/30 min variants (5min, 15min, 30min keys) |
| `whereItCameFrom` | string | Origin, research base, or evidence |
| `duration` | string | e.g. "5 minutes", "15 minutes" |
| `difficulty` | string | "beginner" \| "intermediate" \| "advanced" |

## Anti-Patterns (Template Leaks)

- **Title** must NOT start with "Action:"
- **Slug/id** must NOT start with "action-"
- **Content** must NOT contain: INSERT, TODO, PLACEHOLDER
- **How/Why** must be unique per tool — no boilerplate reused across tools

## Mechanism-Based Content

Tools must have a real psychology mechanism behind them:
- Use plain language, not therapist tone
- Explain *why* the steps work (the mechanism)
- Avoid generic phrases: "This practice supports emotional regulation", "Use it when you need a clear, structured approach"
