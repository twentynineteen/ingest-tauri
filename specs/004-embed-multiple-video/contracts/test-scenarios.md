# Test Scenarios: Multiple Video Links and Trello Cards

**Feature**: 004-embed-multiple-video
**Date**: 2025-09-30
**Status**: Phase 1 Design

## Overview

This document defines contract test scenarios for validating the multiple video/Trello card functionality. Tests follow TDD principles: RED-GREEN-Refactor.

---

## Test Infrastructure & Mocking

### Mock Strategy

**Tauri Commands**: Use `@tauri-apps/api/mocks` for frontend tests
**Trello API**: Use MSW (Mock Service Worker) - already configured in `tests/setup/msw-server.ts`
**Sprout Video API**: Use MSW handlers
**File System**: Use in-memory mock file system or temp directories

### Required Test Setup

**1. Tauri Mocks** (`tests/setup/tauri-mocks.ts`):
```typescript
import { mockIPC } from '@tauri-apps/api/mocks'
import { BreadcrumbsFile, VideoLink, TrelloCard } from '@/types/baker'

export function setupTauriMocks() {
  // Mock breadcrumbs file storage (in-memory)
  const mockBreadcrumbsStore = new Map<string, BreadcrumbsFile>()

  mockIPC((cmd, args) => {
    switch (cmd) {
      case 'baker_get_video_links':
        const breadcrumbs = mockBreadcrumbsStore.get(args.projectPath)
        return breadcrumbs?.videoLinks ?? []

      case 'baker_associate_video_link':
        const existing = mockBreadcrumbsStore.get(args.projectPath) || createEmptyBreadcrumbs()
        existing.videoLinks = [...(existing.videoLinks ?? []), args.videoLink]
        mockBreadcrumbsStore.set(args.projectPath, existing)
        return existing

      case 'baker_remove_video_link':
        const b = mockBreadcrumbsStore.get(args.projectPath)!
        b.videoLinks?.splice(args.videoIndex, 1)
        return b

      // ... other commands
      default:
        throw new Error(`Unmocked Tauri command: ${cmd}`)
    }
  })

  return {
    setBreadcrumbs: (path: string, breadcrumbs: BreadcrumbsFile) => {
      mockBreadcrumbsStore.set(path, breadcrumbs)
    },
    getBreadcrumbs: (path: string) => mockBreadcrumbsStore.get(path),
    clearMocks: () => mockBreadcrumbsStore.clear()
  }
}
```

**2. Trello API Mocks** (`tests/setup/trello-handlers.ts`):
```typescript
import { http, HttpResponse } from 'msw'

export const trelloHandlers = [
  // Mock successful card fetch
  http.get('https://api.trello.com/1/cards/:cardId', ({ params, request }) => {
    const { cardId } = params
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('key')
    const token = url.searchParams.get('token')

    // Simulate auth failure
    if (apiKey === 'invalid' || token === 'invalid') {
      return new HttpResponse(null, { status: 401 })
    }

    // Return mock card data
    return HttpResponse.json({
      id: cardId,
      name: `Mock Card ${cardId}`,
      desc: 'Mock description',
      url: `https://trello.com/c/${cardId}/mock-card`,
      idBoard: 'mock-board-id'
    })
  }),

  // Mock board fetch
  http.get('https://api.trello.com/1/boards/:boardId', ({ params }) => {
    return HttpResponse.json({
      id: params.boardId,
      name: 'Mock Board Name'
    })
  }),

  // Mock card not found
  http.get('https://api.trello.com/1/cards/nonexistent', () => {
    return new HttpResponse(null, { status: 404 })
  })
]
```

**3. Sprout Video API Mocks** (`tests/setup/sprout-handlers.ts`):
```typescript
import { http, HttpResponse } from 'msw'

