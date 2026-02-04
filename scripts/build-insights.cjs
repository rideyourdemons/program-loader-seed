/**
 * Build Insights Pages
 * 
 * Generates HTML pages from markdown source content
 * - Reads content/insights/insights.json (metadata)
 * - Reads content/insights/{category}/{slug}.md (content)
 * - Generates public/insights/{slug}.html (output)
 * - Ensures consistent nav + breadcrumbs
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'insights');
const METADATA_FILE = path.join(CONTENT_DIR, 'insights.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'insights');
const BASE_URL = 'https://rideyourdemons.com';

// Template for insight page HTML
function generateInsightHTML(insight, content) {
  const slug = insight.slug || insight.id;
  const title = insight.title || 'Insight';
  const summary = insight.summary || '';
  const category = insight.category || 'general';
  const readTime = insight.readTime || '5 min';
  const published = insight.published || new Date().toISOString().split('T')[0];
  
  // Convert markdown to HTML (simple conversion)
  // For production, consider using a markdown library like 'marked'
  const htmlContent = convertMarkdownToHTML(content);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="canonical" href="${BASE_URL}/insights/${slug}">
    <title>${escapeHtml(title)} - Ride Your Demons</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="${escapeHtml(summary)}">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${escapeHtml(title)} - Ride Your Demons">
    <meta property="og:description" content="${escapeHtml(summary)}">
    <meta property="og:url" content="${BASE_URL}/insights/${slug}">
    <meta property="og:image" content="${BASE_URL}/images/og-default.jpg">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Ride Your Demons">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)} - Ride Your Demons">
    <meta name="twitter:description" content="${escapeHtml(summary)}">
    <meta name="twitter:image" content="${BASE_URL}/images/og-default.jpg">
    
    <!-- Google Tag Manager (via analytics.js) -->
    <script src="/js/analytics.js" defer></script>
    
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/integrated.css">
    <style>
        .insight-header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--color-border, #e0e0e0);
        }
        .insight-meta {
            display: flex;
            gap: 1.5rem;
            margin-top: 1rem;
            color: var(--color-text-secondary, #666);
            font-size: 0.9em;
        }
        .insight-content {
            line-height: 1.7;
            max-width: 800px;
            margin: 0 auto;
        }
        .insight-content h2 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: var(--color-accent, #667eea);
        }
        .insight-content h3 {
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
        }
        .insight-content p {
            margin-bottom: 1rem;
        }
        .insight-content ul, .insight-content ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
        }
        .insight-content li {
            margin-bottom: 0.5rem;
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <h1><a href="/" style="color: white; text-decoration: none;">Ride Your Demons</a></h1>
            <nav class="header-nav">
                <a href="/">Home</a>
                <a href="/tools">Tools</a>
                <a href="/insights">Insights</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <section class="section">
            <!-- Breadcrumb -->
            <nav aria-label="Breadcrumb" style="margin-bottom: 20px;">
                <a href="/">Home</a> › 
                <a href="/insights">Insights</a> › 
                <span>${escapeHtml(title)}</span>
            </nav>
            
            <!-- Insight Header -->
            <div class="insight-header">
                <h1>${escapeHtml(title)}</h1>
                <p style="font-size: 1.1em; color: var(--color-text-secondary, #666); margin-top: 0.5rem;">
                    ${escapeHtml(summary)}
                </p>
                <div class="insight-meta">
                    <span>Category: ${escapeHtml(category)}</span>
                    <span>Read time: ${readTime}</span>
                    <span>Published: ${published}</span>
                </div>
            </div>
            
            <!-- Insight Content -->
            <div class="insight-content">
                ${htmlContent}
            </div>
            
            <!-- Back to Insights -->
            <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--color-border, #e0e0e0);">
                <a href="/insights" style="color: var(--color-accent, #667eea); text-decoration: none;">
                    ← Back to Insights
                </a>
            </div>
        </section>
    </main>

    <footer>
        <div class="footer-content">
            <div class="footer-links">
                <a href="/">Home</a>
                <a href="/tools">Tools</a>
                <a href="/insights">Insights</a>
                <a href="/store/">Store (Coming Soon)</a>
                <a href="/about/">About</a>
            </div>
            <nav class="footer-links" aria-label="Site links" style="margin-top: var(--spacing-md);">
                <a href="/about/">About</a> ·
                <a href="/disclosures/">Disclosures</a> ·
                <a href="/ethics/">Ethics</a> ·
                <a href="/analytics/">Analytics & Privacy</a> ·
                <a href="/terms/">Terms</a>
            </nav>
            <div class="footer-copyright">
                <p>&copy; 2024 Ride Your Demons. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

// Simple markdown to HTML converter
// For production, consider using a library like 'marked'
function convertMarkdownToHTML(markdown) {
  if (!markdown) return '<p>Content coming soon.</p>';
  
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Lists (simple)
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => {
    para = para.trim();
    if (!para) return '';
    if (para.startsWith('<')) return para; // Already HTML
    return `<p>${para}</p>`;
  }).join('\n');
  
  return html;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildInsights() {
  console.log('[BUILD] Building insights pages...\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Load metadata
  if (!fs.existsSync(METADATA_FILE)) {
    console.warn('[BUILD] Metadata file not found:', METADATA_FILE);
    console.warn('[BUILD] Creating placeholder metadata...');
    
    // Create placeholder metadata
    const placeholderMetadata = {
      insights: [
        {
          id: 'understanding-anxiety',
          slug: 'understanding-anxiety',
          title: 'Understanding Anxiety',
          summary: 'Anxiety is a natural response to stress, but when it becomes overwhelming, it can interfere with daily life.',
          category: 'anxiety',
          readTime: '5 min',
          published: new Date().toISOString().split('T')[0]
        }
      ]
    };
    
    // Ensure content directory exists
    if (!fs.existsSync(CONTENT_DIR)) {
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }
    
    fs.writeFileSync(METADATA_FILE, JSON.stringify(placeholderMetadata, null, 2), 'utf8');
    console.log('[BUILD] Created placeholder metadata file\n');
  }
  
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  const insights = metadata.insights || [];
  
  console.log(`[BUILD] Found ${insights.length} insights in metadata\n`);
  
  let generated = 0;
  let skipped = 0;
  const errors = [];
  
  // Generate HTML for each insight
  insights.forEach(insight => {
    const slug = insight.slug || insight.id;
    if (!slug) {
      errors.push(`Insight missing slug/id: ${JSON.stringify(insight)}`);
      return;
    }
    
    // Read markdown content
    const category = insight.category || 'general';
    const markdownPath = path.join(CONTENT_DIR, category, `${slug}.md`);
    const fallbackPath = path.join(CONTENT_DIR, `${slug}.md`);
    
    let content = '';
    if (fs.existsSync(markdownPath)) {
      content = fs.readFileSync(markdownPath, 'utf8');
    } else if (fs.existsSync(fallbackPath)) {
      content = fs.readFileSync(fallbackPath, 'utf8');
    } else {
      // Create placeholder content
      content = `# ${insight.title || slug}\n\n${insight.summary || 'Content coming soon.'}`;
      
      // Create markdown file
      const categoryDir = path.join(CONTENT_DIR, category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      fs.writeFileSync(markdownPath, content, 'utf8');
      console.log(`[BUILD] Created placeholder markdown: ${markdownPath}`);
    }
    
    // Generate HTML
    try {
      const html = generateInsightHTML(insight, content);
      const outputPath = path.join(OUTPUT_DIR, `${slug}.html`);
      fs.writeFileSync(outputPath, html, 'utf8');
      generated++;
      console.log(`[BUILD] Generated: ${slug}.html`);
    } catch (error) {
      errors.push(`Error generating ${slug}: ${error.message}`);
      skipped++;
    }
  });
  
  // Update insights index page
  updateInsightsIndex(insights);
  
  // Print summary
  console.log('\n===== INSIGHTS BUILD COMPLETE =====');
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(err => console.error(`  - ${err}`));
  }
  
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  console.log('====================================\n');
  
  return { generated, skipped, errors };
}

function updateInsightsIndex(insights) {
  // This would update public/insights.html with the list of insights
  // For now, we'll just log that it should be updated
  console.log(`[BUILD] Note: Update public/insights.html to list ${insights.length} insights`);
}

// Run if called directly
if (require.main === module) {
  try {
    buildInsights();
  } catch (error) {
    console.error('[BUILD] Error building insights:', error);
    process.exit(1);
  }
}

module.exports = { buildInsights };

