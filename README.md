# Website Code Auditor & Remote Access System

A comprehensive, secure system for auditing website code, performing read-only analysis, and managing remote access to websites and backends. **All operations are read-only by default** - no changes are made without explicit authorization.

> **🔒 IMPORTANT:** For Ride Your Demons (RYD) development, see [RYD_MASTER_DIRECTIVE.md](./RYD_MASTER_DIRECTIVE.md) and [.cursorrules](./.cursorrules) for authoritative operating rules. All code and content decisions must align with these directives.

## 🎯 Features

### Core Capabilities
- ✅ **Read-Only Code Auditing** - Comprehensive code analysis without making changes
- ✅ **Secure Credential Management** - In-memory only, never saved to disk
- ✅ **Firebase Authentication Support** - Auto-detects and handles Firebase auth
- ✅ **Multi-Protocol Access** - Website (browser), API, and SSH support
- ✅ **Comprehensive Logging** - All operations logged with full audit trails
- ✅ **Detailed Reports** - JSON and HTML reports with full analysis
- ✅ **Containerized** - Docker support for easy deployment

### Security
- 🔒 **No Persistent Credentials** - Credentials stored in memory only, auto-expire after 30 minutes
- 🔒 **Read-Only by Default** - Write operations blocked without authorization
- 🔒 **Full Audit Trail** - Every operation logged and tracked
- 🔒 **Secure Cleanup** - Credentials overwritten before deletion

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [Docker Deployment](#docker-deployment)
- [Architecture](#architecture)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## 🚀 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Installation

```bash
# Clone or navigate to project directory
cd program-loader-seed

# Install dependencies
npm install
```

## 🧪 Smoke Testing

Quick local validation workflow:

```bash
# Start dev server and open browser
npm run smoke:dev

# Run full smoke test (lint + endpoints + routes)
npm run smoke

# Individual commands
npm run smoke:checks  # Lint/typecheck only
npm run smoke:run     # Endpoint/route validation only
```

See [docs/SMOKE_TEST.md](./docs/SMOKE_TEST.md) for full documentation.

# Verify installation
npm run status
```

### Docker Installation

```bash
# Build Docker image
docker-compose build

# Or build manually
docker build -t website-auditor .
```

## 🎬 Quick Start

### 1. Website Code Audit (Read-Only)

```bash
npm run audit-website
```

This will:
1. Launch a browser window
2. Wait for you to log in manually
3. Navigate to code/admin areas
4. Perform read-only code analysis
5. Generate comprehensive reports
6. **Never make any changes**

### 2. Remote Access (Interactive)

```bash
npm run remote-access
```

Interactive CLI for:
- Website access with Firebase auth
- API/backend access
- SSH file system access
- Code reading (read-only)

### 3. Website Monitoring

```bash
# Manual check
npm run check-website

# Continuous monitoring
npm start
```

## 📖 Usage

### Website Code Audit

The audit system performs comprehensive read-only analysis:

```bash
npm run audit-website
```

**Workflow:**
1. System launches browser
2. You log in manually in the browser window
3. Navigate to the code area you want audited
4. System reads and analyzes code
5. Generates reports in `logs/audit/`

**What it checks:**
- Code quality issues
- Security vulnerabilities
- Debug code (console.log, print statements)
- TODO/FIXME comments
- Code metrics (functions, classes, imports)
- File size and complexity
- Language-specific best practices

**Reports generated:**
- `logs/audit/report_TIMESTAMP.json` - Full JSON report
- `logs/audit/report_TIMESTAMP.html` - HTML report with visualizations
- `logs/audit/SESSION_ID.jsonl` - Detailed audit log

### Programmatic Usage

```javascript
import navigationController from './core/navigation-controller.js';
import codeAuditor from './core/code-auditor.js';

// Initialize session
const sessionId = await navigationController.initWebsiteSession({
  url: 'https://your-website.com',
  username: 'your-email@example.com',
  password: 'your-password'
});

// Set up auditor
codeAuditor.setSession(sessionId);

// Audit a file
const result = await codeAuditor.auditFile('/path/to/file.js');

// Audit a directory
const results = await codeAuditor.auditDirectory('/path/to/code');

// Generate reports
codeAuditor.saveReport('json');
codeAuditor.saveReport('html');

// Close session (clears credentials)
await navigationController.closeSession(sessionId);
```

## ⚙️ Configuration

### Application Config (`config/app.config.json`)

```json
{
  "appName": "Program Loader",
  "environment": "local",
  "logging": true,
  "website": {
    "url": "https://rideyourdemons.com",
    "checkInterval": 60000,
    "timeout": 10000,
    "expectedContent": [],
    "expectedStatus": 200
  }
}
```

### Environment Variables

Create a `.env` file (optional):

```env
LOG_LEVEL=INFO
WEBSITE_URL=https://rideyourdemons.com
```

### Programs Config (`config/programs.config.json`)

```json
{
  "enabledPrograms": [
    "example-program",
    "website-monitor",
    "remote-access"
  ]
}
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Run audit command
docker-compose exec website-auditor npm run audit-website

# Stop
docker-compose down
```

### Manual Docker

```bash
# Build
docker build -t website-auditor .

# Run
docker run -it \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/config:/app/config \
  website-auditor \
  npm run audit-website
```

### Multi-Website Setup

You can run multiple instances for different websites:

```bash
# Website 1
docker run -d --name auditor-site1 \
  -v $(pwd)/logs:/app/logits \
  website-auditor

# Website 2
docker run -d --name auditor-site2 \
  -v $(pwd)/logs:/app/logs \
  website-auditor
```

## 🏗️ Architecture

### Core Modules

```
core/
├── credential-manager.js    # Secure in-memory credential storage
├── web-automation.js         # Browser automation (Puppeteer)
├── api-client.js             # Authenticated API client
├── remote-filesystem.js      # SSH/API file operations
├── navigation-controller.js  # Unified navigation interface
├── firebase-auth.js          # Firebase authentication
├── readonly-mode.js          # Write protection
├── audit-system.js           # Comprehensive audit logging
└── code-auditor.js           # Code analysis engine
```

### Programs

```
programs/
├── example-program/          # Template program
├── website-monitor/           # Website health monitoring
└── remote-access/            # Remote access system
```

### Scripts

```
scripts/
├── boot.js                   # Application bootstrap
├── status.js                 # Status check
├── check-website.js          # Manual website check
├── remote-access-cli.js      # Interactive remote access
├── audit-website.js          # Website code audit
└── analyze.js                # Code analysis tool
```

## 🔒 Security

### Credential Management
- **Never saved to disk** - All credentials stored in memory only
- **Auto-expiration** - Sessions expire after 30 minutes
- **Secure cleanup** - Credentials overwritten before deletion
- **Session isolation** - Each session completely isolated

### Read-Only Mode
- **Default behavior** - All write operations blocked
- **Authorization required** - Explicit token needed for writes
- **Full logging** - All attempted writes logged
- **Audit trail** - Complete history of operations

### Best Practices
1. Always close sessions when done
2. Use headless mode for automated tasks
3. Review audit logs regularly
4. Never commit credentials to version control
5. Use environment variables for sensitive config

## 📊 Reports

### Audit Reports Location
- `logs/audit/report_TIMESTAMP.json` - Full JSON report
- `logs/audit/report_TIMESTAMP.html` - HTML report
- `logs/audit/SESSION_ID.jsonl` - Detailed audit log

### Report Contents
- Session information
- All code checks performed
- Issues found (with severity)
- Blocked write attempts
- Full audit log
- Code metrics
- Security findings

## 🐛 Troubleshooting

### Browser Launch Fails
```bash
# Install Puppeteer dependencies
npm install

# Try with visible browser
npm run audit-website
# Select 'n' for headless mode
```

### Firebase Auth Not Detected
- Ensure Firebase SDK is loaded on the page
- Manually specify: `{ useFirebase: true }` in login options
- Check browser console for Firebase errors

### SSH Connection Fails
- Verify host, port, and credentials
- Check firewall rules
- Ensure SSH service is running

### Reports Not Generated
- Check `logs/audit/` directory exists
- Verify write permissions
- Check disk space

## 📝 Examples

### Example 1: Audit Single Website

```bash
npm run audit-website
# Follow prompts
# Log in manually
# Navigate to code area
# Select "Single file" or "Directory"
# Review reports in logs/audit/
```

### Example 2: Monitor Website Health

```bash
# Set website URL in config/app.config.json
npm start

# Or manual check
npm run check-website
```

### Example 3: Remote Code Access

```bash
npm run remote-access
# Select session type
# Provide credentials (never saved)
# Read/edit code as needed
```

## 🔄 Multi-Website Support

This system is designed to work with multiple websites. To audit different websites:

1. **Update config** - Change `website.url` in `config/app.config.json`
2. **Use Docker** - Run separate containers for each website
3. **Multiple sessions** - Create separate sessions for each website

## 🎨 Sandbox Preview System

This repository includes a **two-layer architecture**:

1. **Program Loader Seed** - The core runner system (boot.js, programs, core modules)
2. **Sandbox Preview** - Development UI previews for testing platform integrations

### Running the Sandbox

```bash
npm run dev:sandbox
```

Then open `http://localhost:3001` in your browser to see:
- Landing page with links to all preview routes
- Platform-integrated preview (`/platform-integrated`)
- RYD-integrated preview (`/ryd-integrated`)
- Live site integration preview (`/live-integration`)
- Integration preview (`/integration-preview`)

### Available Routes

All previews are served on **port 3001** via routes:

- `/` - Landing page with links to all previews
- `/platform-integrated` - Complete platform with search, tour, tool rotation, RYD header
- `/ryd-integrated` - RYD site integration with all engines (compliance, matrix, authority, tour)
- `/live-integration` - Integration preview showing platform embedded in RYD header (uses iframe)
- `/integration-preview` - Preview with RYD site structure

### How Programs Load

1. **Bootstrap:** `scripts/boot.js` is the main entry point
2. **Configuration:** Reads `config/programs.config.json` to determine enabled programs
3. **Loading:** `core/loader.js` loads program modules from `/programs` directory
4. **Registry:** Programs are registered in `core/registry.js` for execution
5. **Execution:** Each program runs asynchronously and logs to `logs/app.log`

### Safety Note: Remote Access

The `remote-access` program is **consent-based only**. It must be:
- Used only for systems you own or have explicit permission to access
- Used for administrative purposes on systems under your control
- Never used for unauthorized access

See [AUDIT_REPORT.md](docs/AUDIT_REPORT.md) for detailed analysis of all core modules.

## 📚 Documentation

- [Audit Report](docs/AUDIT_REPORT.md) - Detailed analysis of core modules and sandbox servers
- [Remote Access Guide](docs/REMOTE_ACCESS.md)
- [Firebase Authentication](docs/FIREBASE_AUTH.md)
- [Ride Your Demons Setup](docs/RIDEYOURDEMONS_SETUP.md)

## 🤝 Contributing

This is a private project. For issues or questions, contact the project maintainer.

## 📄 License

MIT

## ⚠️ Important Notes

1. **Read-Only by Default** - No changes are made without explicit authorization
2. **Credentials Never Saved** - All credentials are in-memory only
3. **Full Audit Trail** - Every operation is logged
4. **Secure by Design** - Multiple layers of security protection
5. **Container Ready** - Docker support for easy deployment

## 🎯 Use Cases

- ✅ Code audits and reviews
- ✅ Security assessments
- ✅ Code quality analysis
- ✅ Website health monitoring
- ✅ Remote code access (read-only)
- ✅ Multi-website management
- ✅ Automated reporting

---

**Remember**: This system is **read-only by default**. No changes will be made without your explicit authorization.
