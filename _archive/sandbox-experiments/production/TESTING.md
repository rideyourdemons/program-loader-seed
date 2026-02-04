# Production Testing Guide

## Overview

This document outlines testing procedures to verify the platform is production-ready, SEO-effective, ethically compliant, and properly isolated.

## Test Categories

### 1. SEO Test

**Purpose:** Verify numerology pages are indexable, informational, and non-salesy.

**Procedure:**
1. Search for common numerology queries (e.g., "number 1 numerology meaning", "number 7 numerology")
2. Verify numerology pages appear in search results
3. Confirm pages feel informational, not salesy
4. Verify no merch links on numerology pages
5. Confirm disclosure is present and clear

**Expected Results:**
- Numerology pages are indexable
- Pages answer symbolic queries clearly
- No sales language or urgency
- Disclosure present: "Numerology is presented as symbolic reflection only, not factual guidance"
- One neutral link to `/tools/` at bottom

**Pass Criteria:** All expected results met

---

### 2. UX Test - Numerology → Tools Handoff

**Purpose:** Verify handoff from numerology to tools feels optional and natural.

**Procedure:**
1. Navigate to a numerology page (e.g., `/numerology/number-1.html`)
2. Scroll to bottom
3. Click "Explore reflection tools" link
4. Verify `/tools/index.html` loads
5. Confirm tools page states tools are optional, educational, non-clinical

**Expected Results:**
- Handoff link is present but not pushy
- Tools page clearly states educational purpose
- No urgency or pressure
- Tools are presented as optional

**Pass Criteria:** Handoff feels optional and natural

---

### 3. GA4 Test

**Purpose:** Verify GA4 tracks only aggregate events, no psychological inference.

**Procedure:**
1. Open browser DevTools → Network tab
2. Filter for `gtm.js` and `collect` requests
3. Navigate through site (numerology page → tools page → tool page)
4. Inspect GA4 events in Network requests
5. Verify only allowed events fire:
   - `page_view`
   - `tool_view`
   - `navigation_click`
   - `time_on_page`
6. Verify NO forbidden events:
   - `emotional_state`
   - `vulnerability_detected`
   - `distress_level`
   - `mental_health_inference`

**Expected Results:**
- Only aggregate events fire
- No psychological inference events
- IP anonymization enabled
- No user IDs tracked

**Pass Criteria:** Only allowed events fire, no forbidden events

---

### 4. Architecture Test - System Isolation

**Purpose:** Verify numerology does not affect matrix, analytics, or routing.

**Procedure:**
1. Check `matrix-engine.js` - verify no numerology imports
2. Check `analytics-guard.js` - verify no numerology logic
3. Check `weight-table.json` - verify no numerology fields
4. Check `audit-log.json` - verify numerology entries are separate
5. Verify numerology pages do not import matrix or analytics engines

**Expected Results:**
- Numerology is isolated from matrix engine
- Numerology does not affect weights or routing
- Numerology does not trigger analytics events
- Numerology does not influence merch visibility

**Pass Criteria:** Numerology is completely isolated

---

### 5. Ethics Test

**Purpose:** Verify ethics guard blocks restricted language.

**Procedure:**
1. Attempt to use clinical terms in content:
   - "diagnose", "treat", "therapy", "disorder"
2. Attempt to use urgency language:
   - "you need this", "don't miss", "fix yourself"
3. Attempt to use outcome promises:
   - "guaranteed", "will fix", "will cure"
4. Attempt to use numerology as truth:
   - "this means", "this predicts", "this will happen"
5. Verify ethics guard blocks all attempts

**Expected Results:**
- All restricted language is blocked
- Ethics guard returns violations
- Content is rejected before display
- Audit log records violations

**Pass Criteria:** Ethics guard blocks all restricted language

---

### 6. Matrix Invisibility Test

**Purpose:** Verify matrix engine is invisible to users and SEO.

**Procedure:**
1. View page source of production pages
2. Search for "matrix-engine" or "matrix" references
3. Verify no user-facing matrix language
4. Verify no SEO-visible matrix references
5. Check that tool ordering appears natural, not algorithmic

**Expected Results:**
- No "matrix" references in user-facing content
- No "matrix" in page titles or meta descriptions
- Tool ordering appears natural
- Matrix operates invisibly via weights only

**Pass Criteria:** Matrix is completely invisible

---

### 7. Storefront Test

**Purpose:** Verify storefront is passive and never urgency-based.

**Procedure:**
1. Navigate to `/store/`
2. Verify no urgency language
3. Verify no outcome promises
4. Verify no emotional timing
5. Verify no numerology → merch links
6. Check regional consumer disclosures

**Expected Results:**
- Store is optional and passive
- No urgency or pressure
- No outcome claims
- Regional disclosures present

**Pass Criteria:** Store is passive and compliant

---

## Running All Tests

Execute tests in order:
1. SEO Test
2. UX Test
3. GA4 Test
4. Architecture Test
5. Ethics Test
6. Matrix Invisibility Test
7. Storefront Test

## Pass/Fail Criteria

**Overall Pass:** All 7 test categories pass

**Individual Test Pass:** All expected results met for that test

**Fail Action:** Document failure, fix issue, re-run test

## Test Results Log

| Test | Date | Result | Notes |
|------|------|--------|-------|
| SEO Test | | | |
| UX Test | | | |
| GA4 Test | | | |
| Architecture Test | | | |
| Ethics Test | | | |
| Matrix Invisibility Test | | | |
| Storefront Test | | | |

