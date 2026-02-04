# Production Architecture - Ride Your Demons

## Overview

This is the **production-safe, self-help (NOT therapy) platform** using a self-resonating, self-correcting, ethically self-expanding matrix architecture with:
- Regional language + ethics adaptation
- Ethical GA4 analytics governance
- Optional, passive storefront merch
- Numerology system as symbolic/contextual overlay only

## Absolute Constraints

- **SELF-HELP and EDUCATIONAL only** — NOT therapy, diagnosis, treatment, or medical advice
- **NO clinical, therapeutic, diagnostic, or mental-health treatment language**
- **NO emotional manipulation, vulnerability targeting, urgency pressure, or coercive UX**
- **NO psychological profiling**
- **NO system self-modification of source code**
- **NO autonomous advice, prescriptions, or personalized psychological claims**
- **All adaptive behavior MUST be bounded, logged, reversible, and human-auditable**
- **Meaning and intent MUST remain invariant across regions** — ONLY language, tone, and disclosures may change
- **Numerology MUST NOT be presented as truth, prediction, guidance, or authority**

## Canonical Authority

- `public/index-integrated-ryd.html` is the **SINGLE authoritative production shell**
- All other index or integrated HTML files must redirect or be demoted
- No duplicated headers, footers, disclaimers, or ethics text anywhere

## Directory Structure

```
/production
  /core
    matrix-engine.js         // relevance routing only
    state-registry.json      // NON-CLINICAL self-help states
    weight-table.json        // capped adaptive weights
    ethics-guard.js          // hard veto rules
    region-profiles.json    // language + ethics overlays
    analytics-guard.js      // GA4 governance rules
    numerology-engine.js    // symbolic overlay only
    numerology-map.json     // fixed meanings, non-adaptive
    audit-log.json          // append-only (matrix, analytics, numerology)

  /tools
    tool-*.html              // educational self-help tools only

  /store
    index.html               // merch only, optional, passive

  index-integrated-ryd.html  // production shell

/sandbox
  experiments
  mocks
  simulations

/docs
  disclosures
  ethics
  analytics
  numerology
  audits
```

## Core System Behavior

### 1. SELF-MATRIX (NON-CLINICAL)
- Classify user interaction into educational / self-help states only
- Route to tools based on relevance signals (engagement, clarity, usefulness)
- **NO emotional inference, NO diagnosis, NO vulnerability scoring**

### 2. SELF-RESONATING (BOUNDED)
- Increase tool weight on positive engagement signals
- Decay weight on low usefulness or confusion
- **Cap all weights to prevent runaway amplification**

### 3. SELF-CORRECTING (SAFE)
- Detect drop-offs, confusion, or negative signals
- Reduce prominence, **never delete automatically**
- Log every adjustment to audit-log.json

### 4. SELF-EXPANDING (ETHICAL)
- New tools/pages added ONLY by:
  - a) explicit human approval OR
  - b) predefined rule satisfaction
- **NO hallucinated content**
- **NO auto-generated advice**

### 5. REGIONAL LANGUAGE + ETHICS ADAPTATION
- Maintain **ONE canonical meaning and intent**
- Apply region profiles to adapt:
  - language
  - tone
  - spelling
  - required disclaimers
  - commerce compliance text
- **Prohibit region-specific manipulation or persuasion**

### 6. STOREFRONT INTEGRATION (PASSIVE ONLY)
- Merch suggestions must be **OPTIONAL and CONTEXTUAL**
- **NO timing based on distress, emotion, or vulnerability**
- **NO language implying necessity, outcome, or improvement**
- Commerce copy must comply with regional consumer law

### 7. GA4 ANALYTICS (ETHICAL, GOVERNED)
- GA4 used for **AGGREGATE ANALYTICS ONLY**
- Track: page views, tool usage counts, navigation paths, anonymized engagement time
- **DO NOT track**: emotional states, mental health inference, vulnerability signals, personalized persuasion
- Disable: Google Signals, Ads personalization, User-level profiling
- Enforce IP anonymization
- Respect regional consent (GDPR, Canada, US)
- Route GA4 data ONLY through analytics-guard.js

### 8. ANALYTICS → MATRIX LINK (STRICTLY LIMITED)
- GA4 data may ONLY: inform aggregate usefulness, adjust weight-table.json, flag unclear tools for human review
- GA4 must NEVER: trigger merch, change tone, infer emotional state

### 9. NUMEROLOGY INTEGRATION (SYMBOLIC OVERLAY ONLY)
- Numerology is a **SYMBOLIC / REFLECTIVE OVERLAY ONLY**
- It MUST NOT: claim truth, predict outcomes, guide decisions, imply causation, override matrix logic
- Numerology may: provide metaphorical framing, offer reflective prompts, act as an OPTIONAL lens
- Numerology meanings MUST be: static, documented, non-adaptive, culturally neutral
- Numerology must NEVER: personalize psychological claims, target vulnerability, influence merch
- All numerology output MUST include disclosure: "Numerology is presented here as symbolic reflection only, not factual guidance."

## Ethics Guard (Hard Veto Rules - Global)

- Block clinical language (diagnose, treat, heal, disorder, condition, therapy)
- Block outcome promises
- Block urgency framing
- Block emotional leverage
- Block GA4-based psychological inference
- Block numerology-as-truth framing
- **If uncertain → FAIL CLOSED**

## Implementation Requirements

- Clean, readable JavaScript
- Clear comments explaining WHY decisions exist
- **NO mock, test, or sandbox logic in production**
- Single source of truth for layout and disclosures
- Audit-ready, investor-safe, regulator-safe output

## End Result

A globally compliant, ethical, self-help platform that:
- adapts via feedback (not persuasion),
- corrects via bounded logic,
- expands via rules,
- contextualizes via symbolic numerology (safely),
- monetizes via OPTIONAL merchandise,
- and remains legally, ethically, and structurally defensible long-term.

