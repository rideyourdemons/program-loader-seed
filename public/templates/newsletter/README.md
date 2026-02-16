# Newsletter Templates

HTML templates for newsletter content. **No sending pipeline yet.**

## How to Update Newsletter Content

1. Edit the HTML template (`weekly.html`) and replace placeholders:
   - `{{subject}}` — Email subject line
   - `{{headline}}` — Main headline
   - `{{intro}}` — Introductory paragraph
   - `{{featuredTools}}` — Featured tools section (HTML or plain text)
   - `{{ctaHref}}` — Call-to-action link URL
   - `{{ctaText}}` — Call-to-action link text
   - `{{footer}}` — Footer content (e.g., unsubscribe, address)

2. Use a companion JSON config (to be added) for structured content such as tool IDs, dates, and copy.

3. When the sending pipeline is implemented, these templates will be merged with live data.

## Placeholders

| Placeholder      | Purpose                    |
|------------------|----------------------------|
| `{{subject}}`    | Email subject              |
| `{{headline}}`   | Main headline              |
| `{{intro}}`      | Intro paragraph            |
| `{{featuredTools}}` | Featured tools block   |
| `{{ctaHref}}`    | CTA link URL               |
| `{{ctaText}}`    | CTA link label             |
| `{{footer}}`     | Footer block               |

## Status

- **Template structure:** Ready
- **Sending pipeline:** Not implemented
- **Operator workflow:** Edit JSON + template, then (future) run send job
