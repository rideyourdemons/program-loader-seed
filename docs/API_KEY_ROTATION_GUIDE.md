# API Key Rotation Guide
## Firebase & Google Cloud Console

This guide explains how to safely rotate API keys for Firebase and Google Cloud services.

---

## 🔑 Types of Keys

### 1. Firebase Web API Keys
- **Used for:** Client-side applications (web, iOS, Android)
- **Location:** Firebase Console > Project Settings > General
- **Format:** String (e.g., `AIzaSy...`)

### 2. Google Cloud API Keys
- **Used for:** Google Cloud services (Maps, Translate, etc.)
- **Location:** Google Cloud Console > APIs & Services > Credentials
- **Format:** String (e.g., `AIzaSy...`)

### 3. Service Account Keys
- **Used for:** Server-side authentication
- **Location:** Google Cloud Console > IAM & Admin > Service Accounts
- **Format:** JSON file

---

## ⚠️ Security Best Practices

### Before Rotation
1. ✅ **Plan ahead** - Schedule rotation during low-traffic periods
2. ✅ **Create new keys first** - Never delete old keys before creating new ones
3. ✅ **Document usage** - Know which applications use which keys
4. ✅ **Test thoroughly** - Verify new keys work before switching

### During Rotation
1. ✅ **Update gradually** - Update applications one at a time
2. ✅ **Keep old keys active** - Maintain old keys during transition period
3. ✅ **Monitor closely** - Watch for errors after switching

### After Rotation
1. ✅ **Verify all systems** - Confirm everything works with new keys
2. ✅ **Wait 24-48 hours** - Ensure no issues before deleting old keys
3. ✅ **Delete old keys** - Remove old keys from console
4. ✅ **Update documentation** - Update config files and documentation

---

## 📋 Rotation Process

### Step 1: Rotate Firebase Web API Keys

1. **Access Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project

2. **Navigate to Project Settings**
   - Click gear icon > Project Settings
   - Go to "General" tab
   - Scroll to "Your apps" section

3. **Create New Key (if needed)**
   - Click "Add app" if creating new app
   - Copy the new API key

4. **Update Application**
   - Update your application configuration
   - Replace old API key with new one
   - Test application works

5. **Restrict Old Key (Recommended)**
   - Click on old API key
   - Add restrictions (HTTP referrers, API restrictions)
   - This limits old key usage without breaking existing apps

6. **Delete Old Key (After Verification)**
   - After 24-48 hours, delete the old key
   - Ensure all applications are using new key

---

### Step 2: Rotate Google Cloud API Keys

1. **Access Google Cloud Console**
   - Go to: https://console.cloud.google.com/
   - Select your project

2. **Navigate to Credentials**
   - Go to: APIs & Services > Credentials
   - Find your API key in "API keys" section

3. **Create New Key**
   - Click "Create credentials" > "API key"
   - Copy the new API key

4. **Configure Restrictions (Recommended)**
   - Click on new API key
   - Set "Application restrictions" (HTTP referrers, IP addresses, etc.)
   - Set "API restrictions" (limit which APIs can be called)
   - Save restrictions

5. **Update Application**
   - Update your application configuration
   - Replace old API key with new one
   - Test application works

6. **Restrict Old Key**
   - Click on old API key
   - Add restrictions to limit usage
   - This helps during transition period

7. **Delete Old Key (After Verification)**
   - After 24-48 hours, delete the old key
   - Ensure all applications are using new key

---

### Step 3: Rotate Service Account Keys

1. **Access Google Cloud Console**
   - Go to: https://console.cloud.google.com/
   - Select your project

2. **Navigate to Service Accounts**
   - Go to: IAM & Admin > Service Accounts
   - Find the service account you want to rotate

3. **Create New Key**
   - Click on service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file

4. **Store Key Securely**
   - ⚠️ **NEVER commit to git**
   - Store in secure location (environment variable, secret manager)
   - Update `.gitignore` to exclude key files
   - Set proper file permissions (600 or 400)

5. **Update Application**
   - Update your application to use new key file
   - Update `config/firebase-config.json` if using it
   - Test application works

