# Final "Switch-Flip" Verification Checklist

## ✅ The "Null" Test
**Action:** Open browser console and check for "null" text in UI

**Steps:**
1. Open `http://localhost:3000/insights`
2. Open browser DevTools (F12)
3. Navigate to Console tab
4. Search for the word "null" in the page (Ctrl+F)
5. **Expected:** No "null" text visible in UI
6. **If found:** Strict-Schema filter needs adjustment

**Console Check:**
```javascript
// Run in browser console
document.body.innerText.includes('null') ? '❌ NULL FOUND' : '✅ NO NULL'
```

---

## ✅ The "Taskbar" Test
**Action:** Verify Tour Guide navigation buttons stay visible

**Steps:**
1. Open `http://localhost:3000/insights`
2. Shrink browser window to minimum height
3. Look for Tour Guide box (bottom right)
4. **Expected:** Navigation buttons ("Next/Prev") are visible and clickable
5. **If hidden:** CSS viewport constraints need adjustment

**Visual Check:**
- Tour Guide should be at `bottom: 85px; right: 25px;`
- Navigation buttons should never be behind taskbar
- Internal container should have `overflow-y: auto;`

---

## ✅ The "Shard" Check
**Action:** Verify `/shards/` directory exists and is ready

**Steps:**
1. Check project folder for `/shards/` directory
2. **Expected:** Directory exists (may be empty for new installations)
3. **When populated:** Should contain timestamped JSON files like `shard-2026-02-10T...json`

**Terminal Check:**
```bash
# Check if shards directory exists
ls -la shards/

# Or on Windows:
dir shards
```

**API Check:**
```bash
# List all archived shards
curl http://localhost:3000/api/shard/list
```

---

## ✅ The "Encoding" Test
**Action:** Verify no Mojibake characters (ÃƒÂ°) appear

**Steps:**
1. Open `http://localhost:3000/insights`
2. Navigate through different tools and pain points
3. **Expected:** All text displays correctly (no garbled characters)
4. **If found:** UTF-8 headers or Strict-Schema filter needs adjustment

**Console Check:**
```javascript
// Run in browser console to check for Mojibake
const mojibakePattern = /Ã[ƒÂ°]/;
document.body.innerText.match(mojibakePattern) ? '❌ MOJIBAKE FOUND' : '✅ CLEAN'
```

---

## ✅ The "GA4" Test
**Action:** Verify Action Imperative events are tracked

**Steps:**
1. Open `http://localhost:3000/insights`
2. Open browser DevTools → Console
3. Click an "Action Imperative" card
4. **Expected:** Console shows `[GA4] Event Dispatched: action_imperative_clicked`
5. **If missing:** Analytics wrapper needs adjustment

**Console Check:**
```javascript
// Check if GA4 events are firing
// Look for: [GA4] Event Dispatched: action_imperative_clicked
```

---

## ✅ The "Health Check" Test
**Action:** Run the health check script

**Steps:**
1. Ensure server is running: `node server.cjs`
2. Run: `node scripts/health-check-shard.js`
3. **Expected:** All checks pass (Server, Nodes API, Shard Manager)
4. **If fails:** Check server logs for errors

**Expected Output:**
```
✅ Server is running
✅ Nodes API responding
✅ Shard Manager responding
🎉 Shard #1 is successfully communicating with the UI!
```

---

## 🎯 Final Status

After completing all checks:

- [ ] Null Test: No "null" text in UI
- [ ] Taskbar Test: Tour Guide buttons always visible
- [ ] Shard Check: `/shards/` directory exists
- [ ] Encoding Test: No Mojibake characters
- [ ] GA4 Test: Events firing correctly
- [ ] Health Check: All endpoints responding

**If all checks pass:** ✅ System is production-ready!
