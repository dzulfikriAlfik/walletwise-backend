/**
 * Validation Helper
 * Utilities for handling Zod validation errors
 */

import type { ZodError } from 'zod'

/**
 * Format Zod validation errors into a structured object
 */
export const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {}
  
  error.issues.forEach((issue) => {
    const field = issue.path.join('.')
    if (!errors[field]) {
      errors[field] = []
    }
    errors[field].push(issue.message)
  })
  
  return errors
}