export const sproutHandlers = [
  // Mock video upload
  http.post('https://api.sproutvideo.com/v1/videos', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.includes('Bearer')) {
      return new HttpResponse(null, { status: 401 })
    }

    // Simulate successful upload
    return HttpResponse.json({
      id: 'mock-video-id-' + Date.now(),
      title: 'Mock Video Title',
      created_at: new Date().toISOString(),
      duration: 120,
      assets: {
        poster_frames: [
          'https://cdn.sproutvideo.com/mock/frame_0000.jpg'
        ]
      },
      embed_code: '<iframe src="..."></iframe>',
      embedded_url: 'https://sproutvideo.com/videos/mock-id'
    })
  }),

  // Mock video fetch
  http.get('https://api.sproutvideo.com/v1/videos/:videoId', ({ params }) => {
    return HttpResponse.json({
      id: params.videoId,
      title: `Mock Video ${params.videoId}`,
      assets: {
        poster_frames: ['https://cdn.sproutvideo.com/mock/frame.jpg']
      }
    })
  })
]
```

**4. MSW Server Setup** (extend existing `tests/setup/msw-server.ts`):
```typescript
import { setupServer } from 'msw/node'
import { trelloHandlers } from './trello-handlers'
import { sproutHandlers } from './sprout-handlers'

