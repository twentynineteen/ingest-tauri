# Feature Specification: Fix Premiere Pro Template Corruption

**Branch**: `005-fix-premiere-template-corruption` | **Date**: 2025-10-03
**Type**: Bug Fix | **Priority**: High

## Problem Statement

When creating a new project via [BuildProject.tsx](../../src/pages/BuildProject/BuildProject.tsx), the Premiere Pro template file (`.prproj`) is copied to the project's `Projects/` folder but becomes corrupted. When users attempt to open the copied file in Adobe Premiere Pro, the application reports the file as corrupted and cannot open it.

### Root Cause Analysis

Investigation revealed the following issues in [premiere.rs:95-98](../../src-tauri/src/commands/premiere.rs#L95-L98):

1. **Missing file flush**: After `write_all()`, the file buffer is not explicitly flushed to disk
2. **No sync guarantee**: Without `sync_all()` or `flush()`, OS buffers may not write data immediately
3. **Premature file handle drop**: File handle drops immediately after `write_all()` returns, potentially before OS completes write

### Current Code
```rust
let mut file = fs::File::create(&destination_path)
    .map_err(|e| format!("Error creating file: {}", e))?;
file.write_all(&file_data)
    .map_err(|e| format!("Error writing file: {}", e))?;
// File drops here - NO flush/sync guarantee!
```

## User Stories

**As a** video editor
**I want** the Premiere Pro project template to be correctly copied when I create a new project
**So that** I can immediately open the project in Adobe Premiere Pro without errors

### Acceptance Criteria
- ✅ Copied `.prproj` files open successfully in Adobe Premiere Pro
- ✅ File integrity is verified (byte-for-byte match with source template)
- ✅ No corruption regardless of file size (127KB-138KB templates)
- ✅ Operation works consistently across macOS, Windows, Linux
- ✅ Error handling provides clear feedback if copy fails

## Functional Requirements

### FR-1: Reliable Binary File Copy
The system MUST ensure complete, uncorrupted binary file copies by:
- Flushing all buffers to disk before closing file handles
- Syncing file metadata to ensure OS write completion
- Verifying file size matches source template

### FR-2: Error Handling
The system MUST provide clear error messages for:
- File creation failures
- Write operation failures
- Flush/sync failures
- Permission issues

### FR-3: Backward Compatibility
The fix MUST NOT break existing functionality:
- Existing project creation workflow unchanged
- Same API contract for `copy_premiere_project` command
- Template file bundling remains in `assets/` directory

## Non-Functional Requirements

### NFR-1: Performance
- File copy operation MUST complete within 2 seconds for templates up to 500KB
- Flush/sync operations MUST NOT add >100ms overhead

### NFR-2: Reliability
- File integrity MUST be 100% (no partial writes accepted)
- Operation MUST be atomic (either complete success or clean failure)

### NFR-3: Cross-Platform
- Solution MUST work identically on macOS, Windows, Linux
- Use platform-agnostic Rust std::fs APIs only

## Technical Constraints

- **Language**: Rust (existing Tauri backend)
- **Framework**: Tauri 2.0 command system
- **File Format**: Binary `.prproj` files (Adobe Premiere Pro projects)
- **Template Size**: 127KB-138KB (current templates)
- **NO Breaking Changes**: Must preserve existing API signature

## Success Criteria

1. **Functional**: 100% of copied `.prproj` files open successfully in Premiere Pro
2. **Integrity**: SHA-256 hash of copied file matches source template
3. **Reliability**: Zero corruption reports in 100 consecutive copy operations
4. **Performance**: Copy operation completes in <2 seconds (p99)

## Out of Scope

- Template file content modifications
- Support for other project file formats (.aep, .fcpx, etc.)
- Template version management
- Progress reporting for copy operation
- Retry logic for failed copies

## Dependencies

- Rust `std::fs` module (stable)
- Tauri 2.0 command infrastructure (already integrated)
- Existing template files in `src-tauri/assets/` directory

## References

- [BuildProject.tsx](../../src/pages/BuildProject/BuildProject.tsx) - Frontend integration
- [premiere.rs](../../src-tauri/src/commands/premiere.rs) - Backend implementation
- [useCreateProject.ts](../../src/hooks/useCreateProject.ts) - React hook caller
- Template files: `src-tauri/assets/Premiere 4K Template 2025.prproj`
