import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 20000,
    env: { ADMIN_EMAIL: 'admin@example.com', JWT_SECRET: 'test-secret-test-secret-test-secret-1234', CLIENT_ORIGIN: 'http://localhost:5173' },
  },
});
