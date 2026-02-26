/**
 * Test setup
 * Set environment variables before any module loads
 */

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing'
process.env.JWT_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.DB_USER = 'testuser'
process.env.DB_PASSWORD = 'testpass'
process.env.DB_NAME = 'testdb'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DATABASE_URL = 'postgresql://testuser:testpass@localhost:5432/testdb'
process.env.CORS_ORIGIN = 'http://localhost:3000'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake'
process.env.XENDIT_SECRET_KEY = 'xnd_test_fake'
process.env.XENDIT_WEBHOOK_TOKEN = 'webhook_test_fake'
process.env.LOG_LEVEL = 'silent'
