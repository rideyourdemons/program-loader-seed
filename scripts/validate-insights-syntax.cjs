#!/usr/bin/env node
/**
 * Validate inline <script> syntax in public/insights.html.
 * Catches mismatched parens, malformed return statements, etc.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'public', 'insights.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract inline script blocks (no src)
const scriptRegex = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let blockIndex = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  if (match[0].includes('src=')) continue;
  const code = match[1].trim();
  if (!code) continue;
  blockIndex++;
  try {
    new vm.Script(code, { filename: 'insights.html' });
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error(`[validate-insights-syntax] Syntax error in script block #${blockIndex}:`, e.message);
      process.exit(1);
    }
    throw e;
  }
}

console.log('[validate-insights-syntax] OK');
