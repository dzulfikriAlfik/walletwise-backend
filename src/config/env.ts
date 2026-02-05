/**
 * Environment variables validation
 * Ensures all required env vars are set
 */

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key]
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value ?? defaultValue ?? ''
}

export const env = {
  // Server
  NODE_ENV: (getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  
  // Database
  DB_HOST: getEnv('DB_HOST', 'localhost'),
  DB_PORT: parseInt(getEnv('DB_PORT', '5432'), 10),
  DB_USER: getEnv('DB_USER'),
  DB_PASSWORD: getEnv('DB_PASSWORD', ''),
  DB_NAME: getEnv('DB_NAME'),
  
  // JWT
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  
  // CORS
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5173,http://localhost:3000'),
  
  // Logger
  LOG_LEVEL: getEnv('LOG_LEVEL', 'debug'),
} as const

export default env
