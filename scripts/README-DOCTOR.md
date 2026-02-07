# RYD Insights Doctor Tool

## Purpose
Automated diagnostic tool that identifies and fixes `/insights` 500 errors across all server types (Vite, Express, static, Firebase).

## Usage

```bash
npm run doctor:insights
```

Or with custom URL:
```bash
DOCTOR_URL=http://localhost:3000 node scripts/doctor-insights.mjs
```

## What It Checks

1. **Server Detection**: Identifies which server type is configured (Vite, Express, static, Firebase)
2. **File Validation**: Verifies required files exist:
   - `public/insights.html`
   - `public/index.html`
   - `public/tools.html`
3. **HTTP Testing**: Tests endpoints:
   - `/` (home)
   - `/tools`
   - `/insights`
4. **Diagnosis**: Provides root cause analysis and recommended fixes

## Fixes Applied

### Static Server (`scripts/serve-public.cjs`)
- Added route mapping for `/insights` → `insights.html`
- Added route mapping for `/tools` → `tools.html`
- Added SPA fallback to `index.html` for routes without file extensions
- Enhanced error logging for 500 errors

### Express Server (`server.cjs`)
- Added explicit route handlers for `/insights`, `/tools`, `/search`
- Added SPA fallback route (`app.get('*')`) for client-side routing
- Added error handling middleware with detailed logging

### Firebase (`firebase.json`)
- Already configured with correct rewrites (no changes needed)

## Error Logging

All servers now log detailed error information:
- `[SERVER ERROR]` prefix for easy filtering
- Full file paths and request URLs
- Error stack traces for 500 errors

## Notes

- The doctor tool does NOT start/kill servers automatically
- Ensure your server is running before running the doctor tool
- The tool tests against `http://localhost:5173` by default (or `DOCTOR_URL` env var)
