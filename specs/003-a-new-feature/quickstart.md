# Baker Quickstart Guide

**Feature**: Baker folder scanning and breadcrumbs management  
**Audience**: Developers, QA testers, and end users  
**Prerequisites**: Tauri app running, access to filesystem with project folders

## User Journey Testing

This guide provides step-by-step instructions to validate Baker functionality from the user perspective.

### Test Setup

**Required Test Data**:
1. Create test project folders with BuildProject structure:
   ```
   TestProject1/
   ├── Footage/Camera 1/video1.mp4
   ├── Graphics/
   ├── Renders/
   ├── Projects/
   ├── Scripts/
   └── breadcrumbs.json (existing)

   TestProject2/
   ├── Footage/Camera 1/video2.mp4
   ├── Footage/Camera 2/video3.mp4  
   ├── Graphics/
   ├── Renders/
   ├── Projects/
   └── Scripts/ (no breadcrumbs.json)

   InvalidFolder/
   ├── SomeFiles/
   └── RandomStuff/ (not a BuildProject structure)
   ```

2. Ensure test folders have different permission levels (readable, read-only, restricted)
3. Create some corrupted breadcrumbs.json files for error handling tests

### Primary User Story Validation

**Scenario**: Professional video editor needs to audit and update project metadata across multiple drives.

#### Step 1: Navigate to Baker
1. Open Tauri application
2. Click "Ingest footage" in sidebar
3. Click "Baker" sub-item
4. **Expected**: Baker page loads with folder selection interface

**Test Result**: □ PASS □ FAIL  
**Notes**: ________________________________

#### Step 2: Select Scan Root
1. Click "Select Folder" button
2. Choose directory containing test project folders
3. **Expected**: Selected folder path displays in input field
4. **Expected**: "Start Scan" button becomes enabled

**Test Result**: □ PASS □ FAIL  
**Notes**: ________________________________

#### Step 3: Configure Scan Options
1. Open scan preferences (gear icon or settings)
2. Configure options:
   - ✅ Create missing breadcrumbs
   - ✅ Backup original files
   - Set max depth: 10
3. **Expected**: Preferences save and persist across sessions

**Test Result**: □ PASS □ FAIL  
**Notes**: ________________________________

#### Step 4: Execute Scan
1. Click "Start Scan" button
2. **Expected**: Progress bar appears
3. **Expected**: Current folder path updates in real-time
4. **Expected**: Project count increases as valid folders are found
5. Wait for completion

**Test Result**: □ PASS □ FAIL  
**Scan Duration**: _______ seconds  
**Projects Found**: _______

#### Step 5: Review Results
1. **Expected**: Results table shows:
   - TestProject1: ✅ Valid, Has breadcrumbs
   - TestProject2: ✅ Valid, Missing breadcrumbs  
   - InvalidFolder: ❌ Invalid structure
2. **Expected**: Summary shows:
   - Total folders scanned: ≥3
   - Valid projects: 2
   - Breadcrumbs to update: 1
   - Breadcrumbs to create: 1

**Test Result**: □ PASS □ FAIL  
**Notes**: ________________________________

#### Step 6: Preview Changes
1. Select TestProject1 (existing breadcrumbs)
2. Click "Preview Changes" 
3. **Expected**: Modal shows:
   - Current file count vs discovered file count
   - Files to add/remove from metadata
   - Timestamp update preview
4. Close preview

**Test Result**: □ PASS □ FAIL  
**Notes**: ________________________________

#### Step 7: Batch Apply Changes
1. Select both TestProject1 and TestProject2
2. Click "Apply Changes" 
3. **Expected**: Confirmation dialog appears
4. Confirm operation
5. **Expected**: Progress indicator for batch operation
6. **Expected**: Success notification

**Test Result**: □ PASS □ FAIL  
**Files Modified**: _______

#### Step 8: Verify Updates
1. Navigate to TestProject1 folder
2. Check breadcrumbs.json file:
   - **Expected**: `lastModified` field added with current timestamp
   - **Expected**: `scannedBy` field = "Baker"
   - **Expected**: `files` array matches actual folder contents
   - **Expected**: `.bak` backup file exists
3. Navigate to TestProject2 folder
4. **Expected**: New breadcrumbs.json file created with:
   - `projectTitle`: "TestProject2"
   - `numberOfCameras`: 2
   - `createdBy`: "Baker"
   - `files` array with discovered videos

**Test Result**: □ PASS □ FAIL  
**Notes**: ________________________________

### Edge Case Testing

