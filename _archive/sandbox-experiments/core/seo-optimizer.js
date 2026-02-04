/**
 * SEO Optimization Engine
 * Handles all SEO-related functionality for maximum organic traffic
 */

import { logger } from './logger.js';

export class SEOOptimizer {
  constructor() {
    this.defaultMeta = {
      siteName: 'Ride Your Demons',
      siteUrl: 'https://rideyourdemons.com',
      defaultTitle: 'Ride Your Demons - Free Mental Health Tools',
      defaultDescription: 'Free, research-backed mental health tools. No signup required. Evidence-based techniques for anxiety, depression, stress, and more.',
      defaultImage: 'https://rideyourdemons.com/images/og-default.jpg'
    };
  }

  /**
   * Generate optimized title tag
   * @param {Object} options - { primaryKeyword, secondaryKeyword, pageType }
   * @returns {string}
   */
  generateTitle(options = {}) {
    const { primaryKeyword, secondaryKeyword, pageType = 'page' } = options;
    
    if (primaryKeyword) {
      if (secondaryKeyword) {
        return `${primaryKeyword} | ${secondaryKeyword} - Ride Your Demons`;
      }
      return `${primaryKeyword} | Free Mental Health Tools - Ride Your Demons`;
    }
    
    return this.defaultMeta.defaultTitle;
  }

  /**
   * Generate optimized meta description
   * @param {Object} options - { description, keyword, cta }
   * @returns {string}
   */
  generateMetaDescription(options = {}) {
    const { description, keyword, cta = 'Start immediately' } = options;
    
    let metaDesc = description || this.defaultMeta.defaultDescription;
    
    if (keyword && !metaDesc.toLowerCase().includes(keyword.toLowerCase())) {
      metaDesc = `${keyword}. ${metaDesc}`;
    }
    
    // Ensure 150-160 characters
    if (metaDesc.length > 160) {
      metaDesc = metaDesc.substring(0, 157) + '...';
    }
    
    return metaDesc;
  }

