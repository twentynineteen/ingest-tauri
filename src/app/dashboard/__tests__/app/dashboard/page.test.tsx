import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import React from 'react'
import Page from '../../../page'

// Explicitly require the external mock file to avoid JSX parsing issues
jest.mock('@components/components/ui/sidebar', () =>
  require('../../../../../__mocks__/sidebarMock')
)

// Mock the breadcrumb store before tests run
jest.mock('../../../../../store/useBreadcrumbStore.ts', () => ({
  useBreadcrumbStore: () => ({
    breadcrumbs: [
      { href: '/', label: 'Home' },
      { href: '/dashboard', label: 'Dashboard' }
    ]
  })
}))

describe('Page Component', () => {
  it('should render the Page component with Breadcrumb items', () => {
    render(<Page />)

    // Confirm sidebar content appears
    expect(screen.getByText(/AppSidebar/i)).toBeInTheDocument()

    // Confirm breadcrumb list items render
    const breadcrumbItems = screen.getAllByRole('listitem')
    expect(breadcrumbItems).toHaveLength(2)
  })
})
