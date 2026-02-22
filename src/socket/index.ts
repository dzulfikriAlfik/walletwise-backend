/**
 * Socket.IO server for realtime payment and subscription updates
 * No polling - clients listen for events
 */

import { Server } from 'socket.io'
import type { Server as HttpServer } from 'http'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const CORS_ORIGINS = env.CORS_ORIGIN.split(',').map((o) => o.trim())

export function initSocketIO(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
    path: '/socket.io',
  })

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined
    if (userId) {
      socket.join(`user:${userId}`)
      logger.debug('Socket connected', { socketId: socket.id, userId })
    }

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { socketId: socket.id })
    })
  })

  return io
}
