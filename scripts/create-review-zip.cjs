/**
 * Creates RYD_codebase_review.zip on the user's Desktop.
 * Includes source and config; excludes node_modules, .git, backups, logs, dist, build.
 * Run: node scripts/create-review-zip.cjs
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const desktop = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop');
const outPath = path.join(desktop, 'RYD_codebase_review.zip');

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'backups-releases',
  'backups-snapshots',
  'audit-output',
  'flawless-output',
  'dist',
  'build'
]);

const EXCLUDE_FILE_PATTERN = /\.log$/i;

function shouldExclude(relativePath) {
  const parts = relativePath.split(path.sep);
  for (const part of parts) {
    if (EXCLUDE_DIRS.has(part)) return true;
  }
  if (EXCLUDE_FILE_PATTERN.test(path.basename(relativePath))) return true;
  return false;
}

function* walkDir(dir, base = '') {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }
  for (const ent of entries) {
    const rel = base ? path.join(base, ent.name) : ent.name;
    if (shouldExclude(rel)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walkDir(full, rel);
    } else {
      yield { full, rel };
    }
  }
}

async function main() {
  let archiver;
  try {
    archiver = require('archiver');
  } catch (e) {
    console.error('archiver not found. Run: npm install archiver --save-dev');
    process.exit(1);
  }

  const output = fs.createWriteStream(outPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
      console.log('ZIP created.');
      console.log('FULL PATH:', path.resolve(outPath));
      console.log('SIZE:', sizeMB, 'MB');
      resolve();
    });
    archive.on('error', reject);
    archive.pipe(output);

    let count = 0;
    for (const { full, rel } of walkDir(projectRoot)) {
      archive.file(full, { name: rel });
      count++;
    }
    console.log('Added', count, 'files to archive.');
    archive.finalize();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