  /**
   * Generate FAQ Schema markup
   * @param {Array} faqs - Array of { question, answer }
   * @returns {Object}
   */
  generateFAQSchema(faqs = []) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };
  }

  /**
   * Generate Article Schema markup
   * @param {Object} article - { title, description, author, datePublished, dateModified }
   * @returns {Object}
   */
  generateArticleSchema(article) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.title,
      'description': article.description,
      'author': {
        '@type': 'Organization',
        'name': 'Ride Your Demons'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Ride Your Demons',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://rideyourdemons.com/images/logo.png'
        }
      },
      'datePublished': article.datePublished || new Date().toISOString(),
      'dateModified': article.dateModified || new Date().toISOString(),
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': article.url || this.defaultMeta.siteUrl
      }
    };
  }

  /**
   * Generate Breadcrumb Schema
   * @param {Array} breadcrumbs - Array of { name, url }
   * @returns {Object}
   */
  generateBreadcrumbSchema(breadcrumbs = []) {
    const items = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': this.defaultMeta.siteUrl
      },
      ...breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        'position': index + 2,
        'name': crumb.name,
        'item': crumb.url
      }))
    ];

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items
    };
  }

  /**
   * Generate HowTo Schema for tools
   * @param {Object} tool - { name, description, steps, totalTime }
   * @returns {Object}
   */
  generateHowToSchema(tool) {
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': tool.name,
      'description': tool.description,
      'totalTime': tool.totalTime || 'PT15M',
      'step': tool.steps.map((step, index) => ({
        '@type': 'HowToStep',
        'position': index + 1,
        'name': step.name,
        'text': step.description,
        'image': step.image || undefined
      }))
    };
  }

  /**
   * Generate Organization Schema
   * @returns {Object}
   */
  generateOrganizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Ride Your Demons',
      'url': this.defaultMeta.siteUrl,
      'logo': 'https://rideyourdemons.com/images/logo.png',
      'description': 'Free, research-backed mental health tools and resources',
      'sameAs': [
        // Add social media URLs when available
      ]
    };
  }

  /**
   * Generate complete SEO meta tags for a page
   * @param {Object} pageData - { title, description, keywords, url, image, type }
   * @returns {Object}
   */
  generateMetaTags(pageData) {
    const title = this.generateTitle({
      primaryKeyword: pageData.title,
      secondaryKeyword: pageData.secondaryKeyword
    });
    
    const description = this.generateMetaDescription({
      description: pageData.description,
      keyword: pageData.keywords?.[0]
    });
    
    const url = pageData.url || this.defaultMeta.siteUrl;
    const image = pageData.image || this.defaultMeta.defaultImage;
    const type = pageData.type || 'website';

    return {
      title,
      description,
      'og:title': title,
      'og:description': description,
      'og:url': url,
      'og:image': image,
      'og:type': type,
      'og:site_name': this.defaultMeta.siteName,
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
      'canonical': url,
      'keywords': pageData.keywords?.join(', ') || '',
      'author': 'Ride Your Demons',
      'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    };
  }

  /**
   * Inject SEO meta tags into HTML head
   * @param {Object} metaTags - Meta tags object
   * @returns {string} - HTML string
   */
  injectMetaTags(metaTags) {
    let html = '';
    
    // Title
    html += `<title>${this.escapeHtml(metaTags.title)}</title>\n`;
    
    // Meta tags
    html += `<meta name="description" content="${this.escapeHtml(metaTags.description)}">\n`;
    if (metaTags.keywords) {
      html += `<meta name="keywords" content="${this.escapeHtml(metaTags.keywords)}">\n`;
    }
    html += `<meta name="author" content="${this.escapeHtml(metaTags.author || 'Ride Your Demons')}">\n`;
    html += `<meta name="robots" content="${this.escapeHtml(metaTags.robots || 'index, follow')}">\n`;
    
    // Open Graph
    html += `<meta property="og:title" content="${this.escapeHtml(metaTags['og:title'])}">\n`;
    html += `<meta property="og:description" content="${this.escapeHtml(metaTags['og:description'])}">\n`;
    html += `<meta property="og:url" content="${this.escapeHtml(metaTags['og:url'])}">\n`;
    html += `<meta property="og:image" content="${this.escapeHtml(metaTags['og:image'])}">\n`;
    html += `<meta property="og:type" content="${this.escapeHtml(metaTags['og:type'])}">\n`;
    html += `<meta property="og:site_name" content="${this.escapeHtml(metaTags['og:site_name'])}">\n`;
    
    // Twitter Card
    html += `<meta name="twitter:card" content="${this.escapeHtml(metaTags['twitter:card'])}">\n`;
    html += `<meta name="twitter:title" content="${this.escapeHtml(metaTags['twitter:title'])}">\n`;
    html += `<meta name="twitter:description" content="${this.escapeHtml(metaTags['twitter:description'])}">\n`;
    html += `<meta name="twitter:image" content="${this.escapeHtml(metaTags['twitter:image'])}">\n`;
    
    // Canonical
    html += `<link rel="canonical" href="${this.escapeHtml(metaTags.canonical)}">\n`;
    
    return html;
  }

  /**
   * Inject structured data (JSON-LD) into HTML
   * @param {Object} schema - Schema object
   * @returns {string} - HTML script tag
   */
  injectStructuredData(schema) {
    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>\n`;
  }

  /**
   * Generate sitemap URL entry
   * @param {Object} page - { url, lastmod, changefreq, priority }
   * @returns {Object}
   */
  generateSitemapEntry(page) {
    return {
      loc: page.url,
      lastmod: page.lastmod || new Date().toISOString().split('T')[0],
      changefreq: page.changefreq || 'weekly',
      priority: page.priority || 0.8
    };
  }

  /**
   * Generate complete sitemap XML
   * @param {Array} pages - Array of page objects
   * @returns {string} - XML string
   */
  generateSitemap(pages = []) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add homepage
    xml += '  <url>\n';
    xml += `    <loc>${this.defaultMeta.siteUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    // Add all pages
    pages.forEach(page => {
      const entry = this.generateSitemapEntry(page);
      xml += '  <url>\n';
      xml += `    <loc>${entry.loc}</loc>\n`;
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate robots.txt content
   * @param {Object} options - { allow, disallow, sitemap }
   * @returns {string}
   */
  generateRobotsTxt(options = {}) {
    const allow = options.allow || ['/'];
    const disallow = options.disallow || ['/admin/', '/api/'];
    const sitemap = options.sitemap || `${this.defaultMeta.siteUrl}/sitemap.xml`;
    
    let txt = 'User-agent: *\n';
    
    allow.forEach(path => {
      txt += `Allow: ${path}\n`;
    });
    
    disallow.forEach(path => {
      txt += `Disallow: ${path}\n`;
    });
    
    txt += `\nSitemap: ${sitemap}\n`;
    
    return txt;
  }

  /**
   * Extract keywords from text
   * @param {string} text
   * @returns {Array}
   */
  extractKeywords(text) {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Count frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Escape HTML for safe insertion
   * @param {string} text
   * @returns {string}
   */
  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Track SEO event (for analytics)
   * @param {string} eventType - 'page_view', 'tool_usage', 'search', etc.
   * @param {Object} data - Event data
   */
  trackSEOEvent(eventType, data = {}) {
    // Send events to GTM dataLayer if available
    if (typeof globalThis !== 'undefined') {
      globalThis.dataLayer = globalThis.dataLayer || [];
      if (Array.isArray(globalThis.dataLayer)) {
        globalThis.dataLayer.push({
          event: eventType,
          ...data,
          event_category: 'SEO',
          event_label: data.label || eventType
        });
      }
    }
    
    logger.info(`SEO Event: ${eventType}`, data);
  }
}

export default new SEOOptimizer();

