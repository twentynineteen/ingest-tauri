# Phase 0: Research - Package Updates and Security Resolution

## Research Overview
Investigation of dependency management strategies, security audit tools, and Jest-to-Vitest migration approaches for Tauri-based desktop applications with dual package manager support.

## Research Tasks & Findings

### 1. Dependency Update Strategies for Tauri Applications

**Decision**: Multi-phase update approach with compatibility testing
**Rationale**: 
- Tauri 2.8 has specific plugin version requirements that must be maintained
- React 19.1 is relatively new and requires careful migration from older patterns
- Desktop apps need stability over bleeding-edge features

**Alternatives considered**:
- Wholesale update to latest versions: Too risky for desktop stability
- Manual selective updates: Too time-intensive for 110+ packages

### 2. Dual Package Manager (Bun + npm) Compatibility

**Decision**: Maintain both bun.lockb and package-lock.json in sync
**Rationale**:
- Bun is primary for development speed
- npm audit is more mature for security scanning
- CI/CD systems may prefer npm for broader compatibility

**Alternatives considered**:
- Bun-only approach: Audit tooling less mature
- npm-only approach: Loses development speed benefits

### 3. Security Audit and Resolution Tools

**Decision**: Combined approach using npm audit, bun audit (when available), and Snyk/GitHub security advisories
**Rationale**:
- npm audit has most comprehensive vulnerability database
- GitHub security advisories integrate with repository
- Multiple sources provide better coverage

**Alternatives considered**:
- Single audit tool: May miss vulnerabilities not in one database
- Manual CVE tracking: Too time-intensive and error-prone

### 4. Jest to Vitest Migration Strategy

**Decision**: Parallel migration with configuration coexistence
**Rationale**:
- Vitest is Vite-native and aligns with build tooling
- Jest configuration can remain during transition
- Gradual migration reduces risk of breaking existing tests

**Alternatives considered**:
- Complete replacement: Too risky for existing test suite
- Keep Jest permanently: Misaligned with Vite ecosystem

### 5. Unused Package Detection

**Decision**: Static analysis using depcheck + manual verification for Tauri plugins
**Rationale**:
- Depcheck handles most standard JS/TS imports
- Tauri plugins are declared in tauri.conf.json, not imported directly
- Manual verification prevents removal of build-time dependencies

**Alternatives considered**:
- Purely automated detection: May remove required Tauri dependencies
- Manual-only approach: Too time-intensive for 110+ packages

### 6. Breaking Change Handling

**Decision**: Separate feature branches for breaking change resolution
**Rationale**:
- Allows dependency updates to proceed while isolating breaking changes
- Maintains git history of what broke and how it was fixed
- Enables rollback of specific breaking changes if needed

**Alternatives considered**:
- Fix breaking changes inline: Blocks dependency updates if fixes are complex
- Accept broken state: Unacceptable for application stability

## Technical Implementation Details

### Package Manager Command Strategy
- **Primary**: Use bun for installations and updates
- **Audit**: Use npm audit for security scanning
- **Verification**: Cross-verify lock files after changes

### Testing Framework Migration
- **Phase 1**: Install Vitest alongside Jest
- **Phase 2**: Migrate test files one component at a time
- **Phase 3**: Remove Jest configuration and dependencies

### Dependency Update Order
1. Security patches (regardless of breaking changes)
2. Minor version updates (backward compatible)
3. Major version updates (potentially breaking)
4. Development dependencies last (less critical)

## Identified Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tauri plugin incompatibility | High | High | Test build after plugin updates |
| React 19 breaking changes | Medium | High | Separate branch for React updates |
| Lock file desync | Medium | Medium | Automated verification scripts |
| Test suite instability during migration | Low | High | Parallel Jest/Vitest execution |

## Dependencies for Implementation

### Required Tools
- npm (for audit functionality)
- bun (primary package manager)  
- depcheck (unused dependency detection)
- vitest (new testing framework)

### Configuration Files to Update
- package.json (scripts, dependencies)
- bun.lockb (Bun lock file)
- jest.config.cjs → vitest.config.ts
- tsconfig.json (test path updates)
- .github/workflows/* (CI pipeline updates)

## Conclusion

Research confirms feasibility of comprehensive dependency update with structured approach to manage complexity and risk. Critical success factors are maintaining dual package manager compatibility and isolating breaking changes into manageable tasks.