#!/bin/bash

##############################################################################
# Pre-Commit Hook for Secret Detection
#
# Prevents accidental commits of sensitive data including:
# - Passwords, API keys, tokens
# - .env files
# - Private keys
# - Hardcoded credentials
#
# Installation:
#   ln -sf ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
##############################################################################

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Configuration
SECRETS_FILE=".secrets-baseline"
FAIL_ON_SECRETS=true

echo -e "${GREEN}🔍 Running pre-commit secret detection...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${YELLOW}No files staged for commit${NC}"
    exit 0
fi

# Patterns to detect secrets
declare -a SECRET_PATTERNS=(
    "password\s*=\s*['\"][^'\"]+['\"]"
    "api[_-]?key\s*=\s*['\"][^'\"]+['\"]"
    "secret\s*=\s*['\"][^'\"]+['\"]"
    "token\s*=\s*['\"][^'\"]+['\"]"
    "access[_-]?key\s*=\s*['\"][^'\"]+['\"]"
    "private[_-]?key"
    "-----BEGIN.*PRIVATE KEY-----"
    "eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*"  # JWT
    "[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"  # Credit card-like
    "AKIA[0-9A-Z]{16}"  # AWS Access Key
)

# Files that should never be committed
declare -a BLOCKED_FILES=(
    "^\.env$"
    "^\.env\.local$"
    "^\.env\..*\.local$"
    ".*\.pem$"
    ".*\.key$"
    "^credentials\.json$"
    "^secrets\..*"
)

SECRETS_FOUND=false
BLOCKED_FOUND=false

# Check for blocked files
echo "Checking for blocked files..."
for FILE in $STAGED_FILES; do
    for PATTERN in "${BLOCKED_FILES[@]}"; do
        if echo "$FILE" | grep -qE "$PATTERN"; then
            echo -e "${RED}❌ Blocked file: $FILE${NC}"
            echo -e "${YELLOW}   This file should never be committed${NC}"
            BLOCKED_FOUND=true
        fi
    done
done

# Check staged files for secrets
echo "Scanning staged files for secrets..."
TEMP_FILE=$(mktemp)

for FILE in $STAGED_FILES; do
    # Skip binary files
    if file "$FILE" | grep -q "text"; then
        # Get the staged content
        git show ":$FILE" > "$TEMP_FILE" 2>/dev/null

        # Check each pattern
        for PATTERN in "${SECRET_PATTERNS[@]}"; do
            MATCHES=$(grep -niE "$PATTERN" "$TEMP_FILE" 2>/dev/null)

            if [ -n "$MATCHES" ]; then
                if ! $SECRETS_FOUND; then
                    echo ""
                    echo -e "${RED}⚠️  Potential secrets detected!${NC}"
                    echo ""
                fi

                SECRETS_FOUND=true
                echo -e "${RED}File: $FILE${NC}"
                echo "$MATCHES" | while read -r line; do
                    LINE_NUM=$(echo "$line" | cut -d: -f1)
                    CONTENT=$(echo "$line" | cut -d: -f2-)
                    # Redact the actual secret value
                    REDACTED=$(echo "$CONTENT" | sed 's/=.*/=***REDACTED***/g')
                    echo -e "${YELLOW}  Line $LINE_NUM: $REDACTED${NC}"
                done
                echo ""
            fi
        done
    fi
done

rm -f "$TEMP_FILE"

# Check for common mistake patterns
echo "Checking for common mistakes..."
for FILE in $STAGED_FILES; do
    if [[ "$FILE" == *.js || "$FILE" == *.ts ]]; then
        # Check for console.log with passwords
        if git show ":$FILE" | grep -qiE "console\.log.*password"; then
            echo -e "${YELLOW}⚠️  Warning: console.log with password in $FILE${NC}"
        fi

        # Check for hardcoded localhost credentials
        if git show ":$FILE" | grep -qE "password.*:\s*['\"]admin['\"]"; then
            echo -e "${YELLOW}⚠️  Warning: Hardcoded admin password in $FILE${NC}"
        fi
    fi
done

# Final decision
if $BLOCKED_FOUND; then
    echo ""
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo -e "${RED}COMMIT BLOCKED: Attempting to commit blocked files${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo "The following files should NEVER be committed:"
    echo "  - .env files (use .env.example instead)"
    echo "  - Private keys (.pem, .key files)"
    echo "  - Credentials files"
    echo ""
    echo "To fix:"
    echo "  1. Remove these files from staging: git reset HEAD <file>"
    echo "  2. Add to .gitignore if needed"
    echo ""
    exit 1
fi

if $SECRETS_FOUND; then
    if $FAIL_ON_SECRETS; then
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
        echo -e "${RED}COMMIT BLOCKED: Potential secrets detected${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
        echo ""
        echo "To fix:"
        echo "  1. Remove hardcoded secrets from your code"
        echo "  2. Use environment variables instead"
        echo "  3. Add secrets to .env file (which is gitignored)"
        echo "  4. Use GitHub Secrets for CI/CD"
        echo ""
        echo "If this is a false positive:"
        echo "  1. Review the detected patterns above"
        echo "  2. Use a different pattern that doesn't match"
        echo "  3. Or bypass with: git commit --no-verify (not recommended)"
        echo ""
        exit 1
    else
        echo -e "${YELLOW}Warning: Potential secrets detected but allowing commit${NC}"
    fi
fi

echo -e "${GREEN}✅ Secret detection passed${NC}"
exit 0
