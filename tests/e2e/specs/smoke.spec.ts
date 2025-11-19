import { test, expect } from '../fixtures/app.fixture'
import { setupTauriMocks } from '../fixtures/mocks.fixture'

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupTauriMocks(page)
  })

  test('app loads successfully', async ({ appReady }) => {
    // Verify the page loaded
    await expect(appReady).toHaveTitle(/Bucket/)
  })

  test('main navigation is visible', async ({ appReady }) => {
    // Check for main navigation elements
    // Adjust selectors based on your app's actual structure
    const sidebar = appReady.locator('[data-testid="sidebar"], nav, aside')
    await expect(sidebar.first()).toBeVisible()
  })

  test('no console errors on initial load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await setupTauriMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out expected errors (e.g., missing Tauri API in browser)
    const unexpectedErrors = errors.filter(
      (error) =>
        !error.includes('__TAURI__') &&
        !error.includes('Failed to fetch') &&
        !error.includes('net::ERR')
    )

    expect(unexpectedErrors).toHaveLength(0)
  })

  test('app responds to window resize', async ({ appReady }) => {
    // Test responsive behavior
    await appReady.setViewportSize({ width: 1920, height: 1080 })
    await expect(appReady.locator('body')).toBeVisible()

    await appReady.setViewportSize({ width: 768, height: 1024 })
    await expect(appReady.locator('body')).toBeVisible()

    await appReady.setViewportSize({ width: 375, height: 667 })
    await expect(appReady.locator('body')).toBeVisible()
  })
})

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setupTauriMocks(page)
  })

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Check for login form elements
    const loginForm = page.locator(
      'form, [data-testid="login-form"], [data-testid="auth-form"]'
    )
    await expect(loginForm.first()).toBeVisible()
  })
})
