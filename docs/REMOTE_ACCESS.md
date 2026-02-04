# Remote Access System

Secure system for accessing websites and backends to read/edit code. **Credentials are never saved to disk** - only stored in memory during active sessions.

## Features

- ✅ **Secure Credential Management** - In-memory only, auto-expires after 30 minutes
- ✅ **Website Automation** - Browser automation with Puppeteer
- ✅ **API/Backend Access** - Authenticated API client
- ✅ **SSH Access** - Remote file system access via SSH
- ✅ **Code Reading/Editing** - Read and write files on remote systems
- ✅ **Navigation Control** - Navigate to different pages/windows
- ✅ **Session Management** - Multiple concurrent sessions

## Security

- **No Persistent Storage**: Credentials are stored in memory only
- **Auto-Expiration**: Sessions expire after 30 minutes of inactivity
- **Secure Cleanup**: Credentials are overwritten before deletion
- **Session Isolation**: Each session is completely isolated

## Installation

Install dependencies:
```bash
npm install
```

## Usage

### Interactive CLI

Run the interactive CLI:
```bash
npm run remote-access
```

This will guide you through:
1. Creating sessions (Website, API, or SSH)
2. Providing credentials (never saved)
3. Navigating to pages/windows
4. Reading and editing code
5. Managing sessions

### Programmatic Usage

```javascript
import navigationController from './core/navigation-controller.js';

// Initialize website session
const sessionId = await navigationController.initWebsiteSession({
  url: 'https://your-website.com',
  username: 'your-username',
  password: 'your-password'
}, { headless: false });

// Login
await navigationController.loginToWebsite(sessionId, {
  usernameSelector: 'input[name="email"]',
  passwordSelector: 'input[name="password"]',
  submitSelector: 'button[type="submit"]'
});

// Navigate
await navigationController.navigateTo(sessionId, 'https://your-website.com/admin');

// Read code (via API or SSH)
const code = await navigationController.readCode(sessionId, '/path/to/file.js');

// Edit code
await navigationController.writeCode(sessionId, '/path/to/file.js', 'new code content');

// Close session (clears credentials)
await navigationController.closeSession(sessionId);
```

## Session Types

### Website Session
- Browser automation with Puppeteer
- Login form interaction
- Page navigation
- Screenshot capture
- Content extraction

**Example:**
```javascript
const sessionId = await navigationController.initWebsiteSession({
  url: 'https://example.com',
  username: 'user',
  password: 'pass'
});
await navigationController.loginToWebsite(sessionId);
```

### API Session
- Authenticated API client
- Token, API Key, or Basic Auth support
- REST API calls
- File operations via API

**Example:**
```javascript
const sessionId = await navigationController.initAPISession({
  endpoint: 'https://api.example.com',
  token: 'your-token'
});
const data = await apiClient.get(sessionId, '/api/files/list');
```

### SSH Session
- Secure shell access
- File read/write
- Command execution
- Directory listing

**Example:**
```javascript
const sessionId = await navigationController.initSSHSession({
  host: 'server.example.com',
  port: 22,
  username: 'user',
  password: 'pass'
});
const code = await navigationController.readCode(sessionId, '/var/www/app.js');
```

## Core Modules

### `core/credential-manager.js`
- In-memory credential storage
- Session management
- Auto-expiration
- Secure cleanup

### `core/web-automation.js`
- Puppeteer browser automation
- Login automation
- Page navigation
- Screenshot capture

### `core/api-client.js`
- Authenticated HTTP client
- Token/API Key/Basic Auth support
- REST API operations

### `core/remote-filesystem.js`
- SSH file operations
- API file operations
- Command execution

### `core/navigation-controller.js`
- Unified interface
- Session coordination
- High-level operations

## CLI Commands

1. **Init Website Session** - Create browser session
2. **Init API Session** - Create API client session
3. **Init SSH Session** - Create SSH connection
4. **List Sessions** - View active sessions
5. **Select Session** - Choose active session
6. **Read Code/File** - Read remote file
7. **Write Code/File** - Write remote file
8. **Navigate** - Navigate to URL/route
9. **Get Current Content** - Get page content
10. **Screenshot** - Capture screenshot (web only)
11. **Close Session** - Close and cleanup session
12. **Close All Sessions** - Exit and cleanup

## Best Practices

1. **Always Close Sessions**: Sessions auto-expire, but close them explicitly when done
2. **Use Headless Mode**: For automated tasks, use headless browser mode
3. **Handle Errors**: Wrap operations in try-catch blocks
4. **Check Session Validity**: Verify session exists before operations
5. **Clean Up**: Always call `closeAllSessions()` on application exit

## Security Notes

- Credentials are **never** written to disk
- Sessions expire after 30 minutes
- Credentials are overwritten before deletion
- Each session is isolated
- No credential logging (passwords masked in logs)

## Troubleshooting

### Browser Launch Fails
- Ensure Puppeteer dependencies are installed
- Check system requirements for headless Chrome
- Try running with `headless: false` for debugging

### SSH Connection Fails
- Verify host, port, and credentials
- Check firewall rules
- Ensure SSH service is running

### API Calls Fail
- Verify authentication credentials
- Check API endpoint URL
- Verify network connectivity

## Examples

See `scripts/remote-access-cli.js` for complete interactive example.

## License

MIT

