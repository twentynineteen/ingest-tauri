# Feature Specification: Baker

**Feature Branch**: `003-a-new-feature`  
**Created**: 2025-09-25  
**Status**: Draft  
**Input**: User description: "a new feature called baker, which sits in the 'ingest footage' panel on the left hand side of the app. the page, which follows the same design style as the @src/pages/BuildProject/BuildProject.tsx and @src/pages/UploadTrello.tsx pages will enable users to select a folder or drive and the feature will scan all directories for folder structures that match the preset folder structure created in the buildproject page. it should scan the files added to footage and update, or if required, create a breadcrumbs file with the updated information. a successful user story would involve selecting a drive and baker scans and updates all folders that match or contain breadcrumbs.json files with up to date information"

## Execution Flow (main)
```
1. Parse user description from Input
   → ✅ Parsed: Baker is a scanning/updating tool for project folders
2. Extract key concepts from description
   → ✅ Identified: folder scanning, breadcrumbs.json management, project structure validation
3. For each unclear aspect:
   → [NEEDS CLARIFICATION: What constitutes "up to date information" in breadcrumbs.json?]
   → [NEEDS CLARIFICATION: Should Baker create new breadcrumbs.json for folders without them?]
   → [NEEDS CLARIFICATION: What validation rules determine if a folder "matches" BuildProject structure?]
4. Fill User Scenarios & Testing section
   → ✅ Clear user flow identified: select drive → scan → update breadcrumbs
5. Generate Functional Requirements
   → ✅ Each requirement testable and specific
6. Identify Key Entities
   → ✅ ProjectFolder, BreadcrumbsFile, ScanResult entities identified
7. Run Review Checklist
   → ⚠ WARN "Spec has uncertainties" - clarifications needed for breadcrumbs update logic
8. Return: SUCCESS (spec ready for planning with clarifications)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a video production professional, I want to scan existing project folders on my drives to ensure all projects have current and accurate metadata (breadcrumbs.json files) so that I can maintain consistent project tracking and integration with external tools like Trello, even for projects created outside the current application.

### Acceptance Scenarios
1. **Given** I have multiple project folders on a drive with existing breadcrumbs.json files, **When** I run Baker scan on that drive, **Then** all breadcrumbs.json files are updated with current file information and metadata
2. **Given** I have project folders that match the BuildProject structure but lack breadcrumbs.json files, **When** I run Baker scan, **Then** new breadcrumbs.json files are created with discovered project information
3. **Given** I select a drive with no matching project folders, **When** I run Baker scan, **Then** I receive a summary showing "0 projects found" with no changes made
4. **Given** I have a mix of valid and invalid project structures, **When** I run Baker scan, **Then** only valid project folders are processed and invalid ones are reported separately

### Edge Cases
- What happens when breadcrumbs.json files are corrupted or unreadable?
- How does Baker handle permission errors on folders or files?
- What happens if the scanning process is interrupted mid-way?
- How does Baker handle very large drives with thousands of folders?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST provide a drive/folder selection interface similar to existing BuildProject page design
- **FR-002**: System MUST scan selected drives recursively to identify project folders matching BuildProject structure (contains Footage/, Graphics/, Renders/, Projects/, Scripts/ subfolders)
- **FR-003**: System MUST detect existing breadcrumbs.json files within identified project folders
- **FR-004**: System MUST update existing breadcrumbs.json files with [NEEDS CLARIFICATION: current file information - what specific data needs updating?]
- **FR-005**: System MUST create new breadcrumbs.json files for project folders that lack them but match the required structure
- **FR-006**: System MUST display real-time progress during scanning operations with folder counts and processing status
- **FR-007**: System MUST provide a summary report showing: projects scanned, breadcrumbs updated, breadcrumbs created, and any errors encountered
- **FR-008**: System MUST validate folder structures before processing (must contain required subfolders: Footage/, Graphics/, Renders/, Projects/, Scripts/)
- **FR-009**: System MUST handle file system permission errors gracefully without stopping the entire scan process
- **FR-010**: Users MUST be able to preview changes before applying them to breadcrumbs.json files
- **FR-011**: System MUST log all scanning activities and changes made for audit purposes

*Clarification needed requirements:*
- **FR-012**: System MUST determine project metadata for new breadcrumbs.json files [NEEDS CLARIFICATION: How to determine numberOfCameras, createdBy, and other metadata for existing projects?]
- **FR-013**: System MUST update breadcrumbs.json with current file listings [NEEDS CLARIFICATION: Should this include file size, modification dates, or just file names?]

### Key Entities *(include if feature involves data)*
- **ProjectFolder**: Represents a folder structure matching BuildProject pattern, contains path, validation status, existing breadcrumbs status
- **BreadcrumbsFile**: Represents breadcrumbs.json metadata including project title, cameras, file lists, creation info, and modification timestamps  
- **ScanResult**: Aggregates scanning outcomes including folders processed, files updated, errors encountered, and operation duration
- **FolderStructure**: Defines the required subfolder pattern (Footage/Camera X, Graphics/, Renders/, Projects/, Scripts/) for validation

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed (pending clarifications)

---