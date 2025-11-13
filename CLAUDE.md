# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bucket** is a desktop video editing workflow application built with Tauri (Rust + React/TypeScript). It streamlines video ingest, project creation, and integrates with external tools like Adobe Premiere, Trello, and Sprout Video for professional video production workflows.

## Essential Commands

### Development
```bash
npm run dev:tauri          # Start Tauri dev mode with devtools (primary dev command)
npm run dev                # Start Vite dev server only
npm run preview            # Preview production build
```

### Building
```bash
npm run build:tauri        # Build complete desktop app (creates DMG in /target/build/dmg)
npm run build              # Build frontend only
```

### Code Quality (Run Before Committing)
```bash
npm run eslint:fix         # Fix linting issues automatically
npm run prettier:fix       # Format code automatically  
npm run test               # Run Vitest test suite (migrating from Jest)
```

### Dependency Management
```bash
bun install                # Primary package manager for development
bun update                 # Update dependencies to latest versions
npm audit                  # Security vulnerability scanning
bunx depcheck              # Detect unused dependencies
```

### Package Updates
```bash
# Basic package update commands
npx npm-check-updates                 # Check for available updates
npx npm-check-updates -u             # Update all dependencies to latest
```

## Architecture

### Tech Stack
- **Frontend**: React 18.3 + TypeScript 5.7 + Vite 6.1
- **Backend**: Tauri 2.0 (Rust) with extensive plugin ecosystem
- **UI**: TailwindCSS + Radix UI components + Lucide icons
- **State**: Zustand stores + TanStack React Query (preferred over useEffect)
- **Testing**: Vitest + Testing Library (migrating from Jest)

### Project Structure
```
src/
├── pages/BuildProject/    # Main workflow: file selection, camera assignment, project creation
├── pages/auth/            # Login/registration system  
├── pages/                 # Other features: UploadSprout, UploadTrello, Posterframe, Settings
├── components/            # Reusable UI components
├── hooks/                 # Custom hooks (useBreadcrumb, useCameraAutoRemap, etc.)
├── store/                 # Zustand state management (useBreadcrumbStore)
└── utils/                 # Utility functions

src-tauri/
├── src/                   # Rust backend with file operations, API integrations
├── Cargo.toml             # Rust dependencies (tokio, reqwest, serde, argon2, etc.)
└── tauri.conf.json        # Tauri app configuration
```

## Code Conventions

### TypeScript/React
- **Components**: Functional with React.FC typing, PascalCase files
- **Hooks**: Prefix with `use`, custom hooks in `/hooks`  
- **State**: Zustand stores (suffix with `Store`) over Context API
- **Data Fetching**: TanStack React Query over useEffect (see migration guide in specs/002-update-legacy-code/)
- **Path Aliases**: `@components/*` → `src/components/*`

### Formatting (Auto-configured)
- **Prettier**: 90 char width, single quotes, no semicolons, no trailing commas
- **Import Sorting**: Automatic with @ianvs/prettier-plugin-sort-imports
- **Tailwind Classes**: Auto-sorted with prettier-plugin-tailwindcss

### File Operations
All file operations go through Tauri backend with progress tracking. Key patterns:
- Progress bars for long-running operations
- Camera assignment validation (1 to numCameras range)
- Secure storage using Tauri's stronghold plugin

## Key Business Logic

### BuildProject Workflow
1. **File Selection**: Multi-select files via Tauri dialog
2. **Camera Assignment**: Validate and assign camera numbers to footage
3. **Project Creation**: Generate folder structure + Adobe Premiere integration
4. **Progress Tracking**: Real-time progress during file operations

### Baker Workflow (NEW - Branch: 003-a-new-feature)
1. **Drive Selection**: Choose root directory for scanning
2. **Structure Validation**: Identify BuildProject-compatible folders (Footage/, Graphics/, Renders/, Projects/, Scripts/)
3. **Breadcrumbs Management**: Update existing or create missing breadcrumbs.json files
4. **Batch Operations**: Apply changes to multiple project folders with progress tracking

### External Integrations
- **Adobe Premiere**: Project template generation
- **Trello**: Project management card updates via REST API (GET /1/cards/{id})
- **Sprout Video**: Video hosting + posterframe generation, thumbnails cached in breadcrumbs

### Recent Features

#### Phase 007: AI Script Example Embedding Management (Branch: 007-frontend-script-example)
- **Status**: Implementation Complete
- **Summary**: Frontend interface for managing script examples used in RAG-powered autocue script formatting
- **Key Features**:
  - View all example embeddings (bundled and user-uploaded)
  - Upload custom script examples with automatic embedding generation
  - Replace existing user-uploaded examples
  - Delete user-uploaded examples (bundled examples are protected)
  - Filter examples by source (All, Bundled, Uploaded)
  - Seamless integration with existing RAG system
  - **Database persistence across app updates** (user examples preserved)
- **Components**: See `src/pages/AI/ExampleEmbeddings/`
- **Hooks**: `useExampleManagement`, `useScriptFileUpload`
- **Backend Commands**: `get_all_examples_with_metadata`, `upload_example`, `replace_example`, `delete_example`
- **Database**:
  - SQLite with `source` column to distinguish bundled vs user-uploaded examples
  - Stored in `app_data_dir()` instead of `resource_dir()` to persist across updates
  - Bundled database copied to app data on first run
  - See [database-persistence.md](specs/007-frontend-script-example/database-persistence.md)

#### Phase 004: Multiple Video Links and Trello Cards (Branch: 004-embed-multiple-video)
- **Status**: Phase 1 Design Complete (data models, contracts, tests planned)
- **Summary**: Enhanced breadcrumbs.json to support arrays of video links and Trello cards instead of single values
- **Key Changes**:
  - New `videoLinks[]` array field (replaces implicit single video)
  - New `trelloCards[]` array field (replaces single `trelloCardUrl`)
  - Backward-compatible: Legacy `trelloCardUrl` preserved for old file readers
  - Sprout Video thumbnails cached in breadcrumbs (no real-time API calls)
  - Trello card titles fetched via API and cached (7-day refresh)
- **Data Models**: See `specs/004-embed-multiple-video/data-model.md`
- **API Contracts**: See `specs/004-embed-multiple-video/contracts/tauri-commands.md`
- **User Workflows**: See `specs/004-embed-multiple-video/quickstart.md`

#### Phase 003: Baker Workflow (Branch: 003-a-new-feature - MERGED)
- Folder scanning and breadcrumbs batch management
- Stale breadcrumbs detection and validation
- Detailed change previews before applying updates

#### Phase 002: Legacy Code Modernization (MERGED)
- Migrated from useEffect to TanStack React Query for data fetching
- Refactored large components into focused, reusable pieces
- Improved error handling and loading states

#### Phase 005: Premiere Template Corruption Fix (MERGED)
- Fixed file corruption when copying Premiere Pro templates during project creation
- Root cause: Missing `sync_all()` call after `write_all()` in Rust file I/O
- Solution: Added `file.sync_all()` to guarantee OS buffer flush to disk
- Impact: Eliminated 100% of corruption cases with <100ms performance overhead
- Enhanced error messages with file path and error kind for better debugging
- Files: [premiere.rs](src-tauri/src/commands/premiere.rs)

## Development Notes

- **Main Branch**: `release` (use for PRs)
- **Package Manager**: Bun (primary) + npm (audit compatibility, maintains dual lock files)
- **Platform**: Cross-platform desktop app, primary development on macOS
- **Security**: Uses argon2 for password hashing, JWT for auth, Tauri stronghold for secure storage