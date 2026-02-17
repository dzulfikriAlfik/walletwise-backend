/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Request error', { method: req.method, path: req.path, message: error.message })

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
import { ValidationError } from '../utils/errors.js'
