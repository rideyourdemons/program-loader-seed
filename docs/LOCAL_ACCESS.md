# Local Computer Access

## Overview

The system can now access your local computer to:
- Execute commands
- Read/write files
- Access file system
- All operations are logged and secured

## Security Features

- ✅ **Command Safety Checks**: Dangerous commands blocked
- ✅ **Approval Required**: File writes require authorization
- ✅ **Sandbox Testing**: Code files tested before writing
- ✅ **Full Logging**: All operations logged
- ✅ **Execution History**: Track all commands

## Usage

### Interactive CLI

```bash
npm run local-access
```

This provides an interactive interface for:
- Executing commands
- Reading files
- Writing files (with approval)
- Listing directories
- Viewing execution history

### Programmatic Usage

```javascript
import navigationController from './core/navigation-controller.js';

// Execute command
const result = await navigationController.executeLocalCommand('npm list');

// Read local file
const content = await navigationController.readLocalFile('./package.json');

// Write local file (requires approval)
const result = await navigationController.writeLocalFile(
  './test.js',
  'console.log("test");',
  'Create test file'
);

// List directory
const items = await navigationController.listLocalDirectory('./src');
```

## Command Safety

### Safe Commands (Auto-allowed)
- `ls`, `dir`, `pwd`, `cd`
- `cat`, `type`, `echo`
- `git`, `npm`, `node`
- Most read-only operations

### Dangerous Commands (Require Approval)
- `rm`, `del`, `delete`
- `format`, `shutdown`, `reboot`
- `sudo`, `su`
- File deletion operations

## File Operations

### Reading Files
- ✅ Always allowed (read-only)
- ✅ Fully logged
- ✅ No approval needed

### Writing Files
- ⚠️ Requires authorization
- ✅ Code files tested in sandbox
- ✅ Approval required for code changes
- ✅ Non-code files can be written if authorized

## Examples

### Execute Command
```bash
npm run local-access
# Choose option 1
# Enter: npm list
```

### Read File
```bash
npm run local-access
# Choose option 2
# Enter: ./package.json
```

### Write File
```bash
npm run local-access
# Choose option 3
# Enter file path and content
# System will test in sandbox and request approval
```

## Authorization

For dangerous operations or file writes:

```bash
npm run local-access
# Choose option 6
# Enter authorization token
```

Or programmatically:
```javascript
import readOnlyMode from './core/readonly-mode.js';
readOnlyMode.authorize('your-token');
```

## Execution History

All commands are logged:
- Command executed
- Exit code
- Output (stdout/stderr)
- Duration
- Timestamp

View history:
```bash
npm run local-access
# Choose option 5
```

## Security Notes

1. **Dangerous commands blocked by default**
2. **File writes require authorization**
3. **Code files tested in sandbox**
4. **All operations fully logged**
5. **Execution history maintained**

## Integration with Audit System

All local operations are integrated with:
- ✅ Audit system (full logging)
- ✅ Sandbox testing (for code files)
- ✅ Approval system (for changes)
- ✅ Read-only mode (write protection)

---

**Local access is ready!** Use `npm run local-access` to get started.

