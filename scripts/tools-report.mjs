#!/usr/bin/env node
/**
 * Print tools build report (counts, top fail reasons).
 * Reads public/data/tools.report.json and optionally tools.pass.json / tools.draft.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'public', 'data', 'tools.report.json');

function run() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.log('No tools.report.json found. Run: npm run tools:build');
    process.exit(0);
  }
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const md = [
    '# RYD Tools Report',
    '',
    '| Metric | Count |',
    '|--------|-------|',
    `| Total processed | ${report.total} |`,
    `| Pass | ${report.pass} |`,
    `| Draft (needs content) | ${report.draft} |`,
    `| Skipped (resume) | ${report.skipped || 0} |`,
    '',
    '## Top failing reasons',
    ''
  ];
  (report.topFailReasons || []).forEach(([reason, count]) => {
    md.push(`- ${reason}: ${count}`);
  });
  md.push('', 'Generated: ' + report.generated);
  console.log(md.join('\n'));
  console.log('\n[tools-report] Report JSON:', REPORT_PATH);
  process.exit(0);
}

run();
