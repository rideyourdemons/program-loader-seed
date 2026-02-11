# GTM ID Rotation Guide
**If GTM-M8KF4XF was exposed in git history**

## 🚨 Critical Steps

### 1. Generate New GTM Container
1. Go to https://tagmanager.google.com/
2. Create a new container (or duplicate existing one)
3. Copy the new Container ID (format: GTM-XXXXXXX)
4. Update all tags/configurations in the new container

### 2. Update Environment
1. Update `.env` file:
   ```
   GTM_CONTAINER_ID=GTM-NEWIDHERE
   ```

2. Update production environment variables on your hosting platform

### 3. Remove from Git History (if repository is private)

**Option A: Using git filter-repo (Recommended)**
```bash
# Install git-filter-repo first:
# pip install git-filter-repo
# OR
# brew install git-filter-repo

# Remove GTM ID from all history
git filter-repo --replace-text <(echo "GTM-M8KF4XF==>GTM-REMOVED")

# Force push (ONLY if repository is private!)
git push origin --force --all
```

**Option B: Using BFG Repo-Cleaner**
```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/

# Create replacements file
echo "GTM-M8KF4XF==>GTM-REMOVED" > replacements.txt

# Run BFG
java -jar bfg.jar --replace-text replacements.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (ONLY if repository is private!)
git push origin --force --all
```

**Option C: Manual History Rewrite (Advanced)**
```bash
# WARNING: This rewrites ALL history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch -r . && git reset --hard" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (ONLY if repository is private!)
git push origin --force --all
```

### 4. Delete Old GTM Container
1. Go to Google Tag Manager
2. Delete the old container (GTM-M8KF4XF)
3. Verify new container is working

## ⚠️ Important Notes

- **If repository is PUBLIC**: Do NOT force push. Instead:
  1. Rotate the key immediately
  2. Consider the old key compromised
  3. The key will remain in public history (this is why rotation is critical)

- **If repository is PRIVATE**: You can safely rewrite history using the methods above

- **Always backup** before rewriting git history:
  ```bash
  git clone --mirror <repo-url> backup-repo.git
  ```

## ✅ Verification

After rotation:
1. Check that new GTM ID is in `.env` only
2. Verify analytics still works
3. Check GitHub Secret Scanning doesn't alert
4. Update any documentation that referenced old ID
