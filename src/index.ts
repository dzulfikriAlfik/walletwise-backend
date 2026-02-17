/**
 * Application entry point
 * Bootstrap order: load-env (on import) → connect DB → start server
 */

import { envLoadResult } from './config/load-env.js' // Must be first: loads .env and logs which file
import { connectDatabase } from './config/database.js'
import app from './app.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'

// 1. Env loaded by load-env (already logged); log bootstrap
logger.info('Env bootstrap', { envFile: envLoadResult.path ?? '(none, process.env only)', nodeEnv: env.NODE_ENV })

async function main() {
  // 2. Connect to database (logs connection status)
  await connectDatabase()

  // 3. Start HTTP server
  const PORT = env.PORT
  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`)
    logger.info('Bootstrap complete', { env: env.NODE_ENV, port: PORT })
  })

  // Graceful shutdown
  const shutdown = () => {
    logger.warn('Shutdown signal received: closing HTTP server')
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((err) => {
  logger.error('Startup failed', { error: err instanceof Error ? err.message : String(err) })
  process.exit(1)
})
