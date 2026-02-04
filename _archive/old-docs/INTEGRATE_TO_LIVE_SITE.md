# Integrate Platform to Live Site

## What You Need

The platform needs to be integrated **into your actual live site codebase** (not a separate deployment).

This means:
- Platform files go **into** your existing site structure
- Same Firebase deployment
- Testable on live site via feature flag/parameter
- One deployment, not separate preview

---

## Step 1: Find Your Live Site Codebase

Your live site codebase is likely located in one of these:

- `C:\Users\Earl Taylor\Documents\site`
- `C:\Users\Earl Taylor\Google Drive\MyDrive\site`
- `G:\MyDrive\site`
- `C:\Users\Earl Taylor\OneDrive\site`

Or wherever your `rideyourdemons.com` site code lives.

---

## Step 2: Run Integration Script

```bash
npm run integrate-platform-overlay
```

This will:
1. Find your site codebase
2. Copy platform files to your site
3. Create integration component
4. Set up test mode

---

## Step 3: Integration Options

### Option A: If React Site

The script will create:
- `public/platform-overlay/index.html` - Platform file
- `src/components/PlatformOverlay.jsx` - React component

Add to your App.js:
```jsx
import PlatformOverlay from './components/PlatformOverlay';

function App() {
  return (
    <>
      {/* Your existing app */}
      <PlatformOverlay />  {/* Shows when ?test=true */}
    </>
  );
}
```

### Option B: If HTML/Static Site

Copy `platform-integrated.html` to your public folder and access directly:
- `/platform-overlay/index.html`
- Or replace your homepage temporarily for testing

---

## Step 4: Deploy via Firebase (Same Deployment)

Once integrated into your site:

```bash
cd /path/to/your/site
firebase deploy --only hosting
```

Or deploy to preview channel from your site directory:
```bash
firebase hosting:channel:deploy prelaunch-test
```

This deploys **your integrated site** (with platform), not a separate deployment.

---

## Test Mode

Platform only shows when:
- URL has `?test=true` parameter
- OR localStorage has `platform_test_mode=true`

Regular visitors see normal site.

---

## Summary

**Current approach (wrong):**
- Separate deployment ❌
- Different Firebase project ❌

**Correct approach:**
- Platform files **in** your site codebase ✅
- Same Firebase deployment ✅
- Test mode flag ✅
- One site, toggleable platform ✅

---

**Next step:** Run `npm run integrate-platform-overlay` to copy files into your actual site codebase.

