# Deploy to Firebase Hosting Preview Channel

## Quick Deploy

Deploy the platform to Firebase Hosting preview channel for testing:

```bash
firebase hosting:channel:deploy prelaunch-test
```

---

## What This Does

1. **Creates a preview URL** - Temporary URL for testing
2. **Deploys platform files** - All platform files from `sandbox-preview/`
3. **Safe testing** - Separate from production, won't affect live site
4. **Shareable** - Get a URL you can share for testing

---

## Prerequisites

### 1. Firebase CLI Installed

```bash
npm install -g firebase-tools
```

### 2. Logged In to Firebase

```bash
firebase login
```

### 3. Firebase Project Set

The `.firebaserc` file should have your project:
```json
{
  "projects": {
    "default": "rideyourdemons"
  }
}
```

---

## Deployment Process

### Step 1: Verify Configuration

Check `firebase.json` is configured correctly:
- `public`: Points to `sandbox-preview`
- `rewrites`: Routes all requests to `platform-integrated.html`

### Step 2: Deploy

```bash
cd program-loader-seed
firebase hosting:channel:deploy prelaunch-test
```

### Step 3: Get Preview URL

After deployment, Firebase will provide a preview URL like:
```
https://rideyourdemons--prelaunch-test-xxxxx.web.app
```

### Step 4: Test

1. Visit the preview URL
2. Test all features
3. Share with team for review
4. When ready, deploy to production

---

## File Structure for Firebase

```
program-loader-seed/
├── firebase.json          # Firebase hosting config
├── .firebaserc           # Firebase project config
└── sandbox-preview/
    └── platform-integrated.html  # Main platform file
```

---

## Deployment Options

### Preview Channel (Recommended for Testing)

```bash
firebase hosting:channel:deploy prelaunch-test
```

Creates temporary preview URL for testing.

### Production Deploy (When Ready)

```bash
firebase deploy --only hosting
```

Deploys to production site.

---

## Configuration Details

### firebase.json

- **public**: `sandbox-preview` - Source directory
- **rewrites**: Routes all requests to platform-integrated.html
- **headers**: Disables caching for HTML/JS/CSS during testing

### Routes

- `/platform-overlay/**` → `platform-integrated.html`
- `/test` → `platform-integrated.html`
- `/**` → `platform-integrated.html` (all routes)

---

## Testing Checklist

After deployment, test:

- [ ] Platform loads correctly
- [ ] Search functionality works
- [ ] Tool of the Day displays
- [ ] Tour guide works
- [ ] Pain point pages load
- [ ] Tool workthroughs display
- [ ] Research citations show
- [ ] Mobile responsive
- [ ] Desktop layout correct
- [ ] All links functional
- [ ] No console errors

---

## Preview Channel Benefits

✅ **Safe Testing** - Separate from production  
✅ **Shareable URL** - Easy to share with team  
✅ **Temporary** - Automatically expires after period  
✅ **No Production Impact** - Live site unaffected  
✅ **Multiple Channels** - Can create multiple test channels  

---

## Multiple Preview Channels

You can create multiple preview channels:

```bash
# Test channel 1
firebase hosting:channel:deploy prelaunch-test

# Test channel 2
firebase hosting:channel:deploy staging-review

# Test channel 3
firebase hosting:channel:deploy client-preview
```

Each gets its own URL and can be tested independently.

---

## Production Deployment (When Ready)

When testing is complete and you're ready for production:

```bash
firebase deploy --only hosting
```

This deploys to your production site.

---

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### "Not logged in"
```bash
firebase login
```

### "Project not found"
Check `.firebaserc` has correct project ID.

### "Directory not found"
Verify `sandbox-preview/` directory exists with `platform-integrated.html`.

---

## Next Steps After Deploy

1. ✅ Test all features on preview URL
2. ✅ Share URL with team/stakeholders
3. ✅ Gather feedback
4. ✅ Make any necessary fixes
5. ✅ Re-deploy to preview channel if needed
6. ✅ When ready, deploy to production

---

**Ready to deploy?** Run:
```bash
firebase hosting:channel:deploy prelaunch-test
```

