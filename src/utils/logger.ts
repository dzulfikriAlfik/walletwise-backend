/**
 * Logger utility
 * Simple logging with levels
 */

import { env } from '@/config/env'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
}

const currentLogLevel = LOG_LEVEL_MAP[env.LOG_LEVEL.toLowerCase()] ?? LogLevel.INFO

const formatLog = (level: string, message: string, data?: unknown): string => {
  const timestamp = new Date().toISOString()
  if (data) {
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}`
  }
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`
}

export const logger = {
  debug: (message: string, data?: unknown): void => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.log(formatLog('debug', message, data))
    }
  },

  info: (message: string, data?: unknown): void => {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log(formatLog('info', message, data))
    }
  },

  warn: (message: string, data?: unknown): void => {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(formatLog('warn', message, data))
    }
  },

  error: (message: string, data?: unknown): void => {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(formatLog('error', message, data))
    }
  },
}

export default logger
