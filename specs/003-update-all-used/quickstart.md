# Quickstart: Package Updates and Security Resolution

## Prerequisites
- Node.js 18+ installed
- Bun installed (primary package manager)
- npm available (for security auditing)
- Git repository with clean working state

## Quick Validation Test

This quickstart validates the complete dependency update workflow in under 5 minutes.

### Step 1: Initial State Assessment
```bash
# Check current package state
bun install --frozen-lockfile
npm audit --audit-level=moderate
bun run test
bun run build:tauri
```

**Expected**: Existing vulnerabilities detected, tests pass, build succeeds

### Step 2: Dependency Scanning
```bash
# Scan for outdated packages
bun outdated
npm outdated

# Check for unused dependencies  
bunx depcheck
```

**Expected**: List of outdated packages and potentially unused dependencies

### Step 3: Security Audit
```bash
# Run comprehensive security audit
npm audit --json > audit-report.json
bun audit || echo "Bun audit not available, using npm results"
```

**Expected**: JSON report with vulnerability details, severity levels

### Step 4: Jest to Vitest Migration Preparation
```bash
# Verify current test setup
bun run test
cat jest.config.cjs
```

**Expected**: Jest tests pass, configuration file exists

### Step 5: Update Execution (Dry Run)
```bash
# Simulate updates without making changes
bun update --dry-run
npm update --dry-run

# Check what would be removed
bunx depcheck --json
```

**Expected**: Preview of changes without actual modifications

### Step 6: Actual Updates
```bash
# Update dependencies with security fixes first
bun update

# Verify lock file synchronization
bun install
npm install
```

**Expected**: Updated dependencies, synchronized lock files

### Step 7: Vitest Migration
```bash
# Install Vitest alongside Jest temporarily
bun add -D vitest @vitest/ui

# Create Vitest config
cp jest.config.cjs vitest.config.ts
# (Manual edit to convert Jest config to Vitest format)

# Run both test frameworks
bun run test # (Jest)
bun vitest run # (Vitest)
```

**Expected**: Both test frameworks run successfully

### Step 8: Validation
```bash
# Verify application still works
bun run build:tauri
bun run dev:tauri # (Visual check that app starts)

# Run updated test suite
bun run test
```

**Expected**: Build succeeds, application starts, tests pass

### Step 9: Cleanup Unused Dependencies
```bash
# Remove packages identified as unused
# (Manual step based on depcheck results)
bun remove <unused-package-name>

# Final verification
bun run build:tauri
bun run test
```

**Expected**: Build and tests still work after cleanup

## Success Criteria Checklist

After running this quickstart, verify:

- [ ] All security vulnerabilities resolved (npm audit clean)
- [ ] Packages updated to latest compatible versions
- [ ] Unused dependencies removed
- [ ] Both Bun and npm lock files in sync
- [ ] Vitest installed and configured alongside Jest
- [ ] Application builds successfully
- [ ] Test suite passes
- [ ] Development server starts without errors

## Rollback Procedure

If issues occur during quickstart:

```bash
# Restore from git
git checkout -- package.json bun.lockb
git clean -fd # Remove any generated files

# Reinstall original dependencies
bun install --frozen-lockfile

# Verify rollback
bun run test
bun run build:tauri
```

## Expected Duration
- **Total time**: 4-6 minutes (excluding manual config edits)
- **Most time-intensive step**: Building Tauri application (1-2 minutes)
- **Fastest step**: Security audit scanning (10-20 seconds)

## Troubleshooting Quick Fixes

**Lock file conflicts**:
```bash
rm bun.lockb && bun install
```

**Build failures after updates**:
```bash
rm -rf node_modules dist && bun install && bun run build:tauri
```

**Test failures**:
```bash
# Check if Jest config needs updates for new packages
bun run test --verbose
```

This quickstart validates that the dependency update process works correctly and can be completed safely within the existing CI/CD constraints.