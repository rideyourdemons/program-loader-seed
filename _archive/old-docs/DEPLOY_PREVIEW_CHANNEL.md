# Deploy to Firebase Preview Channel

## Quick Deploy Command

```bash
cd "C:\Users\Earl Taylor\Documents\site"
firebase hosting:channel:deploy prelaunch-test
```

---

## If Authentication Required

If you get an authentication error, login first:

```bash
firebase login --reauth
```

This will:
1. Open your browser
2. Ask you to authenticate with Firebase
3. Complete the login process
4. Return to terminal when done

Then run the deploy command again.

---

## What Happens During Deploy

1. ✅ Firebase validates your authentication
2. ✅ Uploads all files from your site directory
3. ✅ Creates preview channel "prelaunch-test"
4. ✅ Provides a preview URL

---

## Preview URL

After successful deployment, Firebase will provide a URL like:

```
https://rideyourdemons--prelaunch-test-xxxxx.web.app
```

### Access Platform

The platform will be available at:
```
https://rideyourdemons--prelaunch-test-xxxxx.web.app/platform-overlay/index.html
```

---

## Files Deployed

- ✅ Your entire site (from `C:\Users\Earl Taylor\Documents\site`)
- ✅ Platform overlay at `/platform-overlay/index.html`
- ✅ All existing site files

---

## Testing

1. Visit the preview URL
2. Navigate to `/platform-overlay/index.html`
3. Test all platform features:
   - Search functionality
   - Tool of the Day
   - Tour guide
   - Pain point pages
   - Tool workthroughs
   - Research citations
   - Matrix loop navigation

---

## Next Steps After Testing

When ready to make public:

1. **Option 1:** Deploy to production
   ```bash
   firebase deploy --only hosting
   ```

2. **Option 2:** Integrate platform into main site structure
   - Move platform from overlay to main pages
   - Remove test mode restrictions
   - Deploy to production

---

**Ready to deploy?** Run:
```bash
firebase login --reauth  # If needed
firebase hosting:channel:deploy prelaunch-test
```

