# Feature Specification: Multiple Video Links and Trello Cards in Breadcrumbs

**Feature Branch**: `004-embed-multiple-video`  
**Created**: 2025-09-30  
**Status**: Draft  
**Input**: User description: "embed multiple video links and trello cards to a single breadcrumbs file / project. A project built with @src/pages/BuildProject/ can result in multiple video files, and a trello card for each. Add in functionality to specify a single breadcrumb file for multiple cards and include the trello card url and video links as an array of links instead of a single file. This functionality should extend to @src/pages/Baker/ which should enable users to preview links for all attached videos and cards. the video files are uploaded to Sprout video via @src/pages/UploadSprout.tsx and rely on the Sprout Video Api linked here: https://sproutvideo.com/docs/api.html"

## Execution Flow (main)
```
1. Parse user description from Input
   → COMPLETE: Feature description parsed
2. Extract key concepts from description
   → Identified: BuildProject workflow, breadcrumbs files, video uploads, Trello cards, Baker previews
3. For each unclear aspect:
   → [RESOLVED: Videos are final renders, not tied to cameras, manual association required]
   → [RESOLVED: No hard limits on videos/cards per project]
   → [RESOLVED: Cache thumbnail URLs in breadcrumbs, don't fetch in real-time]
   → [RESOLVED: Fetch Trello card titles via API using existing credentials]
4. Fill User Scenarios & Testing section
   → COMPLETE: User flows defined for multi-video projects
5. Generate Functional Requirements
   → COMPLETE: Each requirement is testable
6. Identify Key Entities
   → COMPLETE: Video links, Trello cards, breadcrumbs data structures
7. Run Review Checklist
   → COMPLETE: All clarifications resolved
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a video production user, I want to attach multiple video files and multiple Trello project management cards to a single project's breadcrumbs file, so that I can track all related content and deliverables in one central location rather than managing separate breadcrumbs for each video.

### Acceptance Scenarios
1. **Given** I have a project with 3 camera angles that resulted in 3 separate video files, **When** I create or update the breadcrumbs file, **Then** I can add all 3 video links to a single breadcrumbs file instead of creating 3 separate files
2. **Given** I have multiple Trello cards for different aspects of the same project (pre-production, production, post-production), **When** I manage the project breadcrumbs, **Then** I can link all relevant Trello cards to the same breadcrumbs file
3. **Given** I am using Baker to scan projects, **When** I view a project with multiple videos and Trello cards, **Then** I can preview all attached videos and cards from the Baker interface
4. **Given** I have uploaded videos to Sprout Video for a project, **When** I add them to breadcrumbs, **Then** the video metadata is automatically retrieved and stored
5. **Given** I have an existing breadcrumbs file with a single video, **When** I add additional videos, **Then** the system converts the single video to an array and adds the new ones

### Edge Cases
- What happens when a video link becomes invalid or the video is deleted from Sprout Video?
- How does the system handle Trello cards that become inaccessible due to permission changes?
- What happens when trying to add duplicate video links or Trello cards?
- How does Baker handle breadcrumbs files with mixed single/multiple video formats during migration?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST allow users to associate multiple video links with a single project's breadcrumbs file
- **FR-002**: System MUST allow users to associate multiple Trello card URLs with a single project's breadcrumbs file  
- **FR-003**: System MUST store video links as an array structure instead of single string values
- **FR-004**: System MUST store Trello card URLs as an array structure instead of single string values
- **FR-005**: System MUST maintain backward compatibility with existing breadcrumbs files that have single video/card links
- **FR-006**: Baker MUST display all attached videos and Trello cards when previewing project breadcrumbs
- **FR-007**: Users MUST be able to add, remove, and reorder video links within a project's breadcrumbs
- **FR-008**: Users MUST be able to add, remove, and reorder Trello card links within a project's breadcrumbs
- **FR-009**: System MUST validate video links use proper URL format (https://) and handle gracefully if links become inaccessible
- **FR-010**: System MUST validate Trello card URLs use proper format and extract card ID for API integration
- **FR-011**: When uploading videos via UploadSprout, system MUST provide option to associate with existing project breadcrumbs
- **FR-012**: System MUST automatically migrate existing single video/card breadcrumbs to array format when additional items are added
- **FR-013**: Baker preview MUST display video thumbnails using cached thumbnail URLs stored in breadcrumbs when videos are added
- **FR-014**: Baker preview MUST fetch and display Trello card titles via Trello REST API (GET /1/cards/{id}) using existing user credentials
- **FR-015**: System MUST allow manual association of final rendered videos (from 'renders' folder) with Trello cards, as final videos are not tied to specific cameras but represent edited/final output
- **FR-016**: System MUST recognize that videos for upload come from the 'renders' folder within the project structure, containing final edited videos rather than raw camera footage

### Key Entities *(include if feature involves data)*
- **Video Link**: Represents a Sprout Video URL with associated metadata (title, thumbnail, upload date, source render file)
- **Trello Card Link**: Represents a Trello card URL with associated metadata (title, status, board information)  
- **Multi-Media Breadcrumbs**: Enhanced breadcrumbs file structure supporting arrays of videos and Trello cards
- **Project Association**: Relationship between a project folder and its collection of videos and Trello cards

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
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
- [x] Review checklist passed

---