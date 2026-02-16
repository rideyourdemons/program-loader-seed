# Ride Your Demons — Project Guide for Interactive Learning

*Drop this document into BookLM, a notebook, or any AI chat to explore what this project does and how to use it.*

---

## What Is This Project?

This is the **Program Loader Seed** — a full-stack system that powers **Ride Your Demons (RYD)**, a free mental health tools platform. It combines:

1. **A website code auditor** — read-only analysis of codebases
2. **A compliance and matrix engine** — connects mental health content (gates, pain points, tools) to users
3. **A Ride Your Demons web app** — search, tools, insights, and guided tours

---

## The Ride Your Demons Platform

RYD delivers **free, research-backed mental health tools** with no signup. Users can:

- **Search** for challenges (depression, anxiety, stress)
- **Browse tools** by pain point (e.g., “How do I stop feeling numb?”, “How do I overcome anxiety?”)
- **Use tools** (breathing exercises, grounding, step-by-step practices)
- **Take a guided tour** of the platform

**Data structure:**
- **Gates** — categories (Men’s Mental Health, Women’s Mental Health, Addiction Recovery, Fathers & Sons, Grief & Loss, etc.)
- **Pain Points** — specific challenges under each gate
- **Tools** — techniques mapped to pain points (from `tools.json`, `tools-canonical.json`)

---

## Running the Site Locally

```bash
npm run dev
# or
node server.cjs
```

Then open **http://localhost:3000**

- **Home:** `/`
- **Insights (search + tools):** `/insights`
- **Tools:** `/tools`

---

## NPM Scripts — What Each Command Does

### Development & Running

| Command | What it does |
|--------|---------------|
| `npm run dev` | Starts the local server (Express) on port 3000 |
| `npm run start` | Same as dev |
| `npm run dev:sandbox` | Runs sandbox preview on port 3001 |
| `npm run dev:open` | Starts dev server and opens browser |
| `npm run dev:clean` | Resets and restarts dev environment |
| `npm run dev:doctor` | Diagnoses dev setup issues |

### Build & Validation

| Command | What it does |
|--------|---------------|
| `npm run build` | Builds the SEO matrix (`build:matrix`) |
| `npm run build:legacy` | Full legacy build: tools, matrix, gates, insights, sitemap |
| `npm run build:tools` | Builds `tools-canonical.json` |
| `npm run build:matrix` | Builds SEO matrix from tools data |
| `npm run build:mapping` | Builds gates mapping |
| `npm run build:insights` | Builds insights pages from markdown |
| `npm run build:resonance` | Builds resonance/node registry |
| `npm run generate:sitemap` | Generates sitemap |
| `npm run validate` | Runs all validation scripts |
| `npm run validate:content` | Validates content |
| `npm run validate:tools` | Validates tools JSON |
| `npm run validate:mapping` | Validates gates mapping |

### Auditing & Analysis

| Command | What it does |
|--------|---------------|
| `npm run audit-website` | Launches browser, lets you log in, performs read-only code audit |
| `npm run audit:site` | Site audit script |
| `npm run audit:ui` | UI audit |
| `npm run audit:guardrails` | Production guardrails check |
| `npm run audit:all` | Full audit pipeline |
| `npm run guided-audit` | Guided audit flow |
| `npm run analyze` | Code analysis tool |

### Remote Access & Firebase

| Command | What it does |
|--------|---------------|
| `npm run remote-access` | Interactive CLI for website/API/SSH access (read-only by default) |
| `npm run open-auth` | Opens auth flow |
| `npm run integrated-access` | Integrated access |
| `npm run local-access` | Local access |
| `npm run firebase-monitor` | Monitors Firebase |
| `npm run firebase-diagnostics` | Firebase diagnostics |
| `npm run check-website` | Manual website health check |

### Testing & Smoke

| Command | What it does |
|--------|---------------|
| `npm run smoke` | Full smoke test (checks + run) |
| `npm run smoke:dev` | Starts dev server and opens browser |
| `npm run smoke:checks` | Lint/typecheck |
| `npm run smoke:run` | Endpoint/route validation |
| `npm run smoke:launch` | Smoke test launch |
| `npm run test-all` | Runs all system tests |

### Deployment & Integration

| Command | What it does |
|--------|---------------|
| `npm run deploy:ryd` | Deploy RYD system |
| `npm run deploy:redesign` | Deploy redesign |
| `npm run deploy:clean` | Clean deploy |
| `npm run integrate-ryd` | Integrate RYD code |
| `npm run integrate-to-ryd-site` | Integrate to RYD site |
| `npm run integrate-platform-overlay` | Integrate platform overlay |
| `npm run verify-live` | Verify live site |

### Utilities & Fixes

| Command | What it does |
|--------|---------------|
| `npm run site-doctor` | Site doctor tool |
| `npm run site-doctor:fix` | Site doctor with auto-fix |
| `npm run doctor:insights` | Insights doctor |
| `npm run doctor:routes` | Routes doctor |
| `npm run fix:pain-points` | Fix pain points data |
| `npm run fix-matrix-structure` | Fix matrix structure |
| `npm run check-ga4` | Check GA4 setup |
| `npm run extract-styles` | Extract styles from live site |

---

## Key Files & Folders

| Path | Purpose |
|------|---------|
| `server.cjs` | Express server; serves HTML, API, static files |
| `public/insights.html` | Main insights page: search, Tool of the Day, pain points, tools grid |
| `public/tools.html` | Tools listing page |
| `public/js/matrix-expander.js` | Loads gates, pain points, tools; maps tools to pain points |
| `public/data/gates.json` | Gate definitions |
| `public/data/pain-points.json` | Pain points by gate |
| `public/data/tools.json` | Tool registry (seed) |
| `public/data/tools-canonical.json` | Full tool registry |
| `core/` | Core modules (audit, Matrix, navigation, etc.) |
| `scripts/` | CLI scripts (audit, build, validate, deploy) |

---

## Security Model

- **Read-only by default** — no writes without explicit authorization
- **Credentials in memory only** — never saved to disk
- **Full audit trail** — operations logged
- **Session expiration** — credentials expire after 30 minutes

---

## How to Learn More

**Ask questions like:**
- “What does the matrix expander do?”
- “How do I run a code audit?”
- “What’s the difference between tools.json and tools-canonical.json?”
- “How do pain points map to tools?”
- “What validations are available?”
- “How do I deploy to production?”

---

*This project powers Ride Your Demons — free mental health tools for everyone.*
