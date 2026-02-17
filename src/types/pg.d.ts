/**
 * Ambient declaration for 'pg' module.
 * Ensures build succeeds even when @types/pg is not installed (e.g. production install).
 */
declare module 'pg' {
  interface PoolConfig {
    connectionString?: string
    [key: string]: unknown
  }

  class Pool {
    constructor(config?: PoolConfig)
    connect(): Promise<unknown>
    end(): Promise<void>
  }

  const pg: { Pool: typeof Pool }
  export default pg
}