export const server = setupServer(...trelloHandlers, ...sproutHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**5. Test Utilities** (`tests/utils/test-helpers.ts`):
```typescript
import { BreadcrumbsFile } from '@/types/baker'

export function createTestBreadcrumbs(overrides?: Partial<BreadcrumbsFile>): BreadcrumbsFile {
  return {
    projectTitle: 'Test Project',
    numberOfCameras: 2,
    files: [],
    parentFolder: '/test/parent',
    createdBy: 'test@example.com',
    creationDateTime: '2025-01-20T10:00:00.000Z',
    ...overrides
  }
}

export function createMockVideoLink(overrides?: Partial<VideoLink>): VideoLink {
  return {
    url: 'https://sproutvideo.com/videos/test123',
    title: 'Test Video',
    ...overrides
  }
}

export function createMockTrelloCard(overrides?: Partial<TrelloCard>): TrelloCard {
  return {
    url: 'https://trello.com/c/testcard/project',
    cardId: 'testcard',
    title: 'Test Card',
    ...overrides
  }
}

export function writeBreadcrumbsFile(path: string, breadcrumbs: BreadcrumbsFile): void {
  // Implementation depends on test approach:
  // - For unit tests: Use Tauri mocks
  // - For integration tests: Use temp directory with fs
}

export function readBreadcrumbsFile(path: string): BreadcrumbsFile {
  // Read from mock storage or temp directory
}
```

---

## Contract Tests (MUST fail initially)

### 1. VideoLink Validation

**Test File**: `tests/contract/video_link_validation.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { validateVideoLink } from '@/utils/validation'
import { createMockVideoLink } from '../utils/test-helpers'

describe('VideoLink Validation Contract', () => {
  describe('Valid VideoLink', () => {
    it('should accept valid HTTPS video URL', () => {
      const link: VideoLink = {
        url: 'https://sproutvideo.com/videos/abc123',
        title: 'Test Video'
      }

      const errors = validateVideoLink(link)
      expect(errors).toHaveLength(0)
    })

    it('should accept all optional fields when provided', () => {
      const link: VideoLink = {
        url: 'https://sproutvideo.com/videos/abc123',
        sproutVideoId: 'abc123',
        title: 'Test Video',
        thumbnailUrl: 'https://cdn.sproutvideo.com/frame.jpg',
        uploadDate: '2025-01-20T14:22:00.000Z',
        sourceRenderFile: 'final-edit.mp4'
      }

      const errors = validateVideoLink(link)
      expect(errors).toHaveLength(0)
    })
  })

  describe('Invalid VideoLink', () => {
    it('should reject non-HTTPS URL', () => {
      const link: VideoLink = {
        url: 'http://sproutvideo.com/videos/abc123',
        title: 'Test Video'
      }

      const errors = validateVideoLink(link)
      expect(errors).toContain('Video URL must use HTTPS')
    })

    it('should reject empty title', () => {
      const link: VideoLink = {
        url: 'https://sproutvideo.com/videos/abc123',
        title: ''
      }

      const errors = validateVideoLink(link)
      expect(errors).toContain('Video title is required')
    })

    it('should reject title exceeding 200 characters', () => {
      const link: VideoLink = {
        url: 'https://sproutvideo.com/videos/abc123',
        title: 'a'.repeat(201)
      }

      const errors = validateVideoLink(link)
      expect(errors).toContain('Video title exceeds maximum length (200 characters)')
    })

    it('should reject URL exceeding 2048 characters', () => {
      const link: VideoLink = {
        url: 'https://sproutvideo.com/videos/' + 'a'.repeat(2048),
        title: 'Test'
      }

      const errors = validateVideoLink(link)
      expect(errors).toContain('Video URL exceeds maximum length (2048 characters)')
    })

    it('should reject non-HTTPS thumbnail URL', () => {
      const link: VideoLink = {
        url: 'https://sproutvideo.com/videos/abc123',
        title: 'Test',
        thumbnailUrl: 'http://cdn.sproutvideo.com/frame.jpg'
      }

      const errors = validateVideoLink(link)
      expect(errors).toContain('Thumbnail URL must use HTTPS')
    })

    it('should reject invalid ISO 8601 upload date', () => {
      const link: VideoLink = {
        url: 'https://sproutvideo.com/videos/abc123',
        title: 'Test',
        uploadDate: '2025-01-20 14:22:00' // Invalid format (missing T)
      }

      const errors = validateVideoLink(link)
      expect(errors).toContain('Upload date must be in ISO 8601 format')
    })
  })

  describe('Array Size Limits', () => {
    it('should reject adding 21st video link', async () => {
      const projectPath = '/path/to/test/project'

      // Setup: Create breadcrumbs with 20 video links
      const breadcrumbs = createTestBreadcrumbs({
        videoLinks: Array(20).fill(null).map((_, i) => ({
          url: `https://sproutvideo.com/videos/video${i}`,
          title: `Video ${i}`
        }))
      })

      // Attempt to add 21st link
      const result = await invoke('baker_associate_video_link', {
        projectPath,
        videoLink: {
          url: 'https://sproutvideo.com/videos/video20',
          title: 'Video 20'
        }
      })

      expect(result).rejects.toMatch(/exceeds maximum.*20/)
    })
  })
})
```

---

### 2. TrelloCard Validation

**Test File**: `tests/contract/trello_card_validation.test.ts`

```typescript
describe('TrelloCard Validation Contract', () => {
  describe('Valid TrelloCard', () => {
    it('should accept valid Trello URL and extract card ID', () => {
      const card: TrelloCard = {
        url: 'https://trello.com/c/abc12345/project-name',
        cardId: 'abc12345',
        title: 'Test Card'
      }

      const errors = validateTrelloCard(card)
      expect(errors).toHaveLength(0)
    })

    it('should accept all optional fields', () => {
      const card: TrelloCard = {
        url: 'https://trello.com/c/abc12345/project-name',
        cardId: 'abc12345',
        title: 'Test Card',
        boardName: 'Video Projects',
        lastFetched: '2025-01-20T10:00:00.000Z'
      }

      const errors = validateTrelloCard(card)
      expect(errors).toHaveLength(0)
    })
  })

  describe('Invalid TrelloCard', () => {
    it('should reject non-Trello URL', () => {
      const card: TrelloCard = {
        url: 'https://example.com/card/123',
        cardId: '123',
        title: 'Test'
      }

      const errors = validateTrelloCard(card)
      expect(errors).toContain('Invalid Trello card URL format')
    })

    it('should reject mismatched card ID', () => {
      const card: TrelloCard = {
        url: 'https://trello.com/c/abc12345/project',
        cardId: 'xyz99999', // Doesn't match URL
        title: 'Test'
      }

      const errors = validateTrelloCard(card)
      expect(errors).toContain('Card ID does not match URL')
    })

    it('should reject empty title', () => {
      const card: TrelloCard = {
        url: 'https://trello.com/c/abc12345/project',
        cardId: 'abc12345',
        title: ''
      }

      const errors = validateTrelloCard(card)
      expect(errors).toContain('Trello card title is required')
    })

    it('should reject title exceeding 200 characters', () => {
      const card: TrelloCard = {
        url: 'https://trello.com/c/abc12345/project',
        cardId: 'abc12345',
        title: 'a'.repeat(201)
      }

      const errors = validateTrelloCard(card)
      expect(errors).toContain('Trello card title exceeds maximum length (200 characters)')
    })

    it('should reject duplicate card IDs in same breadcrumbs', async () => {
      const projectPath = '/path/to/test/project'

      // Setup: Breadcrumbs with existing card
      const breadcrumbs = createTestBreadcrumbs({
        trelloCards: [{
          url: 'https://trello.com/c/abc12345/existing',
          cardId: 'abc12345',
          title: 'Existing Card'
        }]
      })

      // Attempt to add duplicate card ID
      const result = invoke('baker_associate_trello_card', {
        projectPath,
        trelloCard: {
          url: 'https://trello.com/c/abc12345/duplicate',
          cardId: 'abc12345',
          title: 'Duplicate Card'
        }
      })

      expect(result).rejects.toMatch(/already exists|duplicate/i)
    })
  })

  describe('Array Size Limits', () => {
    it('should reject adding 11th Trello card', async () => {
      const projectPath = '/path/to/test/project'

      // Setup: Breadcrumbs with 10 cards
      const breadcrumbs = createTestBreadcrumbs({
        trelloCards: Array(10).fill(null).map((_, i) => ({
          url: `https://trello.com/c/card${i}/project`,
          cardId: `card${i}`,
          title: `Card ${i}`
        }))
      })

      // Attempt to add 11th card
      const result = invoke('baker_associate_trello_card', {
        projectPath,
        trelloCard: {
          url: 'https://trello.com/c/card10/project',
          cardId: 'card10',
          title: 'Card 10'
        }
      })

      expect(result).rejects.toMatch(/exceeds maximum.*10/)
    })
  })
})
```

---

### 3. Backward Compatibility (Migration)

**Test File**: `tests/contract/backward_compatibility.test.ts`

```typescript
describe('Backward Compatibility Contract', () => {
  describe('Legacy Breadcrumbs (Pre-004)', () => {
    it('should read legacy breadcrumbs with single trelloCardUrl', async () => {
      // Setup: Create legacy breadcrumbs file
      const legacyBreadcrumbs = {
        projectTitle: 'Test Project',
        numberOfCameras: 2,
        files: [],
        parentFolder: '/path/to/parent',
        createdBy: 'user@example.com',
        creationDateTime: '2025-01-15T10:00:00.000Z',
        trelloCardUrl: 'https://trello.com/c/abc12345/project'
      }

      writeBreadcrumbsFile(testProjectPath, legacyBreadcrumbs)

      // Invoke get_trello_cards (should auto-migrate)
      const cards = await invoke<TrelloCard[]>('baker_get_trello_cards', {
        projectPath: testProjectPath
      })

      expect(cards).toHaveLength(1)
      expect(cards[0].url).toBe('https://trello.com/c/abc12345/project')
      expect(cards[0].cardId).toBe('abc12345')

      // Original file should remain unchanged (in-memory migration only)
      const fileContent = readBreadcrumbsFile(testProjectPath)
      expect(fileContent.trelloCards).toBeUndefined()
      expect(fileContent.trelloCardUrl).toBe('https://trello.com/c/abc12345/project')
    })

    it('should write new format with backward-compatible trelloCardUrl', async () => {
      // Add card to breadcrumbs
      await invoke('baker_associate_trello_card', {
        projectPath: testProjectPath,
        trelloCard: {
          url: 'https://trello.com/c/xyz789/new-card',
          cardId: 'xyz789',
          title: 'New Card'
        }
      })

      // Read file directly
      const fileContent = readBreadcrumbsFile(testProjectPath)

      // Should have both new and legacy fields
      expect(fileContent.trelloCards).toHaveLength(1)
      expect(fileContent.trelloCards[0].cardId).toBe('xyz789')
      expect(fileContent.trelloCardUrl).toBe('https://trello.com/c/xyz789/new-card')
    })

    it('should preserve trelloCardUrl when adding additional cards', async () => {
      // Setup: Breadcrumbs with one card
      const breadcrumbs = createTestBreadcrumbs({
        trelloCards: [{
          url: 'https://trello.com/c/first/card',
          cardId: 'first',
          title: 'First Card'
        }],
        trelloCardUrl: 'https://trello.com/c/first/card'
      })

      // Add second card
      await invoke('baker_associate_trello_card', {
        projectPath: testProjectPath,
        trelloCard: {
          url: 'https://trello.com/c/second/card',
          cardId: 'second',
          title: 'Second Card'
        }
      })

      // trelloCardUrl should still point to first card
      const fileContent = readBreadcrumbsFile(testProjectPath)
      expect(fileContent.trelloCardUrl).toBe('https://trello.com/c/first/card')
      expect(fileContent.trelloCards).toHaveLength(2)
    })
  })

  describe('New Breadcrumbs (Phase 004)', () => {
    it('should handle breadcrumbs with only new array fields', async () => {
      const newBreadcrumbs = {
        projectTitle: 'Test Project',
        numberOfCameras: 2,
        files: [],
        parentFolder: '/path/to/parent',
        createdBy: 'user@example.com',
        creationDateTime: '2025-01-20T10:00:00.000Z',
        videoLinks: [
          {
            url: 'https://sproutvideo.com/videos/abc',
            title: 'Video 1'
          }
        ],
        trelloCards: [
          {
            url: 'https://trello.com/c/xyz/card',
            cardId: 'xyz',
            title: 'Card 1'
          }
        ]
      }

      writeBreadcrumbsFile(testProjectPath, newBreadcrumbs)

      const videos = await invoke<VideoLink[]>('baker_get_video_links', {
        projectPath: testProjectPath
      })

      const cards = await invoke<TrelloCard[]>('baker_get_trello_cards', {
        projectPath: testProjectPath
      })

      expect(videos).toHaveLength(1)
      expect(cards).toHaveLength(1)
    })
  })
})
```

---

### 4. Tauri Command Contracts

**Test File**: `tests/contract/tauri_commands.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { setupTauriMocks } from '../setup/tauri-mocks'
import { createTestBreadcrumbs, createMockVideoLink } from '../utils/test-helpers'

