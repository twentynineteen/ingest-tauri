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

### Advanced Package Update Workflow
```bash
# Comprehensive package update workflow
./scripts/quickstart-validation.sh    # Validate complete workflow
./scripts/security-audit.sh          # Run security audit with reporting
./scripts/validate-lock-sync.sh       # Ensure npm/bun lock file sync

# Individual service operations
npx npm-check-updates                 # Check for available updates
npx npm-check-updates -u             # Update all dependencies to latest
```

### Package Update Services (New in v0.8.1)
The project now includes a comprehensive package update workflow with:
- **Security-first updates**: Automatic vulnerability resolution
- **Breaking change detection**: AI-powered analysis of update impacts  
- **Dual package manager support**: Automatic npm/bun synchronization
- **Progress tracking**: Real-time feedback during updates
- **Rollback mechanism**: Safe recovery from failed updates
- **Tauri compatibility validation**: Ensures plugin compatibility

```typescript
// Usage example for package update workflow
import { PackageUpdateWorkflow } from './src/services/PackageUpdateWorkflow'
import { ProgressTracker } from './src/services/ProgressTracker'
import { UserFeedbackService } from './src/services/UserFeedbackService'

const workflow = new PackageUpdateWorkflow()
const result = await workflow.executeWorkflow({
  autoResolveVulnerabilities: true,
  createRollbackPoint: true,
  updateStrategy: 'moderate'
})
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

### External Integrations
- **Adobe Premiere**: Project template generation
- **Trello**: Project management card updates
- **Sprout Video**: Video hosting + posterframe generation

## Development Notes

- **Main Branch**: `release` (use for PRs)
- **Package Manager**: Bun (primary) + npm (audit compatibility, maintains dual lock files)
- **Platform**: Cross-platform desktop app, primary development on macOS
- **Security**: Uses argon2 for password hashing, JWT for auth, Tauri stronghold for secure storage