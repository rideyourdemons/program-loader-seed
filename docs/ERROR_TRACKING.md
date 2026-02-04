# Error Tracking System

## Overview

The Error Tracking System comprehensively logs all errors encountered during execution, saves them with full context, and provides solutions to help achieve the objective.

## Features

### 1. Comprehensive Error Logging
- Records all errors with full context (command, operation, module, function, etc.)
- Captures stack traces, error codes, and execution state
- Tracks errors per execution session

### 2. Error Storage
- Saves errors to `logs/errors/` directory
- Creates session-specific error log files (JSONL format)
- Maintains a `latest-errors.jsonl` file for quick access
- Generates comprehensive error reports (JSON and HTML formats)

### 3. Solution Generation
The system automatically analyzes errors and generates solutions based on:
- **Pattern Matching**: Recognizes common error patterns (file not found, permission denied, connection errors, etc.)
- **Learning Memory**: Uses previously successful solutions from past executions
- **Context Analysis**: Considers execution context (module, operation, command) to suggest relevant fixes

### 4. Error Categories
The system recognizes and provides solutions for:
- File System Errors (not found, permission denied)
- Network Errors (connection, timeout)
- Module/Package Errors (missing dependencies)
- Syntax Errors (code parsing issues)
- Authentication Errors (Firebase, website)
- Command Execution Errors
- Memory Errors
- And more...

## Usage

### Automatic Error Tracking

The error tracker is automatically integrated into:
- **Command Executor** (`core/command-executor.js`)
- **Local Executor** (`core/local-executor.js`)
- **Main Scripts** (`scripts/complete-system.js`, `scripts/execute-objective.js`, `scripts/boot.js`)
- **Global Error Handlers** (uncaught exceptions, unhandled promise rejections)

### Manual Error Recording

```javascript
import errorTracker from "./core/error-tracker.js";

try {
  // Your code
} catch (error) {
  errorTracker.recordError(error, {
    command: 'your-command',
    operation: 'your-operation',
    module: 'your-module',
    function: 'your-function'
  });
}
```

### Viewing Errors

Use the `view-errors.js` script to see current session errors and solutions:

```bash
node scripts/view-errors.js
```

### Accessing Error Reports

Error reports are saved in `logs/errors/`:
- `errors_<session-id>.json` - Session-specific error log
- `error-report_<timestamp>.json` - Comprehensive error report (JSON)
- `error-report_<timestamp>.html` - Comprehensive error report (HTML)
- `latest-errors.jsonl` - Latest errors for quick access

### Error Report Format

```json
{
  "sessionId": "session_...",
  "startTime": "2025-01-01T00:00:00.000Z",
  "endTime": "2025-01-01T01:00:00.000Z",
  "duration": "3600.00s",
  "statistics": {
    "total": 5,
    "resolved": 2,
    "unresolved": 3,
    "byType": { "Error": 5 },
    "byContext": { "executeCommand": 3 }
  },
  "errors": [
    {
      "id": "err_...",
      "timestamp": "2025-01-01T00:30:00.000Z",
      "message": "Error message",
      "stack": "Stack trace",
      "name": "Error",
      "context": {
        "command": "...",
        "operation": "...",
        "module": "..."
      },
      "suggestedSolutions": [
        {
          "type": "file_not_found",
          "description": "...",
          "solution": "...",
          "commands": ["..."],
          "priority": "high"
        }
      ],
      "resolved": false
    }
  ],
  "unresolvedErrors": [...],
  "solutions": {
    "totalSolutions": 10,
    "byPriority": { "high": 3, "medium": 5, "low": 2 },
    "commonSolutions": [...]
  }
}
```

## Solution Priorities

- **High**: Critical errors that prevent execution (file not found, permission denied, authentication)
- **Medium**: Errors that may cause issues but don't prevent execution (timeouts, connection errors)
- **Low**: Minor issues or warnings (deprecations, non-critical errors)

## Integration Points

### Global Error Handlers

The system sets up global error handlers that automatically catch:
- Uncaught exceptions
- Unhandled promise rejections
- Process warnings

These are initialized via `setupGlobalErrorHandlers()` in `core/error-handler.js`.

### Command Execution

All command executions are automatically tracked. Errors include:
- Command that failed
- Execution context (cwd, environment)
- Exit code
- Standard output/error

### File Operations

File read/write errors are tracked with:
- File path
- Operation type
- Error details

## Learning from Errors

The system learns from errors by:
1. Saving error patterns to learning memory
2. Recording successful solutions when errors are resolved
3. Reusing solutions for similar errors in the future

## Best Practices

1. **Always include context** when manually recording errors
2. **Review error reports** after execution to identify patterns
3. **Mark errors as resolved** when solutions are successfully applied
4. **Use suggested solutions** as starting points for fixing issues

## Example Workflow

1. Execute a command that fails
2. Error is automatically recorded with context
3. System analyzes error and generates solutions
4. Solutions are displayed to the user
5. User applies a solution
6. If successful, error is marked as resolved
7. Solution is saved to learning memory for future use

## API Reference

### ErrorTracker Methods

- `recordError(error, context)` - Record an error with context
- `getErrors()` - Get all errors for current session
- `getUnresolvedErrors()` - Get unresolved errors
- `getStats()` - Get error statistics
- `markResolved(errorId, resolution)` - Mark an error as resolved
- `generateReport()` - Generate error report
- `saveReport(format)` - Save report to file (json/html)
- `wrapAsync(fn, context)` - Wrap async function with error tracking
- `wrapSync(fn, context)` - Wrap sync function with error tracking

## Files

- `core/error-tracker.js` - Main error tracking module
- `core/error-handler.js` - Global error handler setup
- `scripts/view-errors.js` - Utility to view errors
- `logs/errors/` - Error log storage directory
