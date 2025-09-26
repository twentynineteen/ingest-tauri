#!/usr/bin/env bash

# Jest→Vitest Migration Utility
# Automatically migrates Jest test files to Vitest format
# Part of the testing framework migration initiative

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/.jest-migration-backup"
LOG_FILE="$PROJECT_ROOT/jest-migration.log"

# Migration counters
FILES_MIGRATED=0
FILES_SKIPPED=0
ERRORS_ENCOUNTERED=0

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
    ((ERRORS_ENCOUNTERED++))
}

usage() {
    cat <<EOF
Usage: $0 [OPTIONS] [DIRECTORY]

Jest to Vitest Migration Utility

OPTIONS:
    --dry-run           Show what would be migrated without making changes
    --backup            Create backup before migration (default: true)
    --no-backup         Skip backup creation
    --force             Overwrite existing migrations
    --verbose           Enable verbose logging
    --help              Show this help message

DIRECTORY:
    Target directory to migrate (default: tests/)
    Can be a specific file or directory path

Examples:
    $0                                  # Migrate all tests/ directory
    $0 tests/unit                      # Migrate specific directory
    $0 tests/hooks/useBreadcrumb.test.ts  # Migrate specific file
    $0 --dry-run                       # Preview changes without applying
    $0 --no-backup tests/unit          # Migrate without creating backup

EOF
}

create_backup() {
    if [[ "$CREATE_BACKUP" == "true" ]]; then
        log "Creating migration backup..."
        rm -rf "$BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        
        # Find all test files to backup
        find "$PROJECT_ROOT" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" | while read -r file; do
            rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$file")
            backup_path="$BACKUP_DIR/$rel_path"
            backup_dir=$(dirname "$backup_path")
            mkdir -p "$backup_dir"
            cp "$file" "$backup_path"
        done
        
        # Also backup Jest config if it exists
        if [[ -f "$PROJECT_ROOT/jest.config.js" ]]; then
            cp "$PROJECT_ROOT/jest.config.js" "$BACKUP_DIR/"
        fi
        if [[ -f "$PROJECT_ROOT/jest.config.ts" ]]; then
            cp "$PROJECT_ROOT/jest.config.ts" "$BACKUP_DIR/"
        fi
        
        success "Backup created at $BACKUP_DIR"
    fi
}

migrate_file() {
    local file_path="$1"
    local relative_path
    relative_path=$(realpath --relative-to="$PROJECT_ROOT" "$file_path")
    
    log "Migrating: $relative_path"
    
    # Check if file exists
    if [[ ! -f "$file_path" ]]; then
        error "File not found: $file_path"
        return 1
    fi
    
    # Check if already migrated (contains vitest imports)
    if grep -q "from ['\"]vitest['\"]" "$file_path" 2>/dev/null; then
        warning "Already migrated (contains vitest imports): $relative_path"
        ((FILES_SKIPPED++))
        return 0
    fi
    
    # Skip if force flag not set and file seems already processed
    if [[ "$FORCE_MIGRATION" == "false" ]] && grep -q "vitest" "$file_path" 2>/dev/null; then
        warning "Skipping (appears to contain vitest references): $relative_path"
        ((FILES_SKIPPED++))
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        success "Would migrate: $relative_path"
        ((FILES_MIGRATED++))
        return 0
    fi
    
    # Create temporary file for migration
    local temp_file
    temp_file=$(mktemp)
    
    # Perform migration transformations
    migrate_imports "$file_path" "$temp_file"
    migrate_globals "$temp_file"
    migrate_jest_functions "$temp_file"
    migrate_mocking "$temp_file"
    migrate_matchers "$temp_file"
    migrate_setup_teardown "$temp_file"
    
    # Replace original file
    if mv "$temp_file" "$file_path"; then
        success "Migrated: $relative_path"
        ((FILES_MIGRATED++))
    else
        error "Failed to replace file: $relative_path"
        rm -f "$temp_file"
        return 1
    fi
}

