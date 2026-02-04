# Insights Build Pipeline Guide

## Folder Structure

```
content/insights/
  ├── README.md
  ├── insights.json (metadata index)
  ├── anxiety/
  │   └── understanding-anxiety.md
  ├── stress/
  │   └── science-of-breathing.md
  └── general/
      └── {slug}.md

public/insights/ (generated)
  ├── understanding-anxiety.html
  ├── science-of-breathing.html
  └── {slug}.html
```

## Source Content Format

### insights.json
Metadata index with all insights:
```json
{
  "version": "1.0",
  "generated": "ISO timestamp",
  "insights": [
    {
      "id": "insight-slug",
      "slug": "insight-slug",
      "title": "Insight Title",
      "summary": "Short description",
      "category": "anxiety",
      "readTime": "5 min",
      "published": "2024-01-01",
      "author": "Ride Your Demons"
    }
  ]
}
```

### {slug}.md
Markdown file with full content:
```markdown
# Insight Title

Summary paragraph.

## Section 1

Content here...

## Section 2

More content...
```

## Generator Script

**File:** `scripts/build-insights.cjs`

**Process:**
1. Reads `content/insights/insights.json` (metadata)
2. For each insight:
   - Reads `content/insights/{category}/{slug}.md` (content)
   - Generates `public/insights/{slug}.html` (output)
3. Ensures consistent nav + breadcrumbs
4. Includes SEO meta tags (canonical, OG, Twitter)

**Features:**
- Simple markdown to HTML conversion
- Consistent page structure
- Breadcrumb navigation
- Back to insights link
- SEO meta tags
- Analytics integration

## NPM Scripts

### Build Insights Only
```bash
npm run build:insights
```

### Build All Content
```bash
npm run build
```
Builds insights, gates mapping, and sitemap.

## Verification

### 1. Check Generated Pages

**Command:**
```powershell
Get-ChildItem public\insights\*.html | Select-Object Name
```

**Expected:**
- `understanding-anxiety.html`
- `science-of-breathing.html`
- `building-resilience.html`
- `mindfulness-basics.html`
- `sleep-mental-health.html`

### 2. Test Links

**Local:**
1. Start server: `npm run dev`
2. Navigate to: `http://127.0.0.1:5000/insights/understanding-anxiety`
3. Verify:
   - Page loads correctly
   - Breadcrumb shows: Home › Insights › Understanding Anxiety
   - Back to Insights link works
   - Navigation header works

**Production:**
1. Deploy to Firebase
2. Navigate to: `https://rideyourdemons.com/insights/understanding-anxiety`
3. Verify same as above

### 3. Check SEO Meta Tags

**Steps:**
1. Open generated HTML file
2. View source
3. Verify:
   - Canonical tag: `https://rideyourdemons.com/insights/{slug}`
   - OG tags present
   - Twitter tags present
   - Title includes insight title

### 4. Check Consistency

**Verify all pages have:**
- ✅ Same header navigation
- ✅ Same footer navigation
- ✅ Same breadcrumb format
- ✅ Same back link format
- ✅ Same styling

## Firebase Hosting Configuration

**File:** `firebase.json`

**Rewrite added:**
```json
{
  "source": "/insights/:slug",
  "destination": "/insights/:slug.html"
}
```

**URLs:**
- `/insights` → `/insights.html` (index)
- `/insights/understanding-anxiety` → `/insights/understanding-anxiety.html`
- `/insights/science-of-breathing` → `/insights/science-of-breathing.html`

## Adding New Insights

1. **Add metadata to `content/insights/insights.json`:**
   ```json
   {
     "id": "new-insight",
     "slug": "new-insight",
     "title": "New Insight Title",
     "summary": "Description",
     "category": "anxiety",
     "readTime": "5 min",
     "published": "2024-01-01"
   }
   ```

2. **Create markdown file:**
   - Path: `content/insights/{category}/new-insight.md`
   - Write content in markdown

3. **Build:**
   ```bash
   npm run build:insights
   ```

4. **Verify:**
   - Check `public/insights/new-insight.html` exists
   - Test link: `/insights/new-insight`

## Markdown Support

Current implementation supports:
- Headers (`#`, `##`, `###`)
- Bold (`**text**`)
- Italic (`*text*`)
- Links (`[text](url)`)
- Lists (`- item`)
- Paragraphs (double newline)

For advanced markdown features, consider using a library like `marked`:
```bash
npm install marked
```

Then update `convertMarkdownToHTML()` in `build-insights.cjs`.

## Status: ✅ Complete

- ✅ Source content structure defined
- ✅ Generator script created
- ✅ NPM scripts added
- ✅ Firebase rewrites configured
- ✅ Sample pages generated
- ✅ Consistent nav + breadcrumbs
- ✅ SEO meta tags included