describe('Tauri Command Contracts', () => {
  let tauriMocks: ReturnType<typeof setupTauriMocks>
  const testProjectPath = '/path/to/test/project'

  beforeEach(() => {
    tauriMocks = setupTauriMocks()
    // Setup initial breadcrumbs for testing
    tauriMocks.setBreadcrumbs(testProjectPath, createTestBreadcrumbs())
  })

  afterEach(() => {
    tauriMocks.clearMocks()
  })
  describe('baker_associate_video_link', () => {
    it('should add video link to empty videoLinks array', async () => {
      const videoLink: VideoLink = {
        url: 'https://sproutvideo.com/videos/test123',
        title: 'Test Video'
      }

      const result = await invoke<BreadcrumbsFile>('baker_associate_video_link', {
        projectPath: testProjectPath,
        videoLink
      })

      expect(result.videoLinks).toHaveLength(1)
      expect(result.videoLinks[0].url).toBe(videoLink.url)
      expect(result.lastModified).toBeDefined()
    })

    it('should append to existing videoLinks array', async () => {
      // Setup: Breadcrumbs with one video
      createTestBreadcrumbs({
        videoLinks: [{
          url: 'https://sproutvideo.com/videos/existing',
          title: 'Existing Video'
        }]
      })

      const newLink: VideoLink = {
        url: 'https://sproutvideo.com/videos/new',
        title: 'New Video'
      }

      const result = await invoke<BreadcrumbsFile>('baker_associate_video_link', {
        projectPath: testProjectPath,
        videoLink: newLink
      })

      expect(result.videoLinks).toHaveLength(2)
      expect(result.videoLinks[1].url).toBe(newLink.url)
    })

    it('should reject invalid project path', async () => {
      const result = invoke('baker_associate_video_link', {
        projectPath: '/nonexistent/path',
        videoLink: { url: 'https://example.com', title: 'Test' }
      })

      await expect(result).rejects.toMatch(/does not exist/)
    })
  })

  describe('baker_remove_video_link', () => {
    it('should remove video link at specified index', async () => {
      // Setup: Breadcrumbs with 3 videos
      createTestBreadcrumbs({
        videoLinks: [
          { url: 'https://sproutvideo.com/videos/video0', title: 'Video 0' },
          { url: 'https://sproutvideo.com/videos/video1', title: 'Video 1' },
          { url: 'https://sproutvideo.com/videos/video2', title: 'Video 2' }
        ]
      })

      const result = await invoke<BreadcrumbsFile>('baker_remove_video_link', {
        projectPath: testProjectPath,
        videoIndex: 1 // Remove middle video
      })

      expect(result.videoLinks).toHaveLength(2)
      expect(result.videoLinks[0].title).toBe('Video 0')
      expect(result.videoLinks[1].title).toBe('Video 2')
    })

    it('should reject out-of-bounds index', async () => {
      createTestBreadcrumbs({
        videoLinks: [{ url: 'https://example.com', title: 'Video' }]
      })

      const result = invoke('baker_remove_video_link', {
        projectPath: testProjectPath,
        videoIndex: 5
      })

      await expect(result).rejects.toMatch(/out of bounds/)
    })
  })

  describe('baker_reorder_video_links', () => {
    it('should move video from index 0 to index 2', async () => {
      createTestBreadcrumbs({
        videoLinks: [
          { url: 'https://example.com/v0', title: 'Video 0' },
          { url: 'https://example.com/v1', title: 'Video 1' },
          { url: 'https://example.com/v2', title: 'Video 2' }
        ]
      })

      const result = await invoke<BreadcrumbsFile>('baker_reorder_video_links', {
        projectPath: testProjectPath,
        fromIndex: 0,
        toIndex: 2
      })

      expect(result.videoLinks[0].title).toBe('Video 1')
      expect(result.videoLinks[1].title).toBe('Video 2')
      expect(result.videoLinks[2].title).toBe('Video 0')
    })
  })

  describe('baker_fetch_trello_card_details', () => {
    it('should fetch card details from Trello API', async () => {
      // MSW handler will intercept and mock this request
      const result = await invoke<TrelloCard>('baker_fetch_trello_card_details', {
        cardUrl: 'https://trello.com/c/testcard/project',
        apiKey: 'valid-key',
        apiToken: 'valid-token'
      })

      expect(result.cardId).toBe('testcard')
      expect(result.title).toBe('Mock Card testcard')
      expect(result.lastFetched).toBeTruthy()
    })

    it('should reject invalid API credentials', async () => {
      // MSW handler will return 401 for invalid credentials
      const result = invoke('baker_fetch_trello_card_details', {
        cardUrl: 'https://trello.com/c/testcard/project',
        apiKey: 'invalid',
        apiToken: 'invalid'
      })

      await expect(result).rejects.toMatch(/401|unauthorized|invalid credentials/i)
    })

    it('should handle 404 for nonexistent card', async () => {
      const result = invoke('baker_fetch_trello_card_details', {
        cardUrl: 'https://trello.com/c/nonexistent/project',
        apiKey: 'valid-key',
        apiToken: 'valid-token'
      })

      await expect(result).rejects.toMatch(/404|not found/i)
    })
  })
})
```

---

## Integration Tests

### 5. End-to-End Upload and Association

**Test File**: `tests/integration/video_upload_association.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { setupTauriMocks } from '../setup/tauri-mocks'
import { server } from '../setup/msw-server'

