# RYD Tools Crawler

Crawls the live Ride Your Demons site (`https://rideyourdemons.com`) to extract a canonical tool registry.

## Quick Start

### Run the Crawler

```bash
node .\sandbox\build-tools-from-live.js
```

### Output Files

- **Canonical Tools**: `public/store/tools.canonical.json`
  - Array of tool objects extracted from live site
  - Used by the app loader (preferred over fallback `tools.json`)

- **Crawl Report**: `sandbox/tools-crawl-report.json`
  - Statistics: totals, failures, skipped URLs
  - Useful for debugging crawl issues

### Verify Count

Quick check of extracted tools:

```bash
# Windows PowerShell
(Get-Content public\store\tools.canonical.json | ConvertFrom-Json).Count

# Or open the file and check array length
```

### Example Tool Object

```json
{
  "id": "grounding-reset",
  "url": "https://rideyourdemons.com/tools/grounding-reset",
  "title": "Grounding Reset",
  "description": "A short reset to calm your nervous system...",
  "source": "live-site-crawl"
}
```

## How It Works

1. **Fetches Sitemap**: Gets `https://rideyourdemons.com/sitemap.xml`
2. **Handles Sitemap Index**: If sitemap contains child sitemaps, fetches all
3. **Filters URLs**: Keeps only `/tools/` and `/insights/` URLs
4. **Extracts Data**: For each URL, extracts:
   - `id`: Sanitized slug from URL
   - `url`: Canonical URL (if available)
   - `title`: From `<h1>` or `<title>`
   - `description`: From meta description or first paragraph
5. **Deduplicates**: By `id` (first successful extraction wins)
6. **Rate Limits**: 3 concurrent workers, 150ms delay between requests
7. **Retries**: 2 retries for 429/5xx errors with exponential backoff

## App Loader Behavior

The app loader (`ryd-router.js`, `ryd-navigation.js`) now:

1. **Prefers canonical**: Tries `/store/tools.canonical.json` first
2. **Falls back**: Uses `/data/tools.json` if canonical not found (404)
3. **Logs source**: `[RYD] base tools loaded: <count> (canonical|fallback)`

## Troubleshooting

### No Tools Extracted

- Check sitemap structure: `curl https://rideyourdemons.com/sitemap.xml`
- Verify URL patterns match `/tools/` or `/insights/`
- Check report file for failures

### Rate Limiting

- Increase `DELAY_MS` in crawler script
- Reduce `CONCURRENCY` if getting 429 errors

### Missing Fields

- Crawler only extracts what exists in HTML
- No invention - if field doesn't exist, it's omitted or empty
- Check report for extraction failures

## Notes

- **Truth Only**: No invented tools or fields
- **Minimal Dependencies**: Uses Node.js built-ins only
- **HTML Parsing**: Simple regex (no heavy libraries)
- **Deduplication**: By `id` field (sanitized URL slug)

