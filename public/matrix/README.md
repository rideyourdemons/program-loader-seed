# Matrix Output Contract

This folder holds artifacts produced by the SEO Matrix tooling (`/work/seo-matrix`).

## Current outputs

- **seo-matrix.json** — Node index for SEO/discovery (tools, gates, pain points)
- **resonance-nodes.json** — Node registry with resonance scores
- **resonance-drafts.json** — Link adjustments and expansion drafts

## Future outputs (documented for later wiring)

- **index JSON** — Canonical node index for search/lookup
- **sitemap** — Generated sitemap references (sitemap.xml / sitemap-index.xml live at `public/`)
- **link-map** — Tool-to-pain-point link graph
- **registry.json** — Tool registry (may live under `public/data/matrix/`)

## Generator scripts

Run from repo root:

- `npm run build:matrix` — builds seo-matrix.json
- `npm run build:resonance` — builds resonance-nodes, resonance-drafts
- `npm run generate:sitemap` — builds sitemap.xml, sitemap-index.xml

Runtime does not depend on these files being present; missing files are handled gracefully.
