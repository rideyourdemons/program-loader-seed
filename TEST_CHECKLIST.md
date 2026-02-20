# RYD Platform Test Checklist

**Run after any changes.** Use hard refresh (Ctrl+Shift+R / Cmd+Shift+R) between tests.

---

## 1. Home Page (/)

- [ ] Hard refresh `/` — no SyntaxError in console
- [ ] Tool of the Day renders (title + description)
- [ ] Tool of the Day never shows "Standard Practice (15 minutes)" or variant-style headline
- [ ] Quick Access cards (Tools, Insights, Gates) visible
- [ ] Nav links: Home, Tools, Insights, Gates, Search — all clickable

---

## 2. Navigation (Top Bar)

- [ ] Click **Tools** — URL changes to `/tools`, tools page loads
- [ ] Click **Insights** — URL changes to `/insights`, insights page loads
- [ ] Click **Gates** — URL changes to `/gates`, gates page loads
- [ ] Click **Search** — URL changes to `/search`, search page loads
- [ ] Click **Home** — returns to `/`
- [ ] No redirect loop back to home
- [ ] Each page shows its own content (not a blank or loading spinner indefinitely)

---

## 3. Tools Page (/tools)

- [ ] Tools list renders (grid of tool cards)
- [ ] Does NOT hang on "Loading tools..." indefinitely
- [ ] If registry load fails: error card with Retry button (no blank)
- [ ] Console: no SyntaxError, no MIME refusal for `/data/*.json`
- [ ] Tools with quality issues show NEEDS CONTENT badge (dev) or are hidden (prod)

---

## 4. Tool Detail (/tools/<slug>)

- [ ] Opening a tool link renders content
- [ ] If tool incomplete: shows "NEEDS CONTENT" panel, does not crash
- [ ] No redirect loop

---

## 5. Tool of the Day (Home)

- [ ] Only primary tools (no quick-reset, deep-work, 5/15/30 variants)
- [ ] Same day = same tool (reload twice, same tool)
- [ ] If eligible pool empty: "Tool of the Day" + "Needs content before rotation can start."
- [ ] No fallback loop or repeated retries

---

## 6. Insights Page (/insights)

- [ ] Page boots without SyntaxError
- [ ] Content renders (pain points, tools section, etc.)
- [ ] No infinite loop or redirect
- [ ] If tools dataset missing: error panel, not blank/loop

---

## 7. Gates Page (/gates)

- [ ] Gate list renders from `/data/gates.json`
- [ ] Gate titles readable (sufficient contrast)
- [ ] Per-gate styles apply (flame/glow from gate-styles.json)
- [ ] Click "Explore Gate" navigates to gate detail

---

## 8. Console & Network

- [ ] Console: no SyntaxError
- [ ] Console: validation logs are warnings (not fatal)
- [ ] Network: `/data/tools-canonical.json` and `/data/tools.json` return 200 + `application/json`
- [ ] Network: no HTML served for JS/JSON endpoints (no MIME mismatch)
- [ ] Network: `/js/config/analytics-config.js` 200 (or 404 for analytics-config.local.js is acceptable — has onerror)

---

## 9. Analytics (Optional)

- [ ] If GA4/GTM IDs configured: analytics loads
- [ ] If no IDs: no errors, no failed script loads (graceful)

---

## Pass Criteria

- All critical items (1–7) pass
- Console and Network (8) show no fatal errors
- Navigation and data loading work as expected

