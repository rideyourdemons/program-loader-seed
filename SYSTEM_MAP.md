# System Map — Ride Your Demons Web App

## Framework & serving
- **Framework:** Static HTML + Express (Node). No Next/Vite/CRA/Astro.
- **Dev server:** `node server.cjs` (Express). Port 3000.
- **Alternative static server:** `node scripts/serve-public.cjs` (port 5173). No API.
- **Hosting:** Firebase Hosting optional (`firebase.json`); `public` is the hosting root.

## App root and build
- **App root:** repo root (where `package.json` and `server.cjs` live).
- **Build output:** None. `public/` is served as-is. Scripts like `build:matrix` produce data under `public/matrix` and `public/data`.

## Routes (canonical)
| Route       | Served as              | Notes                    |
|------------|------------------------|--------------------------|
| `/`        | `public/index.html`    | Home                     |
| `/insights`| `public/insights.html` | Search, tour, 12 gates    |
| `/tools`   | `public/tools.html`    | Tool list                |
| `/search`  | `public/search.html`   | Search UI                |
| `/gates`   | `public/gates/index.html` | Gate list             |
| `/store`   | `public/store/index.html` | Store — Coming Soon   |

Express in `server.cjs` defines `/`, `/insights`, `/tools`, `/search` explicitly; `/gates` and `/store` are served via static from `public/` (if mounted) or need explicit routes.

## Key UI modules
- **Header/nav:** In `public/index.html` and `public/insights.html`. Should include: Home, Tools, Insights, Gates, Search, **Store (Coming Soon)**, and **Tour** button on insights.
- **12 anchors/gates:** Rendered on `/insights` from `public/data/gates.json` into `#gatesGrid` (12 gate cards).
- **Search:** On `/insights`: `#searchSection`, `#searchForm`, `handleSearch`, `handleSearchInput`.
- **Tour:** On `/insights`: Tour button, `startTour()`, `showTourStep()`, overlay. Must never throw (safe stub if needed).
- **Storefront:** `public/store/index.html` — “Store — Coming Soon”. Linked from nav as Store (Coming Soon).

## Entrypoints
- **Primary:** `public/index.html` (home).
- **Full experience:** `public/insights.html` (search, tour, tool of the day, 12 gates).
- **Server:** `server.cjs` (Express); optional `scripts/serve-public.cjs` (static only).
