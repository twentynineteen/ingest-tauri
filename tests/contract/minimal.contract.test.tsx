import React from 'react'
import { renderWithQueryClient } from '../utils/query-test-utils.ts'
import { queryKeys } from '../../src/lib/query-keys'

describe('Minimal Contract Test', () => {
  it('should use renderWithQueryClient utility', () => {
    const SimpleComponent = () => React.createElement('div', null, 'Test')
    const { queryClient } = renderWithQueryClient(React.createElement(SimpleComponent))
    
    expect(queryClient).toBeDefined()
  })

  it('should access query keys', () => {
    const queryKey = queryKeys.user.breadcrumb()
    expect(queryKey).toEqual(['user', 'breadcrumb'])
  })
})