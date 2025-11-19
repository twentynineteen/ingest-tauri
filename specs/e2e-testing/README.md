# E2E Testing Infrastructure Plan

**Status:** Planning
**Target:** Q1 2026
**Technical Debt Item:** DEBT-009

## Overview

This document outlines the plan for setting up end-to-end (E2E) testing infrastructure for the Bucket Tauri application.

## Recommended Stack

### Framework: Playwright + Tauri WebDriver
- **Playwright** - Industry-standard E2E testing framework
- **@playwright/test** - Test runner with parallel execution
- **Tauri WebDriver** - Integration layer for testing Tauri apps

### Why Playwright over Cypress?
1. Better support for WebDriver protocol (required for Tauri)
2. Native support for testing Electron-like apps
3. Multi-browser testing out of the box
4. Better performance with parallel test execution

## Implementation Phases

### Phase 1: Basic Infrastructure (1-2 days)
1. Install dependencies:
   ```bash
   npm install -D @playwright/test playwright
   ```
2. Create Playwright configuration (`playwright.config.ts`)
3. Set up Tauri WebDriver integration
4. Create test utilities for app launching
5. Add basic smoke test

### Phase 2: Test Fixtures (1 day)
1. Create page objects for main workflows
2. Set up mock data fixtures
3. Create helpers for Tauri API mocking
4. Add screenshot and video recording

### Phase 3: Migrate Skipped Tests (1-2 days)
1. Implement `example-management.test.tsx` tests (14 tests)
2. Implement `baker-scan-workflow.test.ts` tests (3 tests)

### Phase 4: CI Integration (0.5 days)
1. Add E2E test job to GitHub Actions
2. Configure artifact storage for screenshots/videos
3. Set up test parallelization

## File Structure

```
tests/
├── e2e/
│   ├── fixtures/
│   │   ├── app.fixture.ts       # App launch helpers
│   │   └── mocks.fixture.ts     # Tauri API mocks
│   ├── pages/
│   │   ├── baker.page.ts        # Baker page object
│   │   ├── example.page.ts      # Example embeddings page object
│   │   └── common.page.ts       # Shared selectors
│   ├── specs/
│   │   ├── example-management.spec.ts
│   │   └── baker-workflow.spec.ts
│   └── playwright.config.ts
```

## Configuration Example

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'tauri://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev:tauri',
    port: 1420,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
})
```

## Key Considerations

### Tauri-Specific Challenges
1. **IPC Mocking** - Need to mock `invoke()` calls to Rust backend
2. **File System** - Tests may need temp directories for file operations
3. **Dialog APIs** - Need to mock Tauri dialog plugin
4. **App Lifecycle** - Proper app launch/teardown between tests

### Test Data Management
1. Use isolated SQLite databases for each test
2. Seed test data programmatically
3. Clean up after each test run

## Scripts to Add

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## References

- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/webdriver)
- [Playwright Documentation](https://playwright.dev/)
- [Tauri + Playwright Example](https://github.com/nicholasrice/tauri-playwright-example)

## Next Steps

1. Review and approve this plan
2. Create feature branch for E2E infrastructure
3. Implement Phase 1 (basic infrastructure)
4. Implement remaining phases iteratively
