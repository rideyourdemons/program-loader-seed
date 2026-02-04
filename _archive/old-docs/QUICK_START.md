# 🚀 RYD System - Quick Start Guide

**Ride Your Demons Website Backend & Analysis System**

## ⚡ Quick Launch

### One-Command Deployment

```bash
npm run deploy-ryd
```

This single command will:
- ✅ Initialize website session
- ✅ Authenticate automatically (Firebase detection)
- ✅ Discover all code files
- ✅ Perform comprehensive security audits
- ✅ Set up Firebase backend access
- ✅ Generate detailed reports

---

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **Dependencies installed**
   ```bash
   npm install
   ```

3. **Website credentials** (you'll be prompted)
   - Email/Username
   - Password

---

## 🎯 Common Operations

### 1. Full System Deployment & Analysis

```bash
npm run deploy-ryd
```

**What it does:**
- Complete end-to-end deployment
- Automated authentication
- Code discovery and auditing
- Firebase integration
- Real-time monitoring (optional)

**Output:**
- Audit reports: `logs/audit/`
- Deployment results: `logs/deployment/`

---

### 2. Website Code Auditing

```bash
npm run audit-website
```

**What it does:**
- Opens browser to website
- Waits for manual login
- Scans and audits code files
- Generates security reports

---

### 3. Remote Access (Interactive CLI)

```bash
npm run remote-access
```

**What it does:**
- Interactive session management
- Manual navigation control
- Code reading/writing (with approval)
- Session monitoring

**Features:**
- Website, API, and SSH access
- Secure credential handling (in-memory only)
- Read-only by default

---

### 4. Firebase Monitoring

```bash
npm run firebase-monitor
```

**What it does:**
- Monitors Firebase backend
- Real-time change detection
- Data synchronization tracking

---

### 5. Local Access

```bash
npm run local-access
```

**What it does:**
- Access local file system
- Execute local commands
- Read/write files (with approval)

---

## 🔐 Security Features

- ✅ **Read-Only by Default** - No changes without explicit approval
- ✅ **Secure Credentials** - Never saved to disk, in-memory only
- ✅ **Sandbox Testing** - All changes tested before implementation
- ✅ **Approval Workflows** - Changes require explicit approval
- ✅ **Full Audit Logging** - Every operation logged

---

## 📊 Understanding Reports

### Audit Reports

**Location:** `logs/audit/`

**Files:**
- `report_TIMESTAMP.json` - Complete data
- `report_TIMESTAMP.html` - Visual report
- `SESSION_ID.jsonl` - Detailed log

**What's checked:**
- Security vulnerabilities (OWASP Top 10)
- Code quality issues
- Syntax errors
- Debug code (console.log, etc.)
- Hardcoded credentials
- Best practices

### Deployment Results

**Location:** `logs/deployment/`

**Contains:**
- Session information
- Discovered files
- Audit summaries
- Firebase status
- Error logs

---

## 🛠️ Troubleshooting

### Issue: Authentication Fails

**Solution:**
1. Check credentials are correct
2. Ensure website is accessible
3. Try manual login in browser window
4. Check Firebase configuration

### Issue: Code Files Not Discovered

**Solution:**
1. Ensure you're logged in
2. Navigate to code area manually
3. Wait for page to fully load (SPAs need time)
4. Check browser console for errors

### Issue: Firebase Connection Failed

**Solution:**
1. Verify Firebase config is accessible
2. Check network connectivity
3. Ensure Firebase Admin SDK credentials are valid
4. Check Firebase project permissions

### Issue: Session Timeout

**Solution:**
- Sessions auto-renew by default
- If timeout occurs, restart session
- Sessions expire after 30 minutes of inactivity

---

## 📚 Additional Commands

```bash
# Check system status
npm run status

# Test all systems
npm test-all

# View recent errors
npm run view-errors

# Approve pending changes
npm run approve-change

# Implement approved changes
npm run implement-change
```

---

## 🎓 Usage Examples

### Example 1: Quick Security Audit

```bash
# 1. Run deployment
npm run deploy-ryd

# 2. When prompted:
#    - Enter website URL
#    - Enter credentials
#    - Select "y" for code audit
#    - Enter directory path (or press Enter for root)

# 3. Review reports in logs/audit/
```

### Example 2: Monitor Firebase Changes

```bash
# 1. Run deployment
npm run deploy-ryd

# 2. When prompted:
#    - Complete authentication
#    - Select "y" for Firebase setup
#    - Select "y" for real-time monitoring
#    - Enter collection path (e.g., "users", "orders")

# 3. Monitor real-time changes in terminal
```

### Example 3: Read Remote Code File

```bash
# 1. Start remote access
npm run remote-access

# 2. Follow prompts:
#    - Select "1" (Init Website Session)
#    - Enter URL and credentials
#    - Select "6" (Read Code/File)
#    - Enter file path

# 3. Code content displayed in terminal
```

---

## 🔄 Workflow

### Typical Workflow

1. **Deploy System**
   ```bash
   npm run deploy-ryd
   ```

2. **Review Reports**
   - Check `logs/audit/report_*.html`
   - Review security findings
   - Check code quality metrics

3. **Make Changes (if needed)**
   ```bash
   npm run remote-access
   ```
   - Read code
   - Propose changes
   - Get approval
   - Implement changes

4. **Monitor**
   - Firebase monitoring (if enabled)
   - System logs: `logs/app.log`
   - Error tracking: `logs/audit/`

---

## 🆘 Need Help?

1. **Check Logs:**
   ```bash
   # View application log
   cat logs/app.log
   
   # View recent audit log
   cat logs/audit/*.jsonl | tail -50
   ```

2. **Review Documentation:**
   - System Overview: `docs/SYSTEM_OVERVIEW.md`
   - Firebase Setup: `docs/FIREBASE_AUTH.md`
   - Remote Access: `docs/REMOTE_ACCESS.md`

3. **Check Status:**
   ```bash
   npm run status
   ```

---

## ✅ Quick Checklist

Before deploying:

- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] Website URL known
- [ ] Credentials ready
- [ ] Network connection stable
- [ ] Browser available (for non-headless mode)

---

## 🎉 You're Ready!

Run this to get started:

```bash
npm run deploy-ryd
```

The system will guide you through each step interactively.

---

**For detailed information, see:**
- `RYD_SYSTEM_IMPROVEMENTS_COMPLETE.md` - Full feature documentation
- `RYD_System_Gap_Analysis_and_Action_List.txt` - System capabilities
- `docs/` - Detailed documentation

