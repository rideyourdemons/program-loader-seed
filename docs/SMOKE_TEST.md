# Smoke Test Workflow

Quick local validation workflow for the RYD platform.

## Quick Start

### Start Dev Server & Open Browser
```bash
npm run smoke:dev
```
Starts the dev server on `http://localhost:3000` and opens `/insights` in your browser.

### Run Full Smoke Test
```bash
npm run smoke
```
Runs lint/typecheck (if configured) and validates all critical endpoints and routes.

### Individual Commands
```bash
npm run smoke:checks  # Run lint/typecheck only
npm run smoke:run     # Run endpoint/route validation only
```

## What Gets Tested

### JSON Endpoints
- `/data/gates.json`
- `/data/pain-points.json`
- `/data/tools.json`
- `/data/tools-canonical.json`
- `/data/insights.json`

### Routes
- `/` (homepage)
- `/insights`
- `/tools`
- `/gates`

## Test Modes

### HTTP Mode (Default)
- Validates JSON endpoints return 200 and parse correctly
- Validates routes return 200 with sufficient content
- No browser automation required

### Browser Mode (If Puppeteer Available)
- Same as HTTP mode, plus:
- Captures console errors
- Validates network requests for critical JSON
- Fails if any console errors or network failures occur

## Configuration

### Environment Variables
```bash
BASE_URL=http://localhost:3000  # Override base URL
TARGET_PATH=/insights            # Override default page to open
PORT=3000                        # Override server port
```

### Example
```bash
BASE_URL=http://localhost:5173 npm run smoke:dev
```

## Output

### Pass Example
```
✅ PASS: 9
✅ Smoke test passed
```

### Fail Example
```
✅ PASS: 6
❌ FAIL: 3

Failures:
  - http://localhost:3000/data/gates.json: HTTP 404
  - http://localhost:3000/tools: Request timeout
```

## Integration

The smoke test is automatically run as part of:
- `npm run predeploy` (before deployment)
- `npm run audit:all` (full audit)

## Troubleshooting

### Server Not Starting
- Ensure port 3000 is available
- Check for existing Node processes: `netstat -ano | findstr :3000`
- Kill existing process or use different port: `PORT=5173 npm run smoke:dev`

### JSON Endpoints Failing
- Run `npm run build` to generate required JSON files
- Check that files exist in `public/data/`

### Browser Automation Not Working
- Falls back to HTTP mode automatically
- Install Puppeteer if needed: `npm install puppeteer`

## Related Commands

- `npm run dev` - Start dev server only
- `npm run build` - Build required assets
- `npm run validate` - Run content validation
- `npm run audit:all` - Full production audit
