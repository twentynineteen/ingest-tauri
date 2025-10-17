/**
 * AI Autocue Prompts and Tools
 * Feature: 006-i-wish-to
 * Purpose: Predefined formatting instructions and tool definitions
 * Based on: specs/006-i-wish-to/data-model.md section 6
 */

import { tool } from 'ai'
import { z } from 'zod'

// ============================================================================
// Autocue Prompt (v1.0.0)
// ============================================================================

export const AUTOCUE_PROMPT = `You are an expert teleprompter script formatter at a prestigious business school, specializing in adapting video scripts for autocue delivery.

Your goal is to take scripts that read well on paper but may not flow naturally when read aloud on an iPad-based autocue system. The autocue scrolls at a fixed speed, so your formatting must ensure the script feels natural, engaging, and easy to read aloud, while allowing the presenter to breathe comfortably and emphasize key ideas.

Because playback speed cannot change, you use line breaks, pauses, and spacing to guide pacing and emphasis — ensuring the presenter sounds composed, confident, and engaging.

You must:

Preserve all text content exactly as written — never rewrite or alter the meaning.

Format for rhythm and delivery, ensuring the script supports a smooth, confident performance.

Highlight important keywords that help guide tone and emphasis.

Structure line breaks and spacing so the script feels balanced and readable on-screen. Ensure that line breaks are double spaced for the autocue to read the gap appropriately.

Formatting Guidelines:

Use bold to highlight key words or short phrases for emphasis.

Insert [PAUSE] for natural or dramatic pauses.

Insert [END] at the end of the script.

Break long sentences into shorter, teleprompter-friendly lines (avoid more than 12-15 words per line).

Add consistent blank line spacing between paragraphs to signal a breathing moment.

Maintain a clear and steady rhythm — prioritize pacing and cadence over aesthetics.

Tone & Objective:

Aim for clarity, confidence, and conversational flow.

Imagine the presenter is addressing a live audience — formatting should help them sound natural and in control.

Avoid overusing bold or pause cues; use them strategically for rhythm and energy.`

export const PROMPT_VERSION = '1.0.0'

// ============================================================================
// Tool: Format Paragraph
// ============================================================================

export const formatParagraphTool = tool({
  description:
    'Reformat a paragraph for autocue readability with proper line breaks and capitalization',
  parameters: z.object({
    originalText: z.string().describe('The original paragraph text'),
    maxLineLength: z
      .number()
      .default(60)
      .describe('Maximum characters per line (default: 60)'),
    capitalizationStyle: z
      .enum(['upper', 'sentence', 'title'])
      .default('sentence')
      .describe('Capitalization style to apply')
  }),
  execute: async ({ originalText, maxLineLength, capitalizationStyle }) => {
    let formatted = originalText

    // Apply capitalization
    if (capitalizationStyle === 'upper') {
      formatted = formatted.toUpperCase()
    } else if (capitalizationStyle === 'title') {
      formatted = formatted.replace(/\b\w/g, char => char.toUpperCase())
    }

    // Break into lines
    const words = formatted.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if ((currentLine + ' ' + word).length > maxLineLength && currentLine.length > 0) {
        lines.push(currentLine.trim())
        currentLine = word
      } else {
        currentLine += (currentLine ? ' ' : '') + word
      }
    }
    if (currentLine) {
      lines.push(currentLine.trim())
    }

    return { formattedText: lines.join('\n') }
  }
})

// ============================================================================
// Tool: Add Timing Marks
// ============================================================================

export const addTimingMarksTool = tool({
  description: 'Insert pause marks and timing indicators for teleprompter pacing',
  parameters: z.object({
    text: z.string().describe('Text to add timing marks to'),
    pace: z
      .enum(['slow', 'medium', 'fast'])
      .default('medium')
      .describe('Reading pace (affects pause duration)'),
    pauseSymbol: z.string().default('[PAUSE]').describe('Symbol to use for pauses')
  }),
  execute: async ({ text, pace, pauseSymbol }) => {
    // Calculate pause duration based on pace
    const pauseDuration = pace === 'slow' ? 2 : pace === 'medium' ? 1 : 0.5

    // Add pauses at sentence boundaries
    let marked = text.replace(/\.\s+/g, `. ${pauseSymbol} `)

    // Add shorter pauses at commas
    const shortPause = pauseSymbol.replace('[', '[SHORT-')
    marked = marked.replace(/,\s+/g, `, ${shortPause} `)

    return {
      markedText: marked,
      pauseDuration
    }
  }
})

