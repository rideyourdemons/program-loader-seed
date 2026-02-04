# Platform Overlay Integration Guide

## Overview

This guide explains how to integrate the complete RYD platform as a **test overlay** on the live site. The overlay can be tested before making it publicly available.

---

## What is the Platform Overlay?

The platform overlay is the complete integrated platform (`platform-integrated.html`) that includes:

- ✅ Search for Help functionality
- ✅ Tool of the Day (rotating daily)
- ✅ Tour Guide System
- ✅ Pain Point Pages with 3 tools
- ✅ Tool Workthroughs with research citations
- ✅ Matrix Loop navigation
- ✅ Complete styling (matches live site)
- ✅ Mobile/Desktop responsive
- ✅ SEO optimized

---

## Integration Process

### Step 1: Run Integration Script

```bash
npm run integrate-platform-overlay
```

This script will:
1. Locate your RYD site codebase
2. Copy platform files to `public/platform-overlay/`
3. Create React component wrapper (if React site)
4. Create test page for direct access
5. Generate integration instructions

### Step 2: Files Created

After running the script, you'll have:

```
your-site/
├── public/
│   └── platform-overlay/
│       ├── index.html          # Complete platform
│       └── test.html           # Standalone test page
├── src/
│   └── components/
│       └── PlatformOverlay.jsx  # React wrapper (if React)
└── PLATFORM_OVERLAY_INTEGRATION.md  # This file
```

---

## Testing Options

### Option 1: Direct Access (Easiest)

Navigate to:
```
http://localhost:3000/platform-overlay/test.html
```
or on live site:
```
https://rideyourdemons.com/platform-overlay/test.html
```

This shows the platform with a red "TEST MODE" banner.

### Option 2: URL Parameter (Recommended for React)

Add `?test=true` to any URL:
```
http://localhost:3000/?test=true
https://rideyourdemons.com/?test=true
```

**Requires:** PlatformOverlay component integrated in your app (see below).

### Option 3: LocalStorage

Open browser console and run:
```javascript
localStorage.setItem('platform_test_mode', 'true');
location.reload();
```

To disable:
```javascript
localStorage.removeItem('platform_test_mode');
location.reload();
```

---

## React Integration (If Using React)

### Step 1: Import Component

In your main App.js or App.jsx:

```jsx
import PlatformOverlay from './components/PlatformOverlay';

function App() {
  return (
    <>
      {/* Your existing app content */}
      
      {/* Platform overlay (only shows in test mode) */}
      <PlatformOverlay />
    </>
  );
}
```

### Step 2: Test

1. Start your development server
2. Visit `http://localhost:3000/?test=true`
3. Platform overlay should appear
4. Test all features
5. Remove `?test=true` to return to normal site

---

## How It Works

### Test Mode Detection

The overlay only appears when:

1. **URL Parameter:** `?test=true` is in the URL
2. **LocalStorage:** `platform_test_mode` is set to `'true'`

### Overlay Behavior

- **Fixed Position:** Overlays the entire site (z-index: 999999)
- **Full Screen:** Covers the viewport completely
- **Non-Intrusive:** Only shows when test mode is enabled
- **Easy Toggle:** Can be enabled/disabled instantly

---

## Safety Features

✅ **Test Mode Only:** Platform only shows when explicitly enabled  
✅ **No Public Access:** Regular visitors won't see it  
✅ **Easy Toggle:** Can be enabled/disabled without code changes  
✅ **Safe Testing:** Test on live site without affecting public users  
✅ **Clean Removal:** Can be removed easily if needed  

---

## Making It Public (When Ready)

When you're ready to make the platform publicly available:

### Option 1: Remove Test Mode Check

In `PlatformOverlay.jsx`, change:
```jsx
const testMode = 
  window.location.search.includes('test=true') || 
  localStorage.getItem('platform_test_mode') === 'true';

if (testMode) {
  // Show overlay
}
```

To:
```jsx
// Always show overlay
// Show overlay
```

### Option 2: Feature Flag

Add a feature flag in your config:
```jsx
const showPlatform = 
  config.features.platformEnabled || 
  window.location.search.includes('test=true');

if (showPlatform) {
  // Show overlay
}
```

### Option 3: Replace Existing Homepage

When ready, you can replace your existing homepage with the platform directly.

---

## Testing Checklist

Before making public, test:

- [ ] Search functionality works
- [ ] Tool of the Day displays and rotates
- [ ] Tour guide works correctly
- [ ] Pain point pages load
- [ ] Tool workthroughs display
- [ ] Research citations show correctly
- [ ] Matrix loop navigation works
- [ ] Mobile responsive (test on mobile device)
- [ ] Desktop layout correct
- [ ] All links functional
- [ ] No JavaScript errors (check console)
- [ ] Styling matches live site
- [ ] SEO tags present
- [ ] Legal disclaimers visible

---

## Troubleshooting

### Platform Doesn't Show

1. **Check test mode:** Ensure `?test=true` is in URL or localStorage is set
2. **Check console:** Look for JavaScript errors
3. **Check component:** Ensure PlatformOverlay is imported and used
4. **Check path:** Verify files are in `public/platform-overlay/`

### Styling Issues

1. **Clear cache:** Hard refresh (Ctrl+Shift+R)
2. **Check CSS:** Verify all CSS is embedded in HTML
3. **Check conflicts:** Ensure no CSS conflicts with existing site

### Functionality Issues

1. **Check console:** Look for JavaScript errors
2. **Check data:** Verify mock data is present
3. **Check initialization:** Ensure DOM is ready before initialization

---

## File Structure

```
platform-overlay/
├── index.html          # Complete platform (all-in-one)
└── test.html           # Test page wrapper

components/
└── PlatformOverlay.jsx # React wrapper component
```

---

## Next Steps

1. ✅ Run `npm run integrate-platform-overlay`
2. ✅ Test with `/platform-overlay/test.html`
3. ✅ Integrate React component (if using React)
4. ✅ Test with `?test=true` parameter
5. ✅ Complete testing checklist
6. ✅ When ready, enable for public release

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify files were copied correctly
3. Ensure test mode is enabled
4. Review integration steps

---

**Remember:** The platform is in TEST MODE by default and will only show when explicitly enabled. This allows safe testing on the live site before public release.

