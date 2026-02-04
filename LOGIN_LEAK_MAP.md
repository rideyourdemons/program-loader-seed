# LOGIN LEAK PATH MAP

## Source of "Login" Text
- **Field**: `tool.description` in `public/data/tools-canonical.json`
- **Pattern**: `"Login\r\n\r\n\r\n\r\n{Tool Title}\r\nTool  Gate: {Gate Name}"`
- **Example**: `"Login\r\n\r\n\r\n\r\n100-Year Vision\r\nTool  Gate: Men's Mental Health"`

## Render Paths

### Route: `/tools` (Tool List Page)
- **File**: `public/js/ryd-tools.js`
- **Function**: `renderTools()`
- **Line**: 40-41
- **DOM Element**: `desc.textContent`
- **Source Field**: `tool.description || tool.summary`
- **Sanitization**: ✅ Uses `sanitizeDescription()`
- **Status**: FIXED

### Route: `/tools/tool.html` (Tool Detail Page)
- **File**: `public/tools/tool.html`
- **Function**: Inline script `extractDescription()`
- **Line**: 222-229
- **DOM Element**: `p.textContent`
- **Source Field**: `tool.description || tool.summary`
- **Sanitization**: ✅ Uses `window.RYD_UI.sanitizeDescription()`
- **Status**: FIXED

### Route: `/` (Homepage - Tool of the Day)
- **File**: `public/js/ryd-bind.js`
- **Function**: `renderToolOfDay()`
- **Line**: 59-62
- **DOM Element**: `descEl.textContent`
- **Source Field**: `tool.description || tool.summary`
- **Sanitization**: ✅ Uses `sanitizeDescription()`
- **Status**: FIXED

### Route: `/gates/:gateId/:painPointId` (Pain Point Page)
- **File**: `public/js/gates-renderer.js`
- **Function**: `renderTools()`
- **Line**: 243-250, 275-280
- **DOM Element**: `toolDesc.textContent`
- **Source Field**: `tool.description || tool.summary`
- **Sanitization**: ✅ Uses `extractDescription()` which calls `window.RYD_UI.sanitizeDescription()`
- **Status**: FIXED

### Route: `/search` (Search Results)
- **File**: `public/js/ryd-router.js`
- **Function**: `renderTool()`
- **Line**: 421
- **DOM Element**: `p.textContent`
- **Source Field**: `tool.description || tool.summary`
- **Sanitization**: ✅ Uses `sanitizeDescription()`
- **Status**: FIXED

### Route: `/insights` (Insights Page)
- **File**: `public/js/ryd-bind.js`
- **Function**: `hydrateInsights()`
- **Line**: 223
- **DOM Element**: `link.textContent`
- **Source Field**: `tool.title || tool.id`
- **Sanitization**: N/A (title only, no description rendered)
- **Status**: OK

## Issue Analysis
All render paths already use sanitization. The test script is checking raw JSON data, not rendered output. However, we should:
1. Add tripwires to detect leaks in rendered DOM
2. Enhance sanitization to handle the specific "Login\r\n\r\n..." pattern
3. Add console warnings when leaks are detected
