import React from 'react'
import { render } from '@testing-library/react'

describe('Simple JSX Test', () => {
  it('should render JSX', () => {
    const { container } = render(<div>Hello World</div>)
    expect(container.textContent).toBe('Hello World')
  })
})