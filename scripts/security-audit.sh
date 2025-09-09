#!/bin/bash

# Security Audit Reporting Tool
# Comprehensive security vulnerability scanning for dual package manager setup

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OUTPUT_DIR="./security-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$OUTPUT_DIR/security-audit-$TIMESTAMP.json"
SUMMARY_FILE="$OUTPUT_DIR/security-summary-$TIMESTAMP.md"

echo -e "${BLUE}🔒 Starting comprehensive security audit...${NC}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to run npm audit
run_npm_audit() {
    echo "🔍 Running npm security audit..."
    local npm_result=0
    
    # Run npm audit and capture both JSON and human-readable output
    if npm audit --json > "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null; then
        npm_result=0
    else
        npm_result=$?
    fi
    
    # Get human-readable summary
    npm audit > "$OUTPUT_DIR/npm-audit-summary-$TIMESTAMP.txt" 2>/dev/null || true
    
    return $npm_result
}

# Function to run bun audit (if available)
run_bun_audit() {
    echo "🔍 Attempting bun security audit..."
    local bun_result=0
    
    # Bun audit might not be available yet, so handle gracefully
    if command -v bun >/dev/null 2>&1; then
        if bun audit --json > "$OUTPUT_DIR/bun-audit-$TIMESTAMP.json" 2>/dev/null; then
            bun_result=0
            echo "✅ Bun audit completed successfully"
        else
            bun_result=$?
            echo -e "${YELLOW}⚠️  Bun audit not available or failed${NC}"
            echo "{\"vulnerabilities\": [], \"metadata\": {\"note\": \"Bun audit not available\"}}" > "$OUTPUT_DIR/bun-audit-$TIMESTAMP.json"
        fi
    else
        echo -e "${YELLOW}⚠️  Bun not installed${NC}"
        echo "{\"vulnerabilities\": [], \"metadata\": {\"note\": \"Bun not installed\"}}" > "$OUTPUT_DIR/bun-audit-$TIMESTAMP.json"
        bun_result=0
    fi
    
    return $bun_result
}

# Function to analyze outdated packages
analyze_outdated_packages() {
    echo "📊 Analyzing outdated packages..."
    
    # Check with npm
    npm outdated --json > "$OUTPUT_DIR/npm-outdated-$TIMESTAMP.json" 2>/dev/null || echo "{}" > "$OUTPUT_DIR/npm-outdated-$TIMESTAMP.json"
    
    # Check with bun if available
    if command -v bun >/dev/null 2>&1; then
        bun outdated > "$OUTPUT_DIR/bun-outdated-$TIMESTAMP.txt" 2>/dev/null || echo "No outdated packages or bun outdated not available" > "$OUTPUT_DIR/bun-outdated-$TIMESTAMP.txt"
    fi
}

# Function to check for unused dependencies
check_unused_dependencies() {
    echo "🧹 Checking for unused dependencies..."
    
    if command -v depcheck >/dev/null 2>&1; then
        depcheck --json > "$OUTPUT_DIR/depcheck-$TIMESTAMP.json" 2>/dev/null || echo "{\"dependencies\": [], \"devDependencies\": []}" > "$OUTPUT_DIR/depcheck-$TIMESTAMP.json"
    else
        echo -e "${YELLOW}⚠️  depcheck not installed${NC}"
        echo "{\"dependencies\": [], \"devDependencies\": [], \"note\": \"depcheck not available\"}" > "$OUTPUT_DIR/depcheck-$TIMESTAMP.json"
    fi
}

# Function to generate summary report
generate_summary() {
    echo "📋 Generating security summary report..."
    
    local npm_vulns=0
    local critical_vulns=0
    local high_vulns=0
    local moderate_vulns=0
    local low_vulns=0
    
    # Parse npm audit results
    if [[ -f "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" ]]; then
        # Extract vulnerability counts using node (more reliable than complex jq)
        npm_vulns=$(node -e "
            try {
                const data = require('./$OUTPUT_DIR/npm-audit-$TIMESTAMP.json');
                if (data.metadata && data.metadata.vulnerabilities) {
                    const v = data.metadata.vulnerabilities;
                    console.log(v.critical + v.high + v.moderate + v.low);
                } else {
                    console.log(0);
                }
            } catch (e) {
                console.log(0);
            }
        " 2>/dev/null || echo "0")
    fi
    
    # Create markdown summary
    cat > "$SUMMARY_FILE" << EOF
# Security Audit Summary

**Date**: $(date)
**Audit ID**: $TIMESTAMP

## 🔒 Vulnerability Summary

- **Total Vulnerabilities**: $npm_vulns
- **Package Manager**: npm + bun (dual setup)

## 📊 Audit Results

### npm Audit
$(if [[ -f "$OUTPUT_DIR/npm-audit-summary-$TIMESTAMP.txt" ]]; then
    head -20 "$OUTPUT_DIR/npm-audit-summary-$TIMESTAMP.txt"
else
    echo "No npm audit results available"
fi)

### Outdated Packages
$(if [[ -f "$OUTPUT_DIR/npm-outdated-$TIMESTAMP.json" ]]; then
    echo "See detailed JSON report: npm-outdated-$TIMESTAMP.json"
else
    echo "No outdated package information available"
fi)

### Unused Dependencies
$(if [[ -f "$OUTPUT_DIR/depcheck-$TIMESTAMP.json" ]]; then
    echo "See detailed JSON report: depcheck-$TIMESTAMP.json"
else
    echo "No unused dependency information available"
fi)

## 📁 Report Files

- **Detailed npm audit**: \`npm-audit-$TIMESTAMP.json\`
- **Bun audit**: \`bun-audit-$TIMESTAMP.json\`
- **Outdated packages**: \`npm-outdated-$TIMESTAMP.json\`
- **Unused dependencies**: \`depcheck-$TIMESTAMP.json\`

## 🚨 Next Steps

$(if [[ $npm_vulns -gt 0 ]]; then
    echo "1. Review vulnerability details in the JSON reports"
    echo "2. Run \`npm audit fix\` to attempt automatic fixes"
    echo "3. Manually update packages with breaking changes"
    echo "4. Re-run this audit to verify fixes"
else
    echo "✅ No known vulnerabilities found!"
    echo "1. Consider updating outdated packages"
    echo "2. Remove unused dependencies to reduce attack surface"
fi)

EOF

    echo "📄 Summary report saved to: $SUMMARY_FILE"
}

# Main execution
echo "🏁 Starting security audit process..."

# Run all audit checks
npm_audit_result=0
run_npm_audit || npm_audit_result=$?

bun_audit_result=0
run_bun_audit || bun_audit_result=$?

analyze_outdated_packages
check_unused_dependencies
generate_summary

# Final status
echo ""
echo -e "${BLUE}📈 Audit Complete!${NC}"
echo "Reports saved to: $OUTPUT_DIR/"
echo "Summary: $SUMMARY_FILE"

# Exit with appropriate code
if [[ $npm_audit_result -ne 0 ]]; then
    echo -e "${RED}❌ Security vulnerabilities found!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No critical security issues detected${NC}"
    exit 0
fi