# GA4 Analytics Governance

## Purpose

This document defines how Google Analytics 4 (GA4) is used on this platform for aggregate analytics only, not psychological inference or manipulation.

## What We Track (Allowed)

### Aggregate Metrics Only
- Page views (counts)
- Tool usage (counts)
- Navigation paths (aggregate patterns)
- Time on page (aggregate averages)
- Scroll depth (aggregate averages)

### Allowed Events
- `page_view`
- `tool_view`
- `tool_start`
- `tool_complete`
- `navigation_click`
- `time_on_page`
- `scroll_depth`

## What We Do NOT Track (Forbidden)

### Psychological Inference
- Emotional states
- Vulnerability scores
- Distress levels
- Mental health inference
- Psychological profiles
- User emotions
- Inferred psychological states

### Forbidden Events
- `emotional_state`
- `vulnerability_detected`
- `distress_level`
- `mental_health_inference`
- `psychological_profile`
- `user_emotion`
- `user_state_inference`

## GA4 Configuration Requirements

### Required Settings
- **IP Anonymization**: Enabled
- **Cookie Expiration**: Session-based (or respect regional consent)
- **Do Not Track**: Respected
- **Consent Mode**: Required (GDPR, etc.)

### Disabled Features
- Google Signals
- Ads Personalization
- User-level Profiling
- Cross-device Tracking
- Demographics and Interests
- Remarketing

## Analytics → Matrix Connection (Strictly Limited)

Analytics data may ONLY be used for:
- Informing aggregate usefulness
- Adjusting weight-table.json (bounded)
- Flagging unclear tools for human review

Analytics data must NEVER be used for:
- Triggering merch suggestions
- Changing tone or language
- Inferring emotional state
- Personalizing content
- Targeting vulnerability

## Regional Compliance

- **GDPR (EU)**: Consent required before tracking
- **Canada**: PIPEDA compliance
- **US**: State privacy law compliance
- **All Regions**: Respect Do Not Track headers

## Analytics Guard

All GA4 events and parameters are validated through `analytics-guard.js` before:
- Sending to GA4
- Using in matrix adjustments
- Storing in analytics data

## Audit Trail

All analytics events and analytics-to-matrix connections are logged to `audit-log.json` for:
- Legal compliance
- Ethical review
- Investor transparency
- Regulatory audit

## Questions?

If you have questions about our analytics practices, please contact us through our support channels.

