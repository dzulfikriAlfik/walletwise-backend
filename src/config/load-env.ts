/**
 * Environment loader with logging
 * Loads .env file and logs which file is used (must run before other imports)
 */

import { config } from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'

const cwd = process.cwd()
const nodeEnv = process.env.NODE_ENV || 'development'

const ENV_FILES = [
  path.join(cwd, `.env.${nodeEnv}.local`),
  path.join(cwd, `.env.${nodeEnv}`),
  path.join(cwd, '.env.local'),
  path.join(cwd, '.env'),
] as const

function findEnvFile(): string | null {
  for (const file of ENV_FILES) {
    try {
      if (fs.existsSync(file)) {
        return file
      }
    } catch {
      // ignore
    }
  }
  return null
}

export function loadEnv(): { path: string | null } {
  const envFile = findEnvFile()
  if (envFile) {
    const result = config({ path: envFile })
    if (result.error) {
      console.error(`[load-env] Failed to load ${envFile}:`, result.error.message)
    } else {
      console.log(`[load-env] Loaded env from: ${path.relative(cwd, envFile)} (abs: ${envFile})`)
    }
    return { path: envFile }
  }
  console.warn('[load-env] No .env file found, using process.env only. Tried:', ENV_FILES.map((f) => path.relative(cwd, f)).join(', '))
  return { path: null }
}

// Run on import so env is loaded before any module that uses process.env
export const envLoadResult = loadEnv()
