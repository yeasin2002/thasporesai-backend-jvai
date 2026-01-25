import { afterAll, beforeAll, vi } from "vitest";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/jobsphere-test";
process.env.ACCESS_SECRET = "test-access-secret-key-for-testing-only";
process.env.REFRESH_SECRET = "test-refresh-secret-key-for-testing-only";
process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock_secret";

// Global test setup
beforeAll(() => {
  console.log("🧪 Starting test suite...");
});

// Global test teardown
afterAll(() => {
  console.log("✅ Test suite completed");
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  // Keep error for debugging
  error: console.error,
};
