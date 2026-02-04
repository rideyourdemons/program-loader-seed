# Ride Your Demons - Website Setup

## Website Information

- **URL**: https://rideyourdemons.com
- **Status**: ✅ Accessible (200 OK)
- **Framework**: React
- **Response Time**: ~500ms
- **Content Type**: HTML
- **Page Title**: Ride Your Demons
- **Login Form**: Detected

## Configuration

The website URL has been configured in `config/app.config.json`:

```json
{
  "website": {
    "url": "https://rideyourdemons.com",
    "checkInterval": 60000,
    "timeout": 10000,
    "expectedContent": [],
    "expectedStatus": 200
  }
}
```

## Quick Start - Remote Access

### 1. Start Remote Access CLI

```bash
npm run remote-access
```

### 2. Initialize Website Session

When prompted:
- **Command**: Select `1` (Init Website Session)
- **Website URL**: `https://rideyourdemons.com`
- **Username**: (You'll provide this)
- **Password**: (You'll provide this - hidden input)
- **Headless mode**: `y` (recommended) or `n` (to see browser)

### 3. Login to Website

After session is created:
- **Do you need to login?**: `y`
- **Username field selector**: (Press Enter for auto-detect, or provide custom selector)
- **Password field selector**: (Press Enter for auto-detect, or provide custom selector)
- **Submit button selector**: (Press Enter for auto-detect, or provide custom selector)

The system will automatically detect common login form selectors:
- Username: `input[name="username"], input[name="email"], input[type="email"], #username, #email`
- Password: `input[name="password"], input[type="password"], #password`
- Submit: `button[type="submit"], input[type="submit"]`

### 4. Navigate to Admin/Backend

After login:
- **Command**: Select `8` (Navigate)
- **URL/Route**: Enter the admin or backend URL (e.g., `/admin`, `/dashboard`, etc.)

### 5. Read Code

- **Command**: Select `6` (Read Code/File)
- **File path**: Enter the path to the file you want to read
  - For API: `/api/files/read` endpoint (if available)
  - For SSH: Full file path (e.g., `/var/www/app.js`)

### 6. Edit Code

- **Command**: Select `7` (Write Code/File)
- **File path**: Enter the path to the file
- **Content**: Enter the code (end with `END` on a new line)

## Programmatic Usage

```javascript
import navigationController from './core/navigation-controller.js';

// Initialize session
const sessionId = await navigationController.initWebsiteSession({
  url: 'https://rideyourdemons.com',
  username: 'your-username',
  password: 'your-password'
}, { headless: true });

// Login (auto-detects selectors)
await navigationController.loginToWebsite(sessionId);

// Navigate to admin area
await navigationController.navigateTo(sessionId, 'https://rideyourdemons.com/admin');

// Read code (if you have API or SSH access)
const code = await navigationController.readCode(sessionId, '/path/to/file.js');

// Edit code
await navigationController.writeCode(sessionId, '/path/to/file.js', 'new code');

// Close session when done
await navigationController.closeSession(sessionId);
```

## Website Monitoring

The website monitor is now configured to check https://rideyourdemons.com:

```bash
# Run manual check
npm run check-website

# Or start continuous monitoring
npm start
```

## Notes

- **React Application**: The site uses React, so content may be dynamically loaded
- **Login Required**: The site has a login form - you'll need to provide credentials
- **Credentials**: Never saved to disk - only stored in memory during active sessions
- **Session Timeout**: Sessions expire after 30 minutes of inactivity

## Troubleshooting

### If login fails:
1. Check if selectors are correct
2. Try providing custom selectors
3. Check if there's a CAPTCHA or 2FA
4. Verify credentials are correct

### If navigation fails:
1. Ensure you're logged in first
2. Check if the URL/route exists
3. Wait for React to load (may need to wait for network idle)

### If file access fails:
1. Verify you have API or SSH access configured
2. Check file paths are correct
3. Ensure proper permissions

## Next Steps

1. Run `npm run remote-access` to start interactive session
2. Provide your login credentials when prompted
3. Navigate to the admin/backend area
4. Use the system to read/edit code as needed

Remember: **Credentials are never saved** - they're only stored in memory during your active session!