migrate_imports() {
    local input_file="$1"
    local output_file="$2"
    
    # Transform Jest imports to Vitest
    sed -E '
        # Replace Jest imports with Vitest equivalents
        s|import \{([^}]+)\} from ['\''"]@jest/globals['\''"]|import { \1 } from '\''vitest'\''|g
        s|import \{([^}]+)\} from ['\''"]jest['\''"]|import { \1 } from '\''vitest'\''|g
        
        # Handle testing library imports (no change needed, but document)
        # s|from ['\''"]@testing-library/jest-dom['\''"]|from '\''@testing-library/jest-dom/vitest'\''|g
        
        # Add vitest import if test functions are used but no import exists
        /^(describe\||it\||test\||expect\()/!b
        1i\import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from '\''vitest'\''
    ' "$input_file" > "$output_file"
}

migrate_globals() {
    local file_path="$1"
    
    # Note: Vitest provides globals by default with globals: true in config
    # No transformation needed if using globals configuration
    
    # If not using globals, would need to add imports:
    # sed -i 's/^describe(/describe(/g' "$file_path"
    
    # For this project, we assume globals are enabled in vitest.config.ts
    return 0
}

migrate_jest_functions() {
    local file_path="$1"
    
    # Transform Jest-specific function calls to Vitest equivalents
    sed -i -E '
        # Transform jest.fn() to vi.fn()
        s/jest\.fn\(/vi.fn(/g
        
        # Transform jest.mock() to vi.mock()
        s/jest\.mock\(/vi.mock(/g
        
        # Transform jest.spyOn() to vi.spyOn()
        s/jest\.spyOn\(/vi.spyOn(/g
        
        # Transform jest.clearAllMocks() to vi.clearAllMocks()
        s/jest\.clearAllMocks\(/vi.clearAllMocks(/g
        
        # Transform jest.resetAllMocks() to vi.resetAllMocks()
        s/jest\.resetAllMocks\(/vi.resetAllMocks(/g
        
        # Transform jest.restoreAllMocks() to vi.restoreAllMocks()
        s/jest\.restoreAllMocks\(/vi.restoreAllMocks(/g
        
        # Transform jest.setTimeout() to vi.setConfig()
        s/jest\.setTimeout\((\d+)\)/vi.setConfig({ testTimeout: \1 })/g
    ' "$file_path"
}

migrate_mocking() {
    local file_path="$1"
    
    # Transform Jest mocking patterns to Vitest
    sed -i -E '
        # Transform jest.doMock() to vi.doMock()
        s/jest\.doMock\(/vi.doMock(/g
        
        # Transform jest.dontMock() to vi.doUnmock()
        s/jest\.dontMock\(/vi.doUnmock(/g
        
        # Transform jest.setMock() to vi.mock() with implementation
        s/jest\.setMock\(/vi.mock(/g
        
        # Transform __mocks__ references (no change needed, just document)
        # Vitest supports __mocks__ directories the same way
        
        # Transform manual mocks in jest.mock() calls
        s/jest\.mock\(([^,]+),\s*\(\)\s*=>\s*\{/vi.mock(\1, () => \{/g
    ' "$file_path"
}

migrate_matchers() {
    local file_path="$1"
    
    # Most Jest matchers work in Vitest, but some need transformation
    sed -i -E '
        # Transform .toMatchSnapshot() usage (Vitest has built-in support)
        # No transformation needed
        
        # Transform .toThrowErrorMatchingSnapshot()
        s/\.toThrowErrorMatchingSnapshot\(/\.toThrowErrorMatchingInlineSnapshot(/g
        
        # Custom matchers might need updates, but basic ones are compatible
        # toBeInTheDocument, toHaveClass, etc. work with @testing-library/jest-dom
    ' "$file_path"
}

migrate_setup_teardown() {
    local file_path="$1"
    
    # Transform setup/teardown hooks
    sed -i -E '
        # beforeAll, afterAll, beforeEach, afterEach are the same in both
        # No transformation needed
        
        # Transform any Jest-specific setup patterns
        s/setupFilesAfterEnv/setupFiles/g
    ' "$file_path"
}

find_test_files() {
    local target_dir="$1"
    
    if [[ -f "$target_dir" ]]; then
        # Single file provided
        echo "$target_dir"
    elif [[ -d "$target_dir" ]]; then
        # Directory provided - find all test files
        find "$target_dir" \
            -name "*.test.ts" \
            -o -name "*.test.tsx" \
            -o -name "*.test.js" \
            -o -name "*.test.jsx" \
            -o -name "*.spec.ts" \
            -o -name "*.spec.tsx" \
            -o -name "*.spec.js" \
            -o -name "*.spec.jsx" \
            2>/dev/null | sort
    else
        error "Target not found: $target_dir"
        return 1
    fi
}

verify_vitest_config() {
    local vitest_config="$PROJECT_ROOT/vitest.config.ts"
    
    if [[ ! -f "$vitest_config" ]]; then
        warning "Vitest config not found at $vitest_config"
        log "You may need to create a vitest.config.ts file"
        return 1
    fi
    
    # Check if globals are enabled
    if grep -q "globals.*true" "$vitest_config" 2>/dev/null; then
        log "Vitest globals are enabled - no additional imports needed"
    else
        warning "Vitest globals may not be enabled - tests might need explicit imports"
    fi
    
    return 0
}

generate_migration_report() {
    log ""
    log "Migration Summary:"
    log "=================="
    log "Files migrated: $FILES_MIGRATED"
    log "Files skipped: $FILES_SKIPPED"
    log "Errors encountered: $ERRORS_ENCOUNTERED"
    
    if [[ "$CREATE_BACKUP" == "true" ]]; then
        log "Backup location: $BACKUP_DIR"
    fi
    
    log "Migration log: $LOG_FILE"
    
    if [[ $ERRORS_ENCOUNTERED -gt 0 ]]; then
        error "Migration completed with errors"
        return 1
    elif [[ $FILES_MIGRATED -eq 0 ]]; then
        warning "No files were migrated"
        return 0
    else
        success "Migration completed successfully"
        return 0
    fi
}

main() {
    # Default options
    DRY_RUN="false"
    CREATE_BACKUP="true"
    FORCE_MIGRATION="false"
    VERBOSE="false"
    TARGET_DIR="$PROJECT_ROOT/tests"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --backup)
                CREATE_BACKUP="true"
                shift
                ;;
            --no-backup)
                CREATE_BACKUP="false"
                shift
                ;;
            --force)
                FORCE_MIGRATION="true"
                shift
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            -*)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                TARGET_DIR="$1"
                # Convert to absolute path if relative
                if [[ ! "$TARGET_DIR" =~ ^/ ]]; then
                    TARGET_DIR="$PROJECT_ROOT/$TARGET_DIR"
                fi
                shift
                ;;
        esac
    done
    
    # Initialize log
    echo "Jest to Vitest Migration - $(date)" > "$LOG_FILE"
    log "Starting Jest to Vitest migration..."
    log "Target: $TARGET_DIR"
    log "Dry run: $DRY_RUN"
    log "Create backup: $CREATE_BACKUP"
    log "Force migration: $FORCE_MIGRATION"
    
    # Verify Vitest configuration
    verify_vitest_config
    
    # Create backup if requested
    if [[ "$DRY_RUN" == "false" ]]; then
        create_backup
    fi
    
    # Find and migrate test files
    log "Finding test files..."
    
    local test_files
    if ! test_files=$(find_test_files "$TARGET_DIR"); then
        error "Failed to find test files in $TARGET_DIR"
        exit 1
    fi
    
    if [[ -z "$test_files" ]]; then
        warning "No test files found in $TARGET_DIR"
        exit 0
    fi
    
    local total_files
    total_files=$(echo "$test_files" | wc -l)
    log "Found $total_files test files to migrate"
    
    # Migrate each file
    while IFS= read -r file; do
        migrate_file "$file"
    done <<< "$test_files"
    
    # Generate migration report
    generate_migration_report
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi