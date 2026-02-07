/**
 * Ride Your Demons™ – Automated Copyright Protection
 * Applies brand-only headers to JS/MJS, footers to HTML,
 * creates COPYRIGHT.txt, and generates private provenance evidence.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = path.join(__dirname, '..');
const YEAR = new Date().getFullYear();
const BRAND = 'Ride Your Demons™';
const DATE = new Date().toISOString();

// ✅ Public-facing ownership (no personal name in code)
const PUBLIC_OWNER = BRAND;
const COPYRIGHT_LINE = `© ${YEAR} ${PUBLIC_OWNER}. All rights reserved.`;

// ✅ Private provenance (OPTIONAL) — your name only in LEGAL/ (can be gitignored)
const PRIVATE_AUTHOR = 'Earl McGee Taylor';

const JS_HEADER = `/**
 * ${COPYRIGHT_LINE}
 */
`;

const HTML_FOOTER = `
<!--
${COPYRIGHT_LINE}
-->
`;

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'LEGAL'];

function walk(dir) {
  let results = [];
  try {
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      if (IGNORE_DIRS.some(d => full.includes(d))) continue;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) results = results.concat(walk(full));
      else results.push(full);
    }
  } catch (err) {
    // Skip directories we can't read
  }
  return results;
}

function applyJS(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(COPYRIGHT_LINE)) return;
    fs.writeFileSync(file, JS_HEADER + content, 'utf8');
    console.log(`✔ JS protected: ${path.relative(ROOT, file)}`);
  } catch (err) {
    console.warn(`⚠️  Could not protect ${path.relative(ROOT, file)}: ${err.message}`);
  }
}

function applyHTML(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(COPYRIGHT_LINE)) return;
    const updated = content.replace(/<\/body>/i, `${HTML_FOOTER}\n</body>`);
    if (updated === content) {
      // No </body> tag found, append before </html> or at end
      const updated2 = content.replace(/<\/html>/i, `${HTML_FOOTER}\n</html>`);
      if (updated2 === content) {
        // No closing tags, append at end
        fs.writeFileSync(file, content + HTML_FOOTER, 'utf8');
      } else {
        fs.writeFileSync(file, updated2, 'utf8');
      }
    } else {
      fs.writeFileSync(file, updated, 'utf8');
    }
    console.log(`✔ HTML protected: ${path.relative(ROOT, file)}`);
  } catch (err) {
    console.warn(`⚠️  Could not protect ${path.relative(ROOT, file)}: ${err.message}`);
  }
}

function createCopyrightFile() {
  const text = `
${BRAND}
${COPYRIGHT_LINE}

This repository contains original intellectual property.
All source code, systems, tools, content, and structure
are protected under copyright law.

Unauthorized use, copying, or distribution is prohibited.
`;
  fs.writeFileSync(path.join(ROOT, 'COPYRIGHT.txt'), text.trim());
  console.log('✔ COPYRIGHT.txt created');
}

function sha256File(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch (err) {
    return null;
  }
}

function createProvenanceEvidence(files) {
  const legalDir = path.join(ROOT, 'LEGAL');
  if (!fs.existsSync(legalDir)) fs.mkdirSync(legalDir, { recursive: true });

  // Hash a representative set (all JS/MJS/HTML + COPYRIGHT.txt)
  const targets = files.filter(f =>
    (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.html') || path.basename(f) === 'COPYRIGHT.txt') &&
    !f.includes('node_modules') &&
    !f.includes('.git')
  );

  const lines = [];
  lines.push(`${BRAND} — PRIVATE PROVENANCE EVIDENCE`);
  lines.push(`Author (private): ${PRIVATE_AUTHOR}`);
  lines.push(`Generated: ${DATE}`);
  lines.push('');
  lines.push('File hashes (SHA-256):');

  for (const f of targets) {
    try {
      const rel = path.relative(ROOT, f);
      const h = sha256File(f);
      if (h) {
        lines.push(`${h}  ${rel}`);
      }
    } catch (err) {
      // Skip files we can't hash
    }
  }

  const outPath = path.join(legalDir, 'PROVENANCE_EVIDENCE.txt');
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log('✔ LEGAL/PROVENANCE_EVIDENCE.txt created (private)');
}

(function run() {
  console.log('🔐 Applying brand-only copyright protection...');
  console.log('');
  
  const files = walk(ROOT);

  let jsCount = 0;
  let htmlCount = 0;

  for (const f of files) {
    if (f.endsWith('.js') || f.endsWith('.mjs')) {
      applyJS(f);
      jsCount++;
    }
    if (f.endsWith('.html')) {
      applyHTML(f);
      htmlCount++;
    }
  }

  createCopyrightFile();
  createProvenanceEvidence(files);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Protection complete (public brand + private proof).');
  console.log(`   Processed ${jsCount} JS/MJS files and ${htmlCount} HTML files.`);
  console.log('═══════════════════════════════════════════════════════════');
})();
