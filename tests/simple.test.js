// Simple test to verify Jest configuration
describe('Simple Jest Test', () => {
  it('should work with basic assertions', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to polyfills', () => {
    expect(typeof TextEncoder).toBe('function')
    expect(typeof global.crypto).toBe('object')
  })
})