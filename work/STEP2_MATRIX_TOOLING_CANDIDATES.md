# STEP 2 — Matrix/Tooling Candidates

## Already in /work/seo-matrix (moved previously)

| Path | Why safe to move |
|------|------------------|
| build-matrix.cjs | Generates public/matrix/seo-matrix.json from tools; not runtime |
| build-gates-mapping.cjs | Builds gates-painpoints-tools mapping; not runtime |
| build-insights.cjs | Generates insight HTML from markdown; not runtime |
| build-resonance.cjs | Generates resonance nodes; not runtime |
| generate-sitemap.cjs | Builds sitemap.xml; not runtime |
| seed-graph.mjs | Generates seed data; not runtime |
| matrix-runner.cjs | Matrix registry builder; not runtime |
| matrix-seed-generator.mjs | Generator; not runtime |
| matrix-hammer-*.mjs | Matrix generators; not runtime |
| remaining-matrix-*.mjs | Matrix generators; not runtime |
| process-matrix-stream.cjs | Stream processor; not runtime |
| analyze-matrix-structure.mjs | Analysis tool; not runtime |
| benchmark-matrix.mjs | Benchmark; not runtime |
| duplication-report.mjs | Report generator; not runtime |
| ryd-core-generator.mjs | Generator; not runtime |
| upload-cedar-matrix.mjs | Upload tool; not runtime |

## Still at root (runtime or shared — DO NOT MOVE)

| Path | Why stay |
|------|----------|
| public/ | Runtime static assets |
| server.cjs | Runtime server |
| index.html | Root entry |
| core/ | Matrix engine used by server at runtime |
| site_controller.mjs | Server imports this |
| config/ | Shared by matrix tooling and others |
| content/ | Shared; build-insights reads from here |
| scripts/build-matrix.cjs | build:legacy uses it (different from work/seo-matrix/build-matrix.cjs) |
| scripts/build-tools-canonical.cjs | Build pipeline; could move later |
| firebase.json | Deploy config |
