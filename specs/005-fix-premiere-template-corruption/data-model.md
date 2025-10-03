# Data Model: Premiere Template Copy Fix

**Date**: 2025-10-03 | **Feature**: 005-fix-premiere-template-corruption

## Overview

This bug fix does NOT introduce new data models. It modifies the file I/O behavior in the existing `copy_premiere_project` Tauri command to ensure reliable binary file copying.

## Existing Data Structures (Unchanged)

### Tauri Command Parameters

```rust
#[command]
pub fn copy_premiere_project(
    handle: AppHandle,          // Tauri app handle for resource resolution
    destination_folder: String,  // Target folder path (e.g., "/path/to/project/Projects/")
    new_title: String,           // New filename without extension (e.g., "My Video Project")
) -> Result<(), String>
```

**No changes to parameters or return type.**

### File Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. open_resource_file()                                         │
│    Input:  "resources/Premiere 4K Template 2025.prproj"         │
│    Output: Vec<u8> (binary file data, ~138KB)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. File::create()                                               │
│    Input:  destination_path: PathBuf                            │
│    Output: std::fs::File (write handle)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. file.write_all()                                             │
│    Input:  &Vec<u8> (template binary data)                      │
│    Output: Result<(), std::io::Error>                           │
│    Effect: Writes to OS buffer (NOT disk)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. file.sync_all() ← NEW STEP (THE FIX)                        │
│    Input:  None                                                 │
│    Output: Result<(), std::io::Error>                           │
│    Effect: Flushes OS buffers + metadata to disk               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. File handle drops (RAII)                                     │
│    Effect: Closes file descriptor (now safe - data on disk)    │
└─────────────────────────────────────────────────────────────────┘
```

## State Transitions

### Before Fix (Buggy Behavior)
```
[Created] → write_all() → [Written to buffer] → drop() → [Corruption possible]
                                                   ↓
                                          OS may not flush
```

### After Fix (Correct Behavior)
```
[Created] → write_all() → [Buffered] → sync_all() → [Synced to disk] → drop() → [Safe]
                                          ↓
                                   Guaranteed flush
```

## Error States

### Current Error Handling (Preserved)
```rust
// Step 1: File creation
File::create(&destination_path)
    .map_err(|e| format!("Error creating file: {}", e))?;

// Step 2: Write operation
file.write_all(&file_data)
    .map_err(|e| format!("Error writing file: {}", e))?;
```

### Enhanced Error Handling (Recommended)
```rust
// Step 1: File creation
let mut file = File::create(&destination_path)
    .map_err(|e| format!("Failed to create file '{}': {} ({})",
        destination_path.display(), e, e.kind()))?;

// Step 2: Write operation
file.write_all(&file_data)
    .map_err(|e| format!("Failed to write template data to '{}': {} ({} bytes, error: {})",
        destination_path.display(), e, file_data.len(), e.kind()))?;

// Step 3: Sync operation (NEW)
file.sync_all()
    .map_err(|e| format!("Failed to sync file '{}' to disk: {} ({})",
        destination_path.display(), e, e.kind()))?;
```

## Validation Rules

### Existing Validations (Unchanged)
1. **Destination folder exists** - Created if missing via `fs::create_dir_all()`
2. **File doesn't exist** - Returns error if destination file already exists
3. **Template file exists** - `open_resource_file()` fails if template not bundled

### New Validations (Added by Fix)
4. **Write completion** - `sync_all()` ensures OS confirms disk write
5. **Metadata sync** - File size/modification time persisted to disk

## Performance Characteristics

| Operation | Before Fix | After Fix | Delta |
|-----------|-----------|-----------|-------|
| `write_all()` | ~10ms | ~10ms | 0ms |
| `sync_all()` | N/A | ~50-100ms | +50-100ms |
| **Total** | ~10ms | ~60-110ms | +50-100ms |

**Impact**: Negligible - operation occurs after project creation UI flow completes.

## Platform-Specific Behavior

| Platform | `sync_all()` System Call | Metadata Sync |
|----------|-------------------------|---------------|
| macOS | `fcntl(F_FULLFSYNC)` | ✅ Yes |
| Windows | `FlushFileBuffers()` | ✅ Yes |
| Linux | `fsync()` | ✅ Yes |

**All platforms guarantee data + metadata write before `sync_all()` returns.**

## Backward Compatibility

- ✅ **API unchanged**: Same function signature
- ✅ **Caller unchanged**: Frontend code in `useCreateProject.ts` unaffected
- ✅ **Return type unchanged**: Still `Result<(), String>`
- ✅ **Error handling unchanged**: Errors propagate via `?` operator

## Future Enhancements (Out of Scope)

### Optional File Verification Model
```rust
#[derive(serde::Serialize)]
struct CopyVerification {
    source_size: u64,
    dest_size: u64,
    source_hash: String,  // SHA-256
    dest_hash: String,    // SHA-256
    verified: bool,
}
```

This would enable:
- Post-copy integrity checks
- Diagnostic logging
- Automatic retry on hash mismatch

**Not included in MVP fix - requires additional research and testing.**