describe('Video Upload and Association Integration', () => {
  let tauriMocks: ReturnType<typeof setupTauriMocks>

  beforeEach(() => {
    tauriMocks = setupTauriMocks()
  })

  afterEach(() => {
    tauriMocks.clearMocks()
    server.resetHandlers()
  })

  it('should upload video to Sprout and associate with breadcrumbs', async () => {
    const testVideoPath = '/path/to/test/Renders/final-edit.mp4'
    const projectPath = '/path/to/test/project'

    // Execute upload_video_and_associate
    // MSW will mock the Sprout Video API call
    // Tauri mocks will handle breadcrumbs association
    const [sproutResponse, breadcrumbs] = await invoke<[SproutUploadResponse, BreadcrumbsFile]>(
      'upload_video_and_associate',
      {
        filePath: testVideoPath,
        apiKey: 'valid-sprout-key',
        projectPath,
        videoTitle: 'Test Upload'
      }
    )

    // Verify Sprout upload response (from MSW mock)
    expect(sproutResponse.id).toMatch(/^mock-video-id-/)
    expect(sproutResponse.assets.poster_frames).toHaveLength(1)
    expect(sproutResponse.assets.poster_frames[0]).toBe('https://cdn.sproutvideo.com/mock/frame_0000.jpg')

    // Verify breadcrumbs association
    expect(breadcrumbs.videoLinks).toHaveLength(1)
    expect(breadcrumbs.videoLinks[0].sproutVideoId).toBe(sproutResponse.id)
    expect(breadcrumbs.videoLinks[0].thumbnailUrl).toBe(sproutResponse.assets.poster_frames[0])
    expect(breadcrumbs.videoLinks[0].sourceRenderFile).toBe('final-edit.mp4')
  })

  it('should handle Sprout API authentication failure', async () => {
    const result = invoke('upload_video_and_associate', {
      filePath: '/path/to/video.mp4',
      apiKey: 'invalid-key',
      projectPath: '/test/project',
      videoTitle: 'Test'
    })

    await expect(result).rejects.toMatch(/401|unauthorized/i)
  })
})
```

---

## Baker Preview Tests

### 6. Baker Multi-Media Preview

**Test File**: `tests/integration/baker_preview.test.tsx`

```tsx
describe('Baker Multi-Media Preview', () => {
  it('should display all video thumbnails in preview', async () => {
    const breadcrumbs: BreadcrumbsFile = {
      // ... standard fields ...
      videoLinks: [
        {
          url: 'https://sproutvideo.com/videos/video1',
          title: 'Video 1',
          thumbnailUrl: 'https://cdn.sproutvideo.com/thumb1.jpg'
        },
        {
          url: 'https://sproutvideo.com/videos/video2',
          title: 'Video 2',
          thumbnailUrl: 'https://cdn.sproutvideo.com/thumb2.jpg'
        }
      ]
    }

    render(<BreadcrumbsViewer breadcrumbs={breadcrumbs} projectPath="/test" />)

    // Should render 2 video thumbnails
    const thumbnails = screen.getAllByRole('img', { name: /video thumbnail/i })
    expect(thumbnails).toHaveLength(2)

    // Should link to Sprout Video
    const videoLinks = screen.getAllByRole('link', { name: /view video/i })
    expect(videoLinks[0]).toHaveAttribute('href', 'https://sproutvideo.com/videos/video1')
    expect(videoLinks[1]).toHaveAttribute('href', 'https://sproutvideo.com/videos/video2')
  })

  it('should display all Trello card titles with links', async () => {
    const breadcrumbs: BreadcrumbsFile = {
      // ... standard fields ...
      trelloCards: [
        {
          url: 'https://trello.com/c/card1/pre-production',
          cardId: 'card1',
          title: 'Pre-Production',
          boardName: 'Projects 2025'
        },
        {
          url: 'https://trello.com/c/card2/post-production',
          cardId: 'card2',
          title: 'Post-Production',
          boardName: 'Projects 2025'
        }
      ]
    }

    render(<BreadcrumbsViewer breadcrumbs={breadcrumbs} projectPath="/test" />)

    // Should render 2 Trello cards
    expect(screen.getByText('Pre-Production')).toBeInTheDocument()
    expect(screen.getByText('Post-Production')).toBeInTheDocument()

    // Should link to Trello
    const trelloLinks = screen.getAllByRole('link', { name: /view trello card/i })
    expect(trelloLinks[0]).toHaveAttribute('href', 'https://trello.com/c/card1/pre-production')
    expect(trelloLinks[1]).toHaveAttribute('href', 'https://trello.com/c/card2/post-production')
  })
})
```

---

## Test Execution Order (TDD)

1. **Write Contract Tests** (RED phase) → All tests MUST fail initially
2. **Implement Data Models** (GREEN phase) → TypeScript + Rust structs
3. **Implement Validation Logic** (GREEN phase) → Make validation tests pass
4. **Implement Tauri Commands** (GREEN phase) → Make command tests pass
5. **Implement UI Components** (GREEN phase) → Make integration tests pass
6. **Refactor** → Optimize, extract helpers, improve readability

---

## Coverage Goals

- Contract tests: 100% (all validation rules)
- Integration tests: 90% (critical user flows)
- UI components: 80% (key user interactions)

---

## Mock Implementation Summary

### Tauri Backend Mocks
- **Location**: `tests/setup/tauri-mocks.ts`
- **Purpose**: Mock all `baker_*` Tauri commands for frontend testing
- **Strategy**: In-memory Map storage for breadcrumbs files
- **Usage**: Call `setupTauriMocks()` in `beforeEach`, provides methods to seed/clear mock data

### API Mocks (MSW)
- **Trello API**: `tests/setup/trello-handlers.ts`
  - Mock GET /1/cards/{cardId} → Returns card data
  - Mock GET /1/boards/{boardId} → Returns board data
  - Handles 401 (invalid credentials), 404 (nonexistent card)

- **Sprout Video API**: `tests/setup/sprout-handlers.ts`
  - Mock POST /v1/videos → Returns upload response with thumbnail URL
  - Mock GET /v1/videos/{videoId} → Returns video metadata
  - Handles 401 (invalid API key)

### Test Utilities
- **Location**: `tests/utils/test-helpers.ts`
- **Factory Functions**:
  - `createTestBreadcrumbs()` → Mock BreadcrumbsFile
  - `createMockVideoLink()` → Mock VideoLink
  - `createMockTrelloCard()` → Mock TrelloCard
- **File Helpers**:
  - `writeBreadcrumbsFile()` → Write to mock/temp storage
  - `readBreadcrumbsFile()` → Read from mock/temp storage

### Test Execution Flow

1. **Setup Phase** (beforeEach):
   ```typescript
   const tauriMocks = setupTauriMocks()
   tauriMocks.setBreadcrumbs('/test/path', createTestBreadcrumbs())
   ```

2. **Test Phase**:
   ```typescript
   // Invoke Tauri command (mocked)
   const result = await invoke('baker_associate_video_link', { ... })

   // API calls intercepted by MSW
   const card = await fetch('https://api.trello.com/1/cards/abc')
   ```

3. **Cleanup Phase** (afterEach):
   ```typescript
   tauriMocks.clearMocks()
   server.resetHandlers()
   ```

### Rust Backend Tests (Cargo)

For Rust unit tests (not mocked, using real file I/O):
- **Location**: `src-tauri/src/baker.rs` (inline `#[cfg(test)]` modules)
- **Strategy**: Use `tempfile` crate for temporary test directories
- **Example**:
  ```rust
  #[cfg(test)]
  mod tests {
      use super::*;
      use tempfile::tempdir;

      #[tokio::test]
      async fn test_baker_associate_video_link() {
          let temp_dir = tempdir().unwrap();
          let project_path = temp_dir.path().to_str().unwrap();

          // Create test breadcrumbs file
          let breadcrumbs = BreadcrumbsFile { /* ... */ };
          std::fs::write(
              format!("{}/breadcrumbs.json", project_path),
              serde_json::to_string_pretty(&breadcrumbs).unwrap()
          ).unwrap();

          // Test command
          let result = baker_associate_video_link(
              project_path.to_string(),
              VideoLink { /* ... */ }
          ).await;

          assert!(result.is_ok());
      }
  }
  ```

**Next**: See `quickstart.md` for user workflow documentation