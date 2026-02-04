# Firebase Authentication Guide

## Overview

The remote access system now supports Firebase Authentication. It can automatically detect Firebase on your website and use Firebase's authentication system instead of traditional form-based login.

## How It Works

1. **Auto-Detection**: The system automatically detects if your website uses Firebase
2. **Dual Mode**: Supports both Firebase UI and programmatic authentication
3. **Seamless Integration**: Works with existing credential management

## Website: rideyourdemons.com

Your website (https://rideyourdemons.com) has been configured and the system will automatically detect Firebase authentication.

## Usage

### Interactive CLI

```bash
npm run remote-access
```

1. Select `1` (Init Website Session)
2. Enter URL: `https://rideyourdemons.com`
3. Enter your Firebase email
4. Enter your Firebase password
5. When asked about login, select `y`
6. The system will automatically detect Firebase and use Firebase authentication

### Programmatic Usage

```javascript
import navigationController from './core/navigation-controller.js';

// Initialize session
const sessionId = await navigationController.initWebsiteSession({
  url: 'https://rideyourdemons.com',
  username: 'your-email@example.com', // Firebase email
  password: 'your-password' // Firebase password
});

// Login (automatically detects Firebase)
await navigationController.loginToWebsite(sessionId);
// Or explicitly use Firebase:
await navigationController.loginToWebsite(sessionId, { useFirebase: true });

// Verify authentication
const isAuth = await firebaseAuth.isAuthenticated(sessionId);
const user = await firebaseAuth.getCurrentUser(sessionId);
console.log(`Authenticated as: ${user.email}`);
```

## Authentication Methods

### 1. Firebase UI (Interactive)

If your site uses Firebase UI, the system will:
- Wait for Firebase UI to load
- Fill in email and password
- Click through the authentication flow
- Wait for successful authentication

### 2. Programmatic Firebase Auth

If Firebase SDK is available, the system will:
- Initialize Firebase (if needed)
- Use `signInWithEmailAndPassword()`
- Wait for auth state change
- Verify authentication

## Manual Override

You can force Firebase authentication:

```javascript
await navigationController.loginToWebsite(sessionId, {
  useFirebase: true // Force Firebase auth
});
```

Or disable Firebase and use form-based login:

```javascript
await navigationController.loginToWebsite(sessionId, {
  useFirebase: false, // Use traditional form
  usernameSelector: 'input[name="email"]',
  passwordSelector: 'input[name="password"]',
  submitSelector: 'button[type="submit"]'
});
```

## Firebase Config Detection

The system automatically detects Firebase configuration from:
- `window.firebase.apps[0].options`
- `window.firebaseConfig`
- Script tags containing Firebase config

## Verification

After login, verify authentication:

```javascript
import firebaseAuth from './core/firebase-auth.js';

// Check if authenticated
const isAuth = await firebaseAuth.isAuthenticated(sessionId);

// Get current user
const user = await firebaseAuth.getCurrentUser(sessionId);
console.log(user);
// { email: 'user@example.com', uid: '...', displayName: '...' }
```

## Troubleshooting

### Firebase Not Detected

If Firebase is not auto-detected:
1. Ensure Firebase SDK is loaded on the page
2. Check browser console for Firebase errors
3. Manually specify: `{ useFirebase: true }`

### Login Fails

1. **Check Credentials**: Verify email and password are correct
2. **Check Firebase Config**: Ensure Firebase is properly initialized
3. **Check Network**: Ensure Firebase services are accessible
4. **Check Console**: Look for Firebase errors in browser console

### UI vs Programmatic

If Firebase UI login fails:
- The system will automatically try programmatic auth
- Or manually specify method in selectors

## Security Notes

- Firebase credentials are handled securely
- Tokens are managed by Firebase SDK
- No Firebase credentials are stored (only email/password in memory)
- Sessions expire after 30 minutes

## Example: Complete Workflow

```javascript
// 1. Initialize session
const sessionId = await navigationController.initWebsiteSession({
  url: 'https://rideyourdemons.com',
  username: 'user@example.com',
  password: 'password123'
});

// 2. Login with Firebase (auto-detected)
await navigationController.loginToWebsite(sessionId);

// 3. Verify authentication
const user = await firebaseAuth.getCurrentUser(sessionId);
console.log(`Logged in as: ${user.email}`);

// 4. Navigate to admin area
await navigationController.navigateTo(sessionId, 'https://rideyourdemons.com/admin');

// 5. Work with the site...
const content = await navigationController.getCurrentContent(sessionId);

// 6. Close session
await navigationController.closeSession(sessionId);
```

## Next Steps

1. Run `npm run remote-access`
2. Provide your Firebase email and password
3. The system will automatically detect and use Firebase authentication
4. Navigate to your admin/backend areas
5. Read and edit code as needed

