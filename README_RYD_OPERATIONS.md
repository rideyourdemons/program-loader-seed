# 📖 RYD System - Operations Manual

**Complete Guide to Operating the Ride Your Demons Website Backend & Analysis System**

---

## 📑 Table of Contents

1. [System Overview](#system-overview)
2. [Installation & Setup](#installation--setup)
3. [Core Operations](#core-operations)
4. [Advanced Features](#advanced-features)
5. [Security & Approval Workflows](#security--approval-workflows)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## 🎯 System Overview

The RYD System is a comprehensive platform for:
- **Website Code Auditing** - Automated security and quality analysis
- **Remote Backend Access** - Secure access to websites and Firebase
- **Real-Time Monitoring** - Firebase and website change detection
- **Change Management** - Safe code modifications with approval workflows

### Key Capabilities

✅ **Automated Authentication** - Firebase and form-based login support  
✅ **Code Discovery** - Intelligent file detection from pages and network  
✅ **Security Analysis** - OWASP Top 10 vulnerability detection  
✅ **Firebase Integration** - Full backend access with real-time monitoring  
✅ **Session Management** - Auto-renewal and secure credential handling  
✅ **SPA Support** - Enhanced support for React and single-page applications  

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** (comes with Node.js)
- **Browser** (Chrome/Chromium for Puppeteer)

### Installation Steps

1. **Clone/Download Project**
   ```bash
   cd program-loader-seed
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Verify Installation**
   ```bash
   npm run status
   ```

4. **Configuration** (Optional)
   - Edit `config/app.config.json` for custom settings
   - Add Firebase config if needed: `config/firebase-config.json`

### First Run

```bash
npm run deploy-ryd
```

Follow the interactive prompts to complete setup.

---

## 🎮 Core Operations

### 1. Full System Deployment

**Command:** `npm run deploy-ryd`

**Purpose:** Complete end-to-end deployment with all features enabled.

**Process:**
1. Website session initialization
2. Automated authentication (Firebase auto-detection)
3. Code file discovery
4. Comprehensive code auditing
5. Firebase backend integration
6. Real-time monitoring setup (optional)
7. Report generation

**Output:**
- Audit reports: `logs/audit/report_*.json` and `*.html`
- Deployment results: `logs/deployment/deployment-*.json`

**Example:**
```bash
$ npm run deploy-ryd

=== RYD SYSTEM DEPLOYMENT & ANALYSIS ===

Website URL (default: https://rideyourdemons.com): 
Email/Username: user@example.com
Password: ********
Headless mode? (y/n, default: n): n

🚀 Initializing website session...
✅ Website session created: session_1234567890_abc123

🔐 Attempting automated authentication...
✅ Authentication successful!
✅ Authenticated as: user@example.com

🔍 Discovering code files...
✅ Discovered 45 code files

📊 Starting comprehensive code audit...
✅ Audit completed: 42 files analyzed
✅ Reports saved: logs/audit/report_2025-12-24.json
```

---

### 2. Website Code Auditing

**Command:** `npm run audit-website`

**Purpose:** Perform security and quality analysis of website code.

**Features:**
- Multi-language support (JS, TS, Python, HTML, CSS)
- Security vulnerability detection (OWASP Top 10)
- Code quality analysis
- Issue categorization by severity
- Comprehensive reporting

**Report Types:**
- **JSON Report**: Complete data for programmatic processing
- **HTML Report**: Visual report for easy reading
- **JSONL Log**: Detailed operation log

**Review Reports:**
```bash
# View HTML report in browser
start logs/audit/report_*.html  # Windows
open logs/audit/report_*.html   # macOS
xdg-open logs/audit/report_*.html  # Linux

# View JSON report
cat logs/audit/report_*.json | jq
```

---

### 3. Remote Access (Interactive CLI)

**Command:** `npm run remote-access`

**Purpose:** Interactive session for manual operations.

**Menu Options:**
1. **Init Website Session** - Create web session
2. **Init API Session** - Create API/backend session
3. **Init SSH Session** - Create SSH session
4. **Login to Website** - Authenticate
5. **Navigate** - Go to URL/route
6. **Read Code/File** - Read remote file
7. **Write Code/File** - Modify file (requires approval)
8. **List Files** - Browse directory
9. **Execute Command** - Run SSH command
10. **Close Session** - Cleanup

**Example Session:**
```bash
$ npm run remote-access

=== Remote Access System ===

Select operation:
  1. Init Website Session
  2. Init API Session
  3. Init SSH Session
  ...

Enter choice: 1

Website URL: https://rideyourdemons.com
Username: user@example.com
Password: ********
Headless mode? (y/n): n

✅ Website session created: session_1234567890_abc123

Do you need to login? (y/n): y
Use Firebase authentication? (y/n, default: auto-detect): y

✅ Logged in successfully

Select operation: 6
File path: /src/components/App.js

[Code content displayed...]
```

---

### 4. Firebase Backend Access

**Command:** `npm run firebase-monitor` or via deployment script

**Purpose:** Monitor and interact with Firebase backend.

**Capabilities:**
- Real-time change detection
- Data querying and aggregation
- User management
- Collection/document access
- Storage file listing

**Example:**
```javascript
// Real-time monitoring
const unsubscribe = await firebaseBackend.watchCollection('orders', 
  (documents, changes) => {
    console.log(`Orders updated: ${changes.length} changes`);
    changes.forEach(change => {
      console.log(`${change.type}: ${change.doc.id}`);
    });
  }
);
```

---

### 5. Local System Access

**Command:** `npm run local-access`

**Purpose:** Access and manage local file system.

**Features:**
- File reading/writing (with approval)
- Command execution
- Directory listing
- Full audit logging

---

## 🔒 Security & Approval Workflows

### Read-Only Mode

By default, all operations are **read-only**. Writes require explicit authorization.

### Approval Workflow

1. **Propose Change**
   ```bash
   npm run remote-access
   # Select "7. Write Code/File"
   # Enter file path and content
   ```

2. **Sandbox Testing**
   - System automatically tests changes
   - Syntax validation
   - Error detection
   - Test results generated

3. **Approval Request**
   - Approval request created
   - Report generated: `logs/approvals/APPROVAL_ID_report.txt`
   - JSON data: `logs/approvals/APPROVAL_ID.json`

4. **Review & Approve**
   ```bash
   # View approval request
   cat logs/approvals/APPROVAL_ID_report.txt
   
   # Approve change
   npm run approve-change
   # Enter approval ID when prompted
   ```

5. **Implementation**
   ```bash
   # Implement approved change
   npm run implement-change
   # Enter approval ID and session ID
   ```

### Security Features

- **Credential Security**: Never saved to disk, in-memory only
- **Session Auto-Expiry**: Sessions expire after inactivity
- **Audit Logging**: Every operation logged
- **Sandbox Testing**: All changes tested before implementation
- **Authorization Required**: Explicit approval for all writes

---

## 📊 Monitoring & Maintenance

### System Monitoring

**Check Status:**
```bash
npm run status
```

**View Logs:**
```bash
# Application log
tail -f logs/app.log

# Audit log
tail -f logs/audit/*.jsonl

# Recent errors
npm run view-errors
```

### Firebase Monitoring

When enabled via deployment script:
- Real-time change notifications in terminal
- Change tracking logged to audit system
- Automatic reconnection on disconnect

### Maintenance Tasks

**Daily:**
- Review audit reports
- Check for security issues
- Monitor Firebase changes

**Weekly:**
- Review approval requests
- Clean up old logs (optional)
- Verify session health

**Monthly:**
- Review system capabilities
- Update dependencies: `npm update`
- Review gap analysis progress

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Fails

**Symptoms:**
- Login timeout
- "No credentials found" error

**Solutions:**
- Verify credentials are correct
- Check website accessibility
- Try manual login in browser
- Ensure Firebase config is accessible
- Check for CAPTCHA or 2FA (may need manual handling)

#### 2. Code Files Not Discovered

**Symptoms:**
- Empty file list
- Discovery returns 0 files

**Solutions:**
- Ensure you're logged in
- Navigate to code area manually
- Wait for SPA to fully load (may take 5-10 seconds)
- Check browser console for JavaScript errors
- Verify network requests aren't blocked

#### 3. Session Timeout

**Symptoms:**
- "Session expired" errors
- Operations fail after some time

**Solutions:**
- Sessions auto-renew by default (check if enabled)
- Restart session if needed
- Sessions expire after 30 minutes of inactivity
- Use `extendSession()` to manually extend

#### 4. Firebase Connection Failed

**Symptoms:**
- "Firebase backend not initialized"
- Connection timeout

**Solutions:**
- Verify Firebase config file exists
- Check network connectivity
- Verify Firebase Admin SDK credentials
- Check Firebase project permissions
- Ensure Firebase services are enabled

#### 5. Browser Automation Issues

**Symptoms:**
- Browser doesn't launch
- Navigation fails
- Elements not found

**Solutions:**
- Install Chrome/Chromium
- Check Puppeteer installation: `npm list puppeteer`
- Try non-headless mode for debugging
- Increase timeout values
- Check for browser updates

### Debug Mode

Enable verbose logging:
```javascript
// In your script
process.env.DEBUG = 'true';
```

Or check logs:
```bash
# View detailed logs
cat logs/app.log | grep ERROR
cat logs/audit/*.jsonl | grep ERROR
```

---

## 📚 API Reference

### Core Modules

#### Navigation Controller

```javascript
import navigationController from './core/navigation-controller.js';

// Initialize session
const sessionId = await navigationController.initWebsiteSession({
  url: 'https://example.com',
  username: 'user@example.com',
  password: 'password'
});

// Authenticate
await navigationController.loginToWebsite(sessionId, { useFirebase: true });

// Navigate
await navigationController.navigateTo(sessionId, '/admin');

// Read code
const code = await navigationController.readCode(sessionId, '/path/to/file.js');

// Write code (requires approval)
const result = await navigationController.writeCode(
  sessionId, 
  '/path/to/file.js', 
  'new code content',
  'auto',
  'Reason for change'
);
```

#### Code Auditor

```javascript
import codeAuditor from './core/code-auditor.js';

// Set session
codeAuditor.setSession(sessionId);

// Audit single file
const result = await codeAuditor.auditFile('/path/to/file.js');

// Audit directory
const results = await codeAuditor.auditDirectory('/src');

// Generate report
const report = codeAuditor.generateReport();
const reportPath = codeAuditor.saveReport('json');
```

#### Firebase Backend

```javascript
import firebaseBackend from './core/firebase-backend.js';

// Initialize
await firebaseBackend.initialize(sessionId, firebaseConfig);

// Query collection
const docs = await firebaseBackend.readCollection('users', {
  where: [{ field: 'status', operator: '==', value: 'active' }],
  orderBy: [{ field: 'createdAt', direction: 'desc' }],
  limit: 100
});

// Real-time monitoring
const unsubscribe = await firebaseBackend.watchCollection(
  'orders',
  (documents, changes) => {
    console.log('Changes:', changes);
  }
);

// Aggregate
const total = await firebaseBackend.aggregateCollection('orders', {
  field: 'amount',
  operation: 'sum'
});
```

#### Web Automation

```javascript
import webAutomation from './core/web-automation.js';

// Launch browser
await webAutomation.launchBrowser(sessionId, { headless: false });

// Navigate with SPA support
await webAutomation.navigateTo(sessionId, url, {
  waitForSelector: '#app',
  waitForFunction: () => window.appReady
});

// Discover code files
const files = await webAutomation.discoverCodeFiles(sessionId);

// Wait for element
await webAutomation.waitForElement(sessionId, '#my-element', 30000);
```

---

## 📁 File Structure

```
program-loader-seed/
├── core/                    # Core modules
│   ├── credential-manager.js
│   ├── web-automation.js
│   ├── navigation-controller.js
│   ├── code-auditor.js
│   ├── firebase-backend.js
│   └── ...
├── scripts/                 # Executable scripts
│   ├── deploy-ryd-system.js
│   ├── audit-website.js
│   ├── remote-access-cli.js
│   └── ...
├── logs/                    # Logs and reports
│   ├── audit/              # Audit reports
│   ├── approvals/          # Approval requests
│   ├── deployment/         # Deployment results
│   └── app.log            # Application log
├── config/                 # Configuration files
├── docs/                   # Documentation
└── QUICK_START.md         # Quick start guide
```

---

## ✅ Best Practices

1. **Always Review Before Approval**
   - Check sandbox test results
   - Review code changes carefully
   - Verify security implications

2. **Use Read-Only Mode for Exploration**
   - Explore codebase first
   - Understand structure before changes
   - Use audit reports for insights

3. **Monitor Regularly**
   - Check audit reports weekly
   - Monitor Firebase changes
   - Review error logs

4. **Secure Credentials**
   - Never commit credentials
   - Use environment variables when possible
   - Rotate credentials regularly

5. **Keep Dependencies Updated**
   ```bash
   npm update
   npm audit fix
   ```

---

## 🆘 Support

**Documentation:**
- Quick Start: `QUICK_START.md`
- System Improvements: `RYD_SYSTEM_IMPROVEMENTS_COMPLETE.md`
- Gap Analysis: `RYD_System_Gap_Analysis_and_Action_List.txt`

**Logs:**
- Application: `logs/app.log`
- Audit: `logs/audit/`
- Errors: `npm run view-errors`

**Check Status:**
```bash
npm run status
```

---

## 🎉 Quick Command Reference

```bash
# Deployment & Analysis
npm run deploy-ryd           # Full system deployment
npm run audit-website        # Code audit
npm run remote-access        # Interactive CLI
npm run firebase-monitor     # Firebase monitoring

# Management
npm run status               # System status
npm run approve-change       # Approve pending changes
npm run implement-change     # Implement approved changes
npm run view-errors          # View recent errors

# Testing
npm test-all                 # Run all tests
npm run status               # Health check
```

---

**Ready to start? Run:**

```bash
npm run deploy-ryd
```

**For quick reference, see:** `QUICK_START.md`

