import os
import re
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# --- CONFIGURATION ---
# Add keywords that represent your "Secret Sauce" or proprietary logic
SECRET_KEYWORDS = ['proprietary_algo', 'internal_ip', 'dev_backdoor']
# File extensions to scan
EXTENSIONS = ('.js', '.ts', '.py', '.jsx', '.tsx', '.env', '.json')
# Directories to skip
IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '_archive']

def check_for_secrets():
    # Regex for common API keys/Secrets (exclude cacheKey, dataKey, etc.)
    secret_pattern = re.compile(r'(api[_-]?key|secret|password|auth[_-]?token|private[_-]?key|access[_-]?token) *= *[\'"][a-zA-Z0-9_\-]{10,}[\'"]', re.IGNORECASE)
    
    issues_found = 0
    print("Starting Pre-Flight Sanitization...\n")

    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file.endswith(EXTENSIONS):
                path = os.path.join(root, file)
                with open(path, 'r', errors='ignore') as f:
                    content = f.read()
                    
                    # 1. Check for hardcoded API keys
                    if secret_pattern.search(content):
                        print(f"WARNING: POTENTIAL SECRET FOUND: {path}")
                        issues_found += 1
                    
                    # 2. Check for 'console.log' or print statements (skip for now - too many false positives)
                    # if 'console.log(' in content or 'print(' in content:
                    #     if not file == 'preflight.py': # Don't flag itself
                    #         print(f"DEBUG LOGS DETECTED: {path}")
                    
                    # 3. Check for Secret Sauce keywords (skip preflight.py itself)
                    if file != 'preflight.py':
                        for word in SECRET_KEYWORDS:
                            if word in content:
                                print(f"PROPRIETARY LOGIC EXPOSED: {path} (Found '{word}')")
                                issues_found += 1

    print(f"\n--- Scan Complete ---")
    if issues_found > 0:
        print(f"FAILED: {issues_found} critical issues to fix before Sandbox.")
    else:
        print("SUCCESS: Code looks clean. Ready for Sandbox deployment.")

if __name__ == "__main__":
    check_for_secrets()
