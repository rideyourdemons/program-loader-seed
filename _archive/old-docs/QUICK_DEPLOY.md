# Quick Deploy to Firebase Preview Channel

## ✅ You Have Firebase Account - Just Need to Authenticate

Run these commands in your terminal (one at a time):

### 1. Navigate to your site directory:
```bash
cd "C:\Users\Earl Taylor\Documents\site"
```

### 2. Login to Firebase (opens browser):
```bash
firebase login --reauth
```
**What happens:**
- Browser opens automatically
- Sign in to Firebase
- Grant permissions
- Terminal shows "Success! Logged in as [your email]"

### 3. Deploy to preview channel:
```bash
firebase hosting:channel:deploy prelaunch-test
```

---

## After Deployment

Firebase will show you a preview URL like:
```
https://rideyourdemons--prelaunch-test-xxxxx.web.app
```

**Access the platform at:**
```
https://rideyourdemons--prelaunch-test-xxxxx.web.app/platform-overlay/index.html
```

---

## Notes

- ✅ Platform file is already in your site at: `platform-overlay/index.html`
- ✅ Safe to deploy - this is a preview channel, not production
- ✅ Won't affect your live site

---

**Ready?** Just copy/paste the commands above into your terminal! 🚀

