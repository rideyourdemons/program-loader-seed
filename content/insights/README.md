# Insights Content Source

This directory contains source content for insights pages.

## Structure

```
content/insights/
  ├── README.md (this file)
  ├── insights.json (metadata index)
  └── {category}/
      └── {slug}.md (markdown content)
```

## Content Format

### insights.json
Metadata index with all insights:
```json
{
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

## Build Process

Run `npm run build:insights` to generate HTML pages from source content.

