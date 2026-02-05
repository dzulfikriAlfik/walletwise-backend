/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express'
import { AppError } from '@/utils/errors'
import { logger } from '@/utils/logger'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`Error on ${req.method} ${req.path}`, error.message)
  console.error('Full error:', error)

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && { details: error.details }),
      },
    })
    return
  }

  // Unhandled error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  })
}

// Type fix for ValidationError
import { ValidationError } from '@/utils/errors'
