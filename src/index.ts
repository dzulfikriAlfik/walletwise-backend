/**
 * Application entry point
 */

import app from '@/app'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

const PORT = env.PORT

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`)
  logger.info(`Environment: ${env.NODE_ENV}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.warn('SIGINT signal received: closing HTTP server')
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })
})
