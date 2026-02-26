/**
 * Unit tests for env config
 */

import '../setup'

describe('Environment Config', () => {
  it('should load env vars from process.env', async () => {
    const { env } = await import('../../src/config/env')

    expect(env.NODE_ENV).toBe('test')
    expect(env.PORT).toBe(3000)
    expect(env.JWT_SECRET).toBeDefined()
    expect(env.JWT_REFRESH_SECRET).toBeDefined()
    expect(env.DB_HOST).toBeDefined()
    expect(env.DB_NAME).toBeDefined()
    expect(env.DB_USER).toBeDefined()
  })

  it('should have correct default values', async () => {
    const { env } = await import('../../src/config/env')

    expect(env.JWT_EXPIRES_IN).toBe('15m')
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe('7d')
    expect(env.LOG_LEVEL).toBeDefined()
  })

  it('should parse PORT as number', async () => {
    const { env } = await import('../../src/config/env')
    expect(typeof env.PORT).toBe('number')
  })

  it('should have CORS_ORIGIN defined', async () => {
    const { env } = await import('../../src/config/env')
    expect(env.CORS_ORIGIN).toBeDefined()
    expect(typeof env.CORS_ORIGIN).toBe('string')
  })

  it('should have DATABASE_URL', async () => {
    const { env } = await import('../../src/config/env')
    expect(env.DATABASE_URL).toContain('postgresql://')
  })
})
