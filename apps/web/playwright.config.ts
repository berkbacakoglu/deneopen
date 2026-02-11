import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 30_000,
  webServer: {
    command: 'pnpm dev',
    cwd: __dirname,
    port: 3000,
    reuseExistingServer: true
  },
  use: {
    baseURL: 'http://127.0.0.1:3000'
  }
});
