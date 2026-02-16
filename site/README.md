# Site — minimal runnable copy

Clean workspace copy of the web app. Original repo stays untouched.

## Run locally

```bash
cd site
npm install
npm run dev
```

- **URL:** http://localhost:3000  
- **Alternative port:** `PORT=3001 npm run dev` (Windows: `set PORT=3001 && npm run dev`)

## Build

No build step. Static HTML/JS/CSS in `public/` are served as-is.

## Deploy

- **Firebase:** From repo root, `firebase deploy` (hosting root = `public/`). This copy in `site/public` matches that.
- **Other:** Upload `site/public` to any static host; use `site/server.cjs` if you need the same routes (e.g. /insights, /store) without Firebase.

## QA checklist (verify after run)

- [ ] Page loads at http://localhost:3000 (no console errors)
- [ ] Tour click (on /insights) = no error
- [ ] Search click/field = opens search UI
- [ ] Store click = shows “Coming Soon”
- [ ] 12 gates render on /insights
- [ ] Nav (Home, Tools, Insights, Gates, Search, Store) works
