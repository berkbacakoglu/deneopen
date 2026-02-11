import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 60_000,
  webServer: [
    {
      command: 'corepack pnpm --filter @apps/api dev',
      cwd: '../..',
      port: 3001,
      reuseExistingServer: true
    },
    {
      command: 'corepack pnpm dev',
      cwd: __dirname,
      port: 3000,
      reuseExistingServer: true
    }
  ],
  use: {
    baseURL: 'http://127.0.0.1:3000'
  }
});
