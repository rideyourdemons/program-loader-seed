# Sandbox Testing & Approval System

## Overview

All code changes are **tested in sandbox first**, then require **your approval** before implementation. This ensures safety and quality.

## Workflow

```
1. Change Requested
   ↓
2. Sandbox Testing
   ↓
3. Approval Request Generated
   ↓
4. You Review & Approve/Reject
   ↓
5. Implementation (if approved)
```

## How It Works

### 1. Sandbox Testing

When you request a code change:
- Code is tested in isolated sandbox environment
- Syntax validation performed
- Language-specific checks run
- Issues detected and reported

### 2. Approval Request

After sandbox testing:
- Approval request generated with full details
- Report created showing:
  - What changed
  - Test results
  - Potential issues
  - Comparison (added/removed/modified lines)

### 3. Review & Approve

You review the approval request:
- See what will change
- Review test results
- Check for issues
- Approve or reject

### 4. Implementation

If approved:
- Change is implemented
- Full audit trail maintained
- All operations logged

## Usage

### Making Changes

```javascript
import navigationController from './core/navigation-controller.js';

// Request a change
const result = await navigationController.writeCode(
  sessionId,
  '/path/to/file.js',
  newCodeContent,
  'auto', // method
  'Fix bug in authentication', // reason
  false // don't skip sandbox
);

// Result will be:
// {
//   status: 'pending_approval',
//   approvalId: 'approval_1234567890_abc',
//   testResults: {...},
//   reportPath: 'logs/approvals/approval_1234567890_abc_report.txt'
// }
```

### Reviewing Approvals

```bash
# List all pending approvals
npm run approve-change

# Review specific approval
npm run approve-change --approve <approvalId>

# Reject approval
npm run approve-change --reject <approvalId> "Reason for rejection"
```

### Implementing Approved Changes

```bash
npm run implement-change <approvalId> <sessionId>
```

## Approval Report Contents

Each approval request includes:

- **File Information**: Path, sizes, timestamps
- **Reason**: Why the change is needed
- **Test Results**: Syntax validation, issues found
- **Change Summary**: Lines added/removed/modified
- **Preview**: Sample of changes
- **Issues**: Any warnings or errors

## Sandbox Testing

### What Gets Tested

1. **Syntax Validation**
   - JavaScript/TypeScript: Node.js syntax check
   - Python: py_compile check
   - JSON: JSON.parse validation
   - Other: Basic file validation

2. **Code Quality**
   - File size checks
   - Line count validation
   - Encoding validation

3. **Issue Detection**
   - Large files (>1MB warning)
   - Many lines (>10,000 warning)
   - Other quality issues

### Test Results

```javascript
{
  overallStatus: 'pass' | 'fail',
  syntaxTest: {
    valid: true/false,
    errors: [...],
    warnings: [...]
  },
  validations: {
    fileSize: 1234,
    lineCount: 56,
    hasContent: true,
    encodingValid: true
  },
  issues: [...]
}
```

## Approval States

- **pending**: Awaiting your review
- **approved**: Ready for implementation
- **rejected**: Not approved, won't be implemented

## Files Location

- **Approval Requests**: `logs/approvals/approval_ID.json`
- **Approval Reports**: `logs/approvals/approval_ID_report.txt`
- **Sandbox Files**: `sandbox/`

## Safety Features

1. **Sandbox Isolation**: Changes tested separately
2. **No Auto-Implementation**: Requires explicit approval
3. **Full Audit Trail**: Every step logged
4. **Rollback Info**: Original content preserved
5. **Test Validation**: Syntax checked before approval

## Example Workflow

```bash
# 1. Make a change request (via code)
# System tests in sandbox and creates approval request

# 2. Review pending approvals
npm run approve-change

# 3. Review the report
# System shows detailed report

# 4. Approve
npm run approve-change --approve approval_1234567890_abc

# 5. Implement
npm run implement-change approval_1234567890_abc session_xyz
```

## Best Practices

1. **Always Review**: Check approval reports before approving
2. **Test Results**: Review sandbox test results
3. **Change Preview**: Check what will change
4. **Reason Check**: Verify the reason makes sense
5. **Session Active**: Ensure session is active before implementation

## Troubleshooting

### Sandbox Test Fails
- Check syntax errors in test results
- Fix code issues
- Resubmit change request

### Approval Not Found
- Check approval ID is correct
- Verify approval file exists in `logs/approvals/`

### Implementation Fails
- Ensure session is active
- Check file path is correct
- Verify approval status is 'approved'

---

**Remember**: All changes are sandboxed and require your approval before implementation!