#### Error Handling
1. **Permission Denied Test**:
   - Scan folder with restricted permissions
   - **Expected**: Error logged but scan continues
   - **Expected**: Specific error message in results

2. **Corrupted Breadcrumbs Test**:
   - Place invalid JSON in breadcrumbs.json
   - **Expected**: Validation error reported
   - **Expected**: Option to regenerate file

3. **Scan Interruption Test**:
   - Start large scan operation
   - Click "Cancel Scan"
   - **Expected**: Operation stops gracefully
   - **Expected**: Partial results preserved

#### Performance Testing
1. **Large Directory Test**:
   - Scan folder with 1000+ subfolders
   - **Expected**: Responsive UI during scan
   - **Expected**: Progress updates at least every second
   - **Expected**: Completion within reasonable time

2. **Deep Nesting Test**:
   - Test with deeply nested folder structures (10+ levels)
   - **Expected**: Respects maxDepth setting
   - **Expected**: No stack overflow errors

### Integration Testing

#### Navigation Integration
1. **Breadcrumb Navigation**:
   - **Expected**: "Ingest footage > Baker" breadcrumb shows
   - Click breadcrumb links
   - **Expected**: Navigation works correctly

#### State Persistence
1. **Preferences Persistence**:
   - Change scan options
   - Restart application
   - Navigate back to Baker
   - **Expected**: Settings preserved

2. **Results Persistence**:
   - Complete a scan
   - Navigate to different page
   - Return to Baker
   - **Expected**: Last scan results still visible

### Performance Benchmarks

**Target Performance** (to verify during testing):

| Operation | Target Time | Actual Time | Status |
|-----------|-------------|-------------|---------|
| Page load | <2 seconds | _________ | □ PASS □ FAIL |
| Folder selection | <1 second | _________ | □ PASS □ FAIL |
| Scan 100 folders | <10 seconds | _________ | □ PASS □ FAIL |
| Update 10 breadcrumbs | <5 seconds | _________ | □ PASS □ FAIL |
| UI responsiveness | No blocking | _________ | □ PASS □ FAIL |

### Acceptance Criteria Checklist

**Must-Have Features**:
- [ ] Folder/drive selection interface
- [ ] Recursive project folder scanning  
- [ ] BuildProject structure validation
- [ ] Existing breadcrumbs.json detection
- [ ] Real-time progress display
- [ ] Batch update operations
- [ ] Error handling with graceful degradation
- [ ] Preview changes before applying
- [ ] Backup original files option

**User Experience**:
- [ ] Intuitive navigation (matches existing app patterns)
- [ ] Clear status indicators during operations
- [ ] Helpful error messages with actionable information
- [ ] Cancellable long-running operations
- [ ] Confirmation dialogs for destructive actions

**Data Integrity**:
- [ ] Backward compatibility with existing breadcrumbs.json format
- [ ] No data loss during updates
- [ ] Atomic file operations (all-or-nothing)
- [ ] Proper backup creation before modifications

**Performance**:
- [ ] Non-blocking UI during background operations
- [ ] Efficient memory usage for large directory scans
- [ ] Reasonable response times per performance table
- [ ] Progress feedback for operations >2 seconds

## Troubleshooting Guide

### Common Issues

**"Permission Denied" Errors**:
- **Cause**: Insufficient file system permissions
- **Solution**: Run application with elevated permissions or choose accessible directory
- **Prevention**: Check directory permissions before scanning

**"No Projects Found" Result**:  
- **Cause**: Directory doesn't contain BuildProject-structured folders
- **Solution**: Verify folder structure includes required subfolders
- **Check**: Ensure Footage/, Graphics/, Renders/, Projects/, Scripts/ exist

**"Scan Takes Too Long"**:
- **Cause**: Very deep directory structure or large file count
- **Solution**: Reduce maxDepth setting or select more specific root folder
- **Monitor**: Use Task Manager to verify app isn't frozen

**"Breadcrumbs Update Failed"**:
- **Cause**: File write permissions or corrupted existing file
- **Solution**: Check folder permissions, restore from backup if needed
- **Recovery**: Manual recreation of breadcrumbs.json using BuildProject

### Support Information

**Log Locations**:
- Frontend errors: Browser developer console
- Backend errors: Tauri application logs  
- Scan operations: Baker-specific log file

**Debug Mode**:
- Enable verbose logging in preferences
- Capture network/file operation traces
- Export scan results for analysis

---

**Testing Complete**: □ All scenarios passed  
**Ready for Production**: □ Yes □ Needs fixes  
**Notes**: ________________________________