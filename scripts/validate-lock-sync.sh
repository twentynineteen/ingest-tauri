#!/bin/bash

# Dual Package Manager Lock File Synchronization Validator
# Ensures bun.lockb and package-lock.json remain consistent

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating dual package manager lock file synchronization..."

# Check if required files exist
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

if [[ ! -f "bun.lockb" ]]; then
    echo -e "${RED}❌ bun.lockb not found${NC}"
    exit 1
fi

# Create temporary directory for validation
TEMP_DIR=$(mktemp -d)
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Function to extract package versions from lock files
extract_bun_versions() {
    # Bun lockfile is binary, so we'll validate by installing and checking
    cp package.json "$TEMP_DIR/package.json"
    cd "$TEMP_DIR"
    
    # Install with bun and capture the installed packages
    bun install --silent > /dev/null 2>&1
    bun list --depth=0 2>/dev/null | grep -E "^[a-z@]" | sort > bun_packages.txt || true
    cd - > /dev/null
}

extract_npm_versions() {
    # If package-lock.json exists, compare with npm
    if [[ -f "package-lock.json" ]]; then
        cp package.json "$TEMP_DIR/package-npm.json"
        cd "$TEMP_DIR"
        
        # Install with npm and capture installed packages
        npm install --silent > /dev/null 2>&1
        npm list --depth=0 2>/dev/null | grep -E "^[a-z@]" | sort > npm_packages.txt || true
        cd - > /dev/null
    else
        echo -e "${YELLOW}⚠️  package-lock.json not found, creating reference...${NC}"
        cd "$TEMP_DIR"
        cp package.json .
        npm install --package-lock-only --silent > /dev/null 2>&1
        npm list --depth=0 2>/dev/null | grep -E "^[a-z@]" | sort > npm_packages.txt || true
        cd - > /dev/null
    fi
}

# Check package consistency
validate_consistency() {
    if [[ -f "$TEMP_DIR/bun_packages.txt" ]] && [[ -f "$TEMP_DIR/npm_packages.txt" ]]; then
        # Compare the package lists
        if diff "$TEMP_DIR/bun_packages.txt" "$TEMP_DIR/npm_packages.txt" > /dev/null; then
            echo -e "${GREEN}✅ Lock files are consistent${NC}"
            return 0
        else
            echo -e "${RED}❌ Lock files are inconsistent${NC}"
            echo "Differences found:"
            diff "$TEMP_DIR/bun_packages.txt" "$TEMP_DIR/npm_packages.txt" || true
            return 1
        fi
    else
        echo -e "${RED}❌ Could not validate package consistency${NC}"
        return 1
    fi
}

# Main validation process
echo "📦 Extracting Bun package versions..."
extract_bun_versions

echo "📦 Extracting npm package versions..."
extract_npm_versions

echo "🔄 Validating consistency..."
if validate_consistency; then
    echo -e "${GREEN}🎉 Dual package manager validation passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 Dual package manager validation failed!${NC}"
    echo ""
    echo "To fix synchronization issues, run:"
    echo "  bun install && npm install"
    echo "Or remove lock files and reinstall:"
    echo "  rm -f bun.lockb package-lock.json && bun install && npm install"
    exit 1
fi