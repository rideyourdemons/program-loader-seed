/**
 * Git History Security Audit
 * 
 * Scans git history for potential secrets and sensitive information
 * Run: node scripts/audit-git-history.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Scanning Git History for Secrets...\n');

const secrets = [];
const warnings = [];

// Patterns to search for
const secretPatterns = [
  { name: 'GTM Container ID', pattern: /GTM-[A-Z0-9]{7,}/g },
  { name: 'GA4 Measurement ID', pattern: /G-[A-Z0-9]{10,}/g },
  { name: 'API Key (generic)', pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"]?([A-Za-z0-9_-]{20,})['"]?/gi },
  { name: 'OpenAI API Key', pattern: /sk-[A-Za-z0-9]{32,}/g },
  { name: 'GitHub Token', pattern: /ghp_[A-Za-z0-9]{36}/g },
  { name: 'Slack Token', pattern: /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{32}/g },
  { name: 'Firebase API Key', pattern: /AIza[0-Za-z0-9_-]{35}/g },
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'Local Windows Path', pattern: /C:\\\\Users\\\\[^\\\\]+/g },
  { name: 'Local Mac Path', pattern: /\/Users\/[^\/]+/g },
  { name: '.env file content', pattern: /\.env[\s\S]{0,200}/g }
];

function scanGitHistory() {
  console.log('📜 Checking Git History...\n');
  
  try {
    // Get all commits
    const commits = execSync('git log --all --oneline', { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 50); // Check last 50 commits
    
    console.log(`Found ${commits.length} recent commits to scan\n`);
    
    for (const commit of commits) {
      const commitHash = commit.split(' ')[0];
      
      try {
        // Get files changed in this commit
        const files = execSync(`git diff-tree --no-commit-id --name-only -r ${commitHash}`, { encoding: 'utf8' })
          .split('\n')
          .filter(f => f.trim() && !f.includes('node_modules'));
        
        for (const file of files) {
          if (!fs.existsSync(file)) continue;
          
          try {
            // Get file content at this commit
            const content = execSync(`git show ${commitHash}:${file}`, { encoding: 'utf8' });
            
            // Check for secrets
            secretPatterns.forEach(({ name, pattern }) => {
              const matches = content.match(pattern);
              if (matches) {
                matches.forEach(match => {
                  // Don't flag example/template files
                  if (file.includes('.example') || file.includes('template') || file.includes('example')) {
                    return;
                  }
                  
                  secrets.push({
                    type: name,
                    file,
                    commit: commitHash,
                    match: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
                    severity: name.includes('GTM') || name.includes('GA4') ? 'medium' : 'high'
                  });
                });
              }
            });
          } catch (err) {
            // File might have been deleted, skip
          }
        }
      } catch (err) {
        // Skip if commit can't be read
      }
    }
  } catch (error) {
    console.error('Error scanning git history:', error.message);
    return;
  }
}

function scanCurrentFiles() {
  console.log('📁 Scanning Current Files...\n');
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (['node_modules', '.git', 'dist', 'build', '_archive'].includes(file.name)) {
          continue;
        }
        scanDirectory(path.join(dir, file.name));
      } else {
        const filePath = path.join(dir, file.name);
        
        // Skip binary files
        if (file.name.match(/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|pdf|zip|tar|gz)$/i)) {
          continue;
        }
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          secretPatterns.forEach(({ name, pattern }) => {
            const matches = content.match(pattern);
            if (matches) {
              matches.forEach(match => {
                // Skip if in .gitignore or example files
                if (filePath.includes('.example') || filePath.includes('node_modules')) {
                  return;
                }
                
                // Check if it's already using env vars
                if (content.includes('process.env') || content.includes('window.RYD_ANALYTICS_CONFIG')) {
                  return;
                }
                
                warnings.push({
                  type: name,
                  file: filePath,
                  match: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
                  severity: name.includes('GTM') || name.includes('GA4') ? 'medium' : 'high'
                });
              });
            }
          });
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }
  }
  
  scanDirectory('.');
}

// Run scans
scanGitHistory();
scanCurrentFiles();

// Report results
console.log('='.repeat(60));
console.log('🔒 SECURITY AUDIT RESULTS');
console.log('='.repeat(60));

if (secrets.length > 0) {
  console.log(`\n⚠️  SECRETS FOUND IN GIT HISTORY: ${secrets.length}\n`);
  
  const byType = {};
  secrets.forEach(secret => {
    if (!byType[secret.type]) byType[secret.type] = [];
    byType[secret.type].push(secret);
  });
  
  Object.entries(byType).forEach(([type, items]) => {
    console.log(`\n${type} (${items.length} occurrences):`);
    items.slice(0, 5).forEach(item => {
      console.log(`  - ${item.file} (commit: ${item.commit.substring(0, 7)})`);
      console.log(`    Match: ${item.match}`);
    });
    if (items.length > 5) {
      console.log(`  ... and ${items.length - 5} more`);
    }
  });
  
  console.log('\n🚨 ACTION REQUIRED:');
  console.log('  1. Rotate any exposed keys/IDs');
  console.log('  2. Use git filter-repo to remove from history');
  console.log('  3. Force push (if repository is private)');
} else {
  console.log('\n✅ No secrets found in git history');
}

if (warnings.length > 0) {
  console.log(`\n⚠️  HARDCODED VALUES IN CURRENT FILES: ${warnings.length}\n`);
  
  const byType = {};
  warnings.forEach(warning => {
    if (!byType[warning.type]) byType[warning.type] = [];
    byType[warning.type].push(warning);
  });
  
  Object.entries(byType).forEach(([type, items]) => {
    console.log(`\n${type} (${items.length} occurrences):`);
    items.slice(0, 5).forEach(item => {
      console.log(`  - ${item.file}`);
      console.log(`    Match: ${item.match}`);
    });
    if (items.length > 5) {
      console.log(`  ... and ${items.length - 5} more`);
    }
  });
  
  console.log('\n💡 RECOMMENDATION:');
  console.log('  Update these files to use environment variables');
} else {
  console.log('\n✅ No hardcoded secrets in current files');
}

console.log('\n' + '='.repeat(60));
console.log('📋 Next Steps:');
console.log('  1. Review the findings above');
console.log('  2. Rotate any exposed keys');
console.log('  3. Update files to use environment variables');
console.log('  4. Enable GitHub Secret Scanning');
console.log('='.repeat(60));
