# Audit System Documentation

## Overview

The audit system provides comprehensive read-only code analysis with full logging and reporting. **No changes are made without explicit authorization.**

## Key Features

- ✅ **Read-Only by Default** - All write operations blocked
- ✅ **Comprehensive Logging** - Every operation logged
- ✅ **Detailed Reports** - JSON and HTML reports
- ✅ **Code Analysis** - Multi-language support
- ✅ **Security Checks** - Vulnerability detection
- ✅ **Full Audit Trail** - Complete operation history

## Usage

### Command Line

```bash
npm run audit-website
```

### Workflow

1. **Launch Browser** - System opens browser window
2. **Manual Login** - You log in manually (credentials never saved)
3. **Navigate** - Go to code/admin area you want audited
4. **Audit** - System performs read-only analysis
5. **Reports** - Comprehensive reports generated

### What Gets Audited

- **Code Quality**
  - File size and complexity
  - Long lines
  - Code organization

- **Security Issues**
  - Hardcoded credentials
  - eval() usage
  - Security vulnerabilities

- **Code Issues**
  - Debug code (console.log, print)
  - TODO/FIXME comments
  - Code smells

- **Metrics**
  - Functions, classes, imports
  - Code structure
  - Language detection

## Reports

### Location
All reports saved to `logs/audit/`

### Report Types

1. **JSON Report** (`report_TIMESTAMP.json`)
   - Machine-readable
   - Complete data
   - Full audit log

2. **HTML Report** (`report_TIMESTAMP.html`)
   - Visual representation
   - Easy to read
   - Summary statistics

3. **Audit Log** (`SESSION_ID.jsonl`)
   - Line-by-line log
   - Every operation
   - Timestamped entries

### Report Contents

```json
{
  "sessionId": "audit_...",
  "startTime": "2025-12-24T...",
  "endTime": "2025-12-24T...",
  "duration": "45.23s",
  "summary": {
    "totalChecks": 15,
    "totalIssues": 8,
    "totalOperations": 42,
    "blockedWrites": 0
  },
  "checks": [...],
  "issues": [...],
  "auditLog": [...],
  "attemptedWrites": []
}
```

## Read-Only Mode

### Default Behavior
- All write operations are **blocked**
- Attempts are **logged**
- Reports show **blocked writes**

### Authorization

To enable writes (if needed):

```javascript
import readOnlyMode from './core/readonly-mode.js';

// Authorize writes (requires token)
readOnlyMode.authorize('your-authorization-token');

// Now writes are allowed
await navigationController.writeCode(sessionId, filePath, content);

// Revoke authorization
readOnlyMode.revokeAuthorization();
```

### Blocked Write Logging

All attempted writes are logged:
- Timestamp
- Operation type
- Target file/path
- Authorization status

## Code Analysis

### Supported Languages

- JavaScript/TypeScript
- Python
- HTML
- CSS
- JSON
- Markdown

### Analysis Features

1. **Language Detection** - Automatic detection
2. **Issue Detection** - Security, quality, best practices
3. **Metrics Calculation** - Functions, classes, complexity
4. **Pattern Recognition** - Common issues and anti-patterns

## Security

### Credential Handling
- Never saved to disk
- In-memory only
- Auto-expires
- Secure cleanup

### Operation Logging
- Every operation logged
- Full audit trail
- Timestamped entries
- Session tracking

## Best Practices

1. **Review Reports** - Always review generated reports
2. **Check Logs** - Review audit logs regularly
3. **No Changes** - System is read-only by design
4. **Secure Sessions** - Close sessions when done
5. **Authorization** - Only authorize when necessary

## Troubleshooting

### Reports Not Generated
- Check `logs/audit/` directory exists
- Verify write permissions
- Check disk space

### Analysis Fails
- Verify file paths are correct
- Check session is active
- Review error logs

### Browser Issues
- Try non-headless mode
- Check Puppeteer installation
- Verify system dependencies

## Examples

### Basic Audit

```bash
npm run audit-website
# Follow prompts
# Log in manually
# Navigate to code
# Select file or directory
# Review reports
```

### Programmatic Audit

```javascript
import codeAuditor from './core/code-auditor.js';
import navigationController from './core/navigation-controller.js';

const sessionId = await navigationController.initWebsiteSession({...});
codeAuditor.setSession(sessionId);

const result = await codeAuditor.auditFile('/path/to/file.js');
codeAuditor.saveReport('html');
```

## Report Interpretation

### Issue Severity

- **High** - Security risks, critical issues
- **Medium** - Code quality, best practices
- **Low** - Code style, minor improvements

### Summary Statistics

- **Total Checks** - Files analyzed
- **Total Issues** - Problems found
- **Blocked Writes** - Unauthorized write attempts
- **Duration** - Audit time

---

**Remember**: This system is **read-only**. No changes are made without explicit authorization.

