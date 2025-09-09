# Tasks: Package Updates and Security Vulnerability Resolution

**Input**: Design documents from `/specs/003-update-all-used/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.9, React 19.1, Tauri 2.8, Vite 7.1, Vitest 3.2
   → Structure: Single project (Tauri hybrid)
2. Load design documents:
   → data-model.md: PackageDependency, SecurityVulnerability, UpdateReport entities
   → contracts/: dependency-management.json API endpoints
   → research.md: Dual package manager strategy, security-first approach
3. Generate tasks by category:
   → Setup: dependency tooling, audit infrastructure
   → Tests: contract tests for each endpoint, validation tests
   → Core: dependency scanning, security auditing, package updates
   → Integration: Jest→Vitest migration, lock file synchronization  
   → Polish: cleanup unused packages, breaking change resolution
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Security-first ordering: audit before updates
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup and Infrastructure
- [x] T001 Install dependency analysis tools (depcheck, npm-check-updates)
- [x] T002 [P] Configure dual package manager validation scripts in scripts/validate-lock-sync.sh
- [x] T003 [P] Setup security audit reporting structure in scripts/security-audit.sh

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test for dependency scan endpoint in tests/integration/dependency-scan.test.ts
- [x] T005 [P] Contract test for security audit endpoint in tests/integration/security-audit.test.ts
- [x] T006 [P] Contract test for unused package detection in tests/integration/unused-packages.test.ts
- [x] T007 [P] Contract test for dependency update process in tests/integration/dependency-update.test.ts
- [x] T008 [P] Contract test for Jest→Vitest migration in tests/integration/testing-migration.test.ts
- [x] T009 [P] Validation test for PackageDependency entity in tests/unit/package-dependency.test.ts
- [x] T010 [P] Validation test for SecurityVulnerability entity in tests/unit/security-vulnerability.test.ts
- [x] T011 [P] Validation test for UpdateReport entity in tests/unit/update-report.test.ts
- [x] T012 [P] Integration test for dual package manager synchronization in tests/integration/package-manager-sync.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T013 [P] PackageDependency model with validation in src/models/PackageDependency.ts
- [x] T014 [P] SecurityVulnerability model with CVE validation in src/models/SecurityVulnerability.ts
- [x] T015 [P] UpdateReport model with change tracking in src/models/UpdateReport.ts
- [x] T016 Dependency scanning service in src/services/DependencyScanner.ts
- [x] T017 Security audit service with npm/bun integration in src/services/SecurityAuditor.ts
- [x] T018 Unused package detection service in src/services/UnusedPackageDetector.ts
- [x] T019 Package update orchestration service in src/services/PackageUpdater.ts
- [x] T020 Lock file synchronization service in src/services/LockFileSynchronizer.ts

## Phase 3.4: Testing Framework Migration
- [x] T021 Install Vitest alongside Jest with configuration in vitest.config.ts
- [x] T022 Create Jest→Vitest migration utility in scripts/migrate-tests.sh
- [x] T023 [P] Convert existing test files to Vitest format (batch 1: components)
- [x] T024 [P] Convert existing test files to Vitest format (batch 2: hooks)
- [x] T025 [P] Convert existing test files to Vitest format (batch 3: utils)
- [x] T026 Update package.json scripts to use Vitest exclusively
- [x] T027 Remove Jest dependencies and configuration files

## Phase 3.5: Security and Updates Implementation
- [x] T028 Implement security vulnerability resolution with automated patching
- [x] T029 Implement breaking change detection and reporting
- [x] T030 Create update rollback mechanism for failed updates
- [x] T031 [P] Update Tauri plugin dependencies with compatibility validation
- [x] T032 [P] Update React and TypeScript with breaking change handling
- [x] T033 [P] Update build tool dependencies (Vite, ESLint, Prettier)

## Phase 3.6: Integration and Validation
- [x] T034 Integrate all services into main package update workflow
- [x] T035 Add progress tracking and user feedback during updates
- [x] T036 Implement error handling and recovery mechanisms
- [x] T037 Validate dual package manager lock file consistency
- [x] T038 Test complete workflow with quickstart validation script

## Phase 3.7: Polish and Cleanup
- [x] T039 [P] Remove unused dependencies identified by analysis
- [x] T040 [P] Update CLAUDE.md with new dependency management commands
- [x] T041 [P] Create documentation for security audit process in docs/security-audit.md
- [x] T042 Run final build and test validation
- [x] T043 Create update report and breaking change documentation
- [x] T044 Update project version to 0.8.1 with changelog

## Dependencies

**Critical Dependencies**:
- Setup (T001-T003) must complete before any implementation
- All tests (T004-T012) must be written and FAILING before implementation begins
- Models (T013-T015) must complete before services (T016-T020)
- Jest→Vitest migration (T021-T027) is independent and can run in parallel with other work
- Security implementation (T028-T033) depends on core services
- Integration (T034-T038) requires all services to be complete

**Parallel Execution Blockers**:
- T016-T020 are sequential (same service architecture)
- T023-T025 are parallel (different test directories)
- T031-T033 are parallel (different dependency categories)

## Parallel Execution Examples

**Phase 3.2 - All Contract Tests (run together)**:
```bash
# Launch T004-T012 simultaneously
Task: "Contract test for dependency scan endpoint in tests/integration/dependency-scan.test.ts"
Task: "Contract test for security audit endpoint in tests/integration/security-audit.test.ts"
Task: "Validation test for PackageDependency entity in tests/unit/package-dependency.test.ts"
Task: "Integration test for dual package manager sync in tests/integration/package-manager-sync.test.ts"
```

**Phase 3.3 - Model Creation (run together)**:
```bash
# Launch T013-T015 simultaneously
Task: "PackageDependency model with validation in src/models/PackageDependency.ts"
Task: "SecurityVulnerability model with CVE validation in src/models/SecurityVulnerability.ts"
Task: "UpdateReport model with change tracking in src/models/UpdateReport.ts"
```

**Phase 3.4 - Test Migration (run together)**:
```bash
# Launch T023-T025 simultaneously  
Task: "Convert existing test files to Vitest format (batch 1: components)"
Task: "Convert existing test files to Vitest format (batch 2: hooks)"
Task: "Convert existing test files to Vitest format (batch 3: utils)"
```

**Phase 3.5 - Dependency Updates (run together)**:
```bash
# Launch T031-T033 simultaneously
Task: "Update Tauri plugin dependencies with compatibility validation"
Task: "Update React and TypeScript with breaking change handling"
Task: "Update build tool dependencies (Vite, ESLint, Prettier)"
```

## Implementation Notes

- **Security-First Approach**: All security vulnerabilities must be resolved before feature updates
- **TDD Enforcement**: Every contract and integration test must fail before implementation begins
- **Breaking Changes**: Each breaking change gets documented and tracked for separate resolution
- **Dual Lock Files**: bun.lockb and package-lock.json must remain synchronized throughout
- **Rollback Ready**: Every update step must be reversible in case of failures

## Validation Checklist
*GATE: Checked before execution begins*

- [x] All 5 contracts have corresponding tests (T004-T008)
- [x] All 3 entities have model tasks (T013-T015)
- [x] All tests come before implementation (T004-T012 before T013+)
- [x] Parallel tasks target different files ([P] marked correctly)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Security-first ordering maintained
- [x] TDD cycle enforced with failing tests requirement

## Progress Summary  
**Completed**: 44/44 tasks (100%) ✅
**Status**: ALL PHASES COMPLETE
**Final Release**: Version 0.8.1 - Package Update Workflow System

**Total Tasks**: 44 tasks organized in 7 phases with clear dependencies and parallel execution opportunities.