// ============================================================================
// Tool: Highlight Names (ALL CAPS)
// ============================================================================

export const highlightNamesCapsTool = tool({
  description: 'Convert names and proper nouns to ALL CAPS for emphasis',
  parameters: z.object({
    text: z.string().describe('Text to process'),
    namesToCapitalize: z
      .array(z.string())
      .describe('List of names/proper nouns to capitalize')
      .optional()
      .default([]),
    autoDetect: z
      .boolean()
      .default(true)
      .describe('Auto-detect capitalized words as names')
  }),
  execute: async ({ text, namesToCapitalize, autoDetect }) => {
    let result = text

    // Capitalize provided names
    for (const name of namesToCapitalize) {
      const regex = new RegExp(`\\b${name}\\b`, 'gi')
      result = result.replace(regex, name.toUpperCase())
    }

    // Auto-detect names (words that start with capital letter)
    if (autoDetect) {
      result = result.replace(/\b[A-Z][a-z]+\b/g, match => {
        // Skip common words
        const commonWords = [
          'The',
          'A',
          'An',
          'In',
          'On',
          'At',
          'To',
          'For',
          'And',
          'But',
          'Or'
        ]
        if (commonWords.includes(match)) {
          return match
        }
        return match.toUpperCase()
      })
    }

    return { processedText: result }
  }
})

// ============================================================================
// Tool: Remove Unnecessary Formatting
// ============================================================================

export const removeUnnecessaryFormattingTool = tool({
  description:
    'Strip formatting that hinders autocue reading (colors, fonts, complex styling)',
  parameters: z.object({
    html: z.string().describe('HTML content to clean'),
    preserveTags: z
      .array(z.string())
      .default(['strong', 'em', 'h1', 'h2', 'h3', 'p', 'br'])
      .describe('HTML tags to preserve')
  }),
  execute: async ({ html, preserveTags }) => {
    // Create regex to match tags NOT in preserveTags
    const allowedTagsPattern = preserveTags.join('|')
    const removeTagsRegex = new RegExp(`<(?!/?(?:${allowedTagsPattern})\\b)[^>]+>`, 'gi')

    // Remove unwanted tags
    const cleaned = html.replace(removeTagsRegex, '')

    // Remove inline styles
    const noInlineStyles = cleaned.replace(/\s+style="[^"]*"/gi, '')

    // Remove class attributes
    const noClasses = noInlineStyles.replace(/\s+class="[^"]*"/gi, '')

    // Clean up multiple spaces
    const normalized = noClasses.replace(/\s+/g, ' ').trim()

    return { cleanedHtml: normalized }
  }
})

// ============================================================================
// Tool Collection
// ============================================================================

export const autocueFormattingTools = {
  formatParagraph: formatParagraphTool,
  addTimingMarks: addTimingMarksTool,
  highlightNamesCaps: highlightNamesCapsTool,
  removeUnnecessaryFormatting: removeUnnecessaryFormattingTool
}

// ============================================================================
// Tool Definitions for Storage
// ============================================================================

export const TOOL_DEFINITIONS = [
  {
    name: 'formatParagraph',
    description: 'Reformat paragraphs for autocue readability',
    enabled: true
  },
  {
    name: 'addTimingMarks',
    description: 'Add timing marks for pacing',
    enabled: true
  },
  {
    name: 'highlightNamesCaps',
    description: 'Capitalize proper nouns',
    enabled: true
  },
  {
    name: 'removeUnnecessaryFormatting',
    description: 'Clean distracting formatting',
    enabled: true
  }
]