6. **Delete Old Key**
   - Go back to Service Accounts > Keys tab
   - Find old key
   - Click "Delete" > Confirm
   - ⚠️ **Do this after confirming new key works**

---

## 🔧 Using the Rotation Script

The system includes an automated rotation script:

```bash
npm run rotate-api-keys
```

This script will:
- ✅ Guide you through each type of key rotation
- ✅ Help update configuration files
- ✅ Create rotation logs
- ✅ Provide verification checklist
- ✅ Give cleanup instructions

**Note:** The script guides you through the process but doesn't automatically delete keys (for safety).

---

## 📝 Configuration File Updates

### Firebase Config (`config/firebase-config.json`)

When rotating service account keys, update the path:

```json
{
  "serviceAccountPath": "path/to/new-service-account.json",
  "projectId": "your-project-id",
  "lastUpdated": "2025-12-25T00:00:00.000Z",
  "previousPath": "path/to/old-service-account.json"
}
```

**Backup tip:** The script creates automatic backups of config files.

### Environment Variables

If using environment variables, update:

```bash
# Old
FIREBASE_SERVICE_ACCOUNT=path/to/old-key.json

# New
FIREBASE_SERVICE_ACCOUNT=path/to/new-key.json
```

---

## ✅ Verification Checklist

After rotating keys, verify:

- [ ] All applications can authenticate
- [ ] Firebase services work correctly
- [ ] Google Cloud API calls succeed
- [ ] No errors in application logs
- [ ] All services accessible
- [ ] Configuration files updated
- [ ] Documentation updated
- [ ] Old keys restricted (if keeping temporarily)

**Wait 24-48 hours before deleting old keys!**

---

## 🗑️ Cleanup Old Keys

### When to Delete

✅ Delete old keys only after:
1. New keys are created and working
2. All applications updated
3. No errors for 24-48 hours
4. All systems verified working

### How to Delete

1. **Firebase Web API Keys**
   - Firebase Console > Project Settings > General
   - Find old key > Delete

2. **Google Cloud API Keys**
   - Google Cloud Console > APIs & Services > Credentials
   - Click on old key > Delete

3. **Service Account Keys**
   - Google Cloud Console > IAM & Admin > Service Accounts
   - Select service account > Keys tab
   - Find old key > Delete

---

## 📚 Helpful Links

- **Firebase Console:** https://console.firebase.google.com/
- **Google Cloud Console:** https://console.cloud.google.com/
- **Firebase Docs:** https://firebase.google.com/docs
- **Google Cloud Docs:** https://cloud.google.com/docs
- **Service Accounts Guide:** https://cloud.google.com/iam/docs/service-accounts

---

## 🔒 Security Reminders

### DO:
✅ Rotate keys regularly (every 90 days recommended)
✅ Use key restrictions (API limits, application restrictions)
✅ Store service account keys securely (not in git)
✅ Use environment variables or secret managers
✅ Monitor key usage
✅ Delete unused keys immediately

### DON'T:
❌ Commit API keys to git repositories
❌ Share keys in plain text
❌ Delete old keys before new ones are verified
❌ Use same key for multiple environments
❌ Leave keys unrestricted
❌ Store keys in client-side code (except Firebase Web API keys with restrictions)

---

## 🆘 Troubleshooting

### Application Can't Authenticate

1. Check new key is correct
2. Verify key restrictions allow your application
3. Confirm configuration file updated
4. Check environment variables set correctly
5. Review application logs for specific errors

### Old Key Still Works

This is normal during transition period. Once new key is verified, delete old key.

### Service Account Key Issues

1. Verify JSON file format is correct
2. Check file permissions (600 or 400)
3. Confirm service account has required roles
4. Verify project ID matches
5. Test key with Firebase Admin SDK

---

## 📊 Rotation Logs

Rotation logs are saved to:
```
logs/key-rotation/key-rotation-*.json
```

Logs include:
- Keys rotated (type, masked values)
- Timestamps
- Verification status
- Cleanup status

---

**Remember: Always create new keys before deleting old ones!** 🔐




