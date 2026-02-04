# Sandbox Testing & Deployment Guide

## Quick Workflow

### Step 1: Test in Sandbox ✅

```bash
npm run test-redesign-sandbox
```

This will test:
- ✅ Tool rotation system
- ✅ AI tour guide system
- ✅ Content audit scripts
- ✅ Matrix engine integration
- ✅ Documentation availability
- ✅ Example components

**Result:** All 22 tests passed! ✅

---

### Step 2: Deploy to Production 🚀

Once sandbox tests pass, deploy:

```bash
npm run deploy-redesign
```

This will:
- ✅ Check sandbox test results
- ✅ Walk through deployment checklist
- ✅ Verify each component
- ✅ Create deployment log
- ✅ Guide you through next steps

---

## Detailed Process

### Testing Phase

**Run sandbox tests:**
```bash
npm run test-redesign-sandbox
```

**Expected output:**
```
✅ ALL TESTS PASSED - Ready for Deployment!
```

**Test results saved to:**
- `logs/test-results/redesign-sandbox-test-*.json`

**What gets tested:**
1. Tool rotation - Daily rotation algorithm
2. AI tour - Step navigation and progress
3. Content audit - Scripts availability
4. Matrix engine - Numerology calculations
5. Documentation - All required docs present
6. Components - Example files exist

---

### Deployment Phase

**Run deployment:**
```bash
npm run deploy-redesign
```

**Deployment steps:**
1. **Pre-flight checks** - Verifies sandbox tests passed
2. **Firebase verification** - Confirms Firebase access
3. **Tool rotation** - Confirms integration
4. **AI tour** - Confirms integration
5. **Content migration** - Checks migration status
6. **UX improvements** - Verifies changes applied
7. **Citations** - Confirms citation verification

**Deployment log saved to:**
- `logs/deployment/redesign-deployment-*.json`

---

## Integration Checklist

Before deploying, make sure you've integrated:

### Tool Rotation
- [ ] Imported `core/tool-rotation.js` into homepage
- [ ] Replaced static tool with `toolRotation.getToolOfTheDay()`
- [ ] Tested rotation changes daily
- [ ] Verified all tools appear in rotation

### AI Tour
- [ ] Imported `core/ai-tour-guide.js`
- [ ] Added `TourOverlay` component (adapt from example)
- [ ] Added `data-tour` attributes to elements
- [ ] Added "Take Tour" button
- [ ] Tested tour flow end-to-end

### Content Migration
- [ ] Run `npm run content-audit`
- [ ] Reviewed content inventory
- [ ] Migrated tools to Firestore
- [ ] Migrated research to Firestore
- [ ] Created matrix connections

### UX Improvements
- [ ] Applied spacing system
- [ ] Reduced homepage clutter
- [ ] Implemented progressive disclosure
- [ ] Simplified navigation
- [ ] Improved typography

### Citations
- [ ] Audited all content
- [ ] Added missing citations
- [ ] Verified citation links
- [ ] Integrated citation components

---

## Troubleshooting

### Tests Fail

If sandbox tests fail:
1. Review error messages in test output
2. Check test results JSON file
3. Fix issues before deploying
4. Re-run tests

### Deployment Issues

If deployment fails:
1. Check deployment log JSON file
2. Review error messages
3. Complete pending steps manually
4. Re-run deployment

### Integration Issues

If integration has problems:
1. Review `docs/IMPLEMENTATION_GUIDE.md`
2. Check example components
3. Verify imports are correct
4. Test in development first

---

## Commands Summary

```bash
# Test everything in sandbox
npm run test-redesign-sandbox

# Deploy after tests pass
npm run deploy-redesign

# Audit live platform content
npm run content-audit

# Access platform
npm run deploy-ryd
```

---

## Success Criteria

### Sandbox Tests ✅
- All tests pass (22/22)
- No critical failures
- Warnings acceptable if documented

### Deployment ✅
- All components integrated
- Content migrated
- UX improvements applied
- Citations verified
- System tested and working

---

**Ready to test? Run: `npm run test-redesign-sandbox`**
**Ready to deploy? Run: `npm run deploy-redesign`**




