#!/bin/bash
# Git History Secret Scrubbing Script
# WARNING: This rewrites git history. Only use on private repositories.
# Always backup first: git clone --mirror <repo-url> backup-repo.git

set -e

echo "🛡️  Git History Secret Scrubbing"
echo "=================================="
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "⚠️  Only proceed if repository is PRIVATE"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo not found"
    echo "Install with: pip install git-filter-repo"
    echo "Or: brew install git-filter-repo"
    exit 1
fi

echo ""
echo "📋 Creating replacements file..."

# Create replacements file
cat > /tmp/replacements.txt << EOF
GTM-M8KF4XF==>GTM-REMOVED
GTM-TEST==>GTM-TEST-REMOVED
G-[A-Z0-9]{10,}==>G-REMOVED
EOF

echo "✅ Replacements file created"
echo ""
echo "🔍 Scanning for secrets..."

# Scan for secrets first
echo "Found GTM IDs:"
git log --all --full-history -S "GTM-M8KF4XF" --oneline | head -5

echo ""
echo "🧹 Scrubbing git history..."
echo "This may take several minutes..."

# Run git-filter-repo
git filter-repo --replace-text /tmp/replacements.txt --force

echo ""
echo "🧹 Cleaning up..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history scrubbed!"
echo ""
echo "⚠️  Next steps:"
echo "1. Verify: git log --all | grep -i gtm"
echo "2. If clean, force push: git push origin --force --all"
echo "3. If repository is PUBLIC, DO NOT force push"
echo "   Instead, rotate the keys and consider them compromised"
