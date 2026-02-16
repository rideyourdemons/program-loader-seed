#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '..', 'public', 'insights.html');

let html = readFileSync(file, 'utf8');

// Replace mojibake patterns (corrupted UTF-8 emoji) with plain ASCII
// 1. tool-meta spans (Duration, Level) - already done in previous run
// 2. Emergency warning emoji - replace <strong>X Emergency</strong> pattern
// Match any chars (including mojibake) between <strong> and Emergency
html = html.replace(
  /<strong>[^<]*Emergency:<\/strong>/g,
  '<strong>Emergency:</strong>'
);
html = html.replace(
  /<strong>[^<]*Emergency Situations:<\/strong>/g,
  '<strong>Emergency Situations:</strong>'
);

// 3. JS template strings: mojibake before ${tool.duration and badge
html = html.replace(
  /<span>[^D$]+\$\{tool\.duration/g,
  '<span>Duration: ${tool.duration'
);
html = html.replace(
  /<span>[^L$]+<span class="badge badge-\$\{tool\.difficulty\}">/g,
  '<span>Level: <span class="badge badge-${tool.difficulty}">'
);

// 4. View Full Research arrow (mojibake arrow)
html = html.replace(
  /View Full Research [^\s<]+/g,
  'View Full Research &rarr;'
);

writeFileSync(file, html, 'utf8');
console.log('Fixed mojibake in insights.html');
