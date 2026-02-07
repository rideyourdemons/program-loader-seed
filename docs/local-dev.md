# Local Development Guide

## Quick Start

**One command to start and open:**
```bash
npm run dev:open
```

This will:
1. Automatically find an available port (prefers 5173, then 3000, then next free)
2. Start the local static file server
3. Wait for the server to be ready
4. Open your default browser to the server URL

**Test routes:**
```bash
npm run dev:doctor
```

This tests `/`, `/tools`, and `/insights` and reports PASS/FAIL.

## Server Details

**Canonical Dev Mode:** Static file server (`scripts/serve-public.cjs`)

The local dev server:
- Serves files from the `/public` directory
- Supports SPA routing (all routes fall back to `index.html`)
- Handles `/insights`, `/tools`, and other client routes correctly
- Never returns 500 errors for valid routes

## Available Commands

- `npm run dev:open` - Start server and open browser
- `npm run dev:doctor` - Test all routes
- `npm run dev:clean` - Kill port conflicts and start server
- `npm run serve:local` - Start server manually (port 5173)
- `npm run local` - Start server with auto port selection

## Port Selection

The dev server automatically selects an available port:
1. First tries: 5173
2. Then tries: 3000
3. Then finds next available port (3001, 3002, etc.)

You can override by setting `PORT` environment variable:
```bash
PORT=8080 npm run dev:open
```

## Troubleshooting

**Port already in use:**
- Run `npm run dev:clean` to kill processes on common ports
- Or manually kill the process using the port

**Routes returning 500:**
- Ensure `public/index.html` exists (required for SPA routing)
- Check server logs for specific errors
- Run `npm run dev:doctor` to diagnose

**Browser doesn't open:**
- The URL will be printed in the console
- Open it manually in your browser
