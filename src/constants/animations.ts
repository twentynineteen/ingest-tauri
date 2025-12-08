/**
 * Animation constants for BuildProject workflow
 * Centralizes timing and styling values for consistent animations
 */

export const STEP_CARD_ANIMATION = {
  // Heights for collapse/expand animation
  collapsedHeight: '60px',
  expandedHeight: '1000px',

  // Padding for collapse/expand animation
  collapsedPadding: '12px 16px',
  expandedPadding: '16px',

  // Animation timing
  duration: 900, // ms
  easing: 'ease-in-out'
} as const

export const SUCCESS_ANIMATION = {
  // Delay before showing success section (allows collapse animation to be visible)
  delay: 100, // ms

  // Success section fade-in animation
  fadeInDuration: 600, // ms
  fadeInEasing: 'ease-out'
} as const
