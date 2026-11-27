import { defineConfig } from '@playwright/test'

const baseURL = process.env.STAGELIK_TEST_URL ?? 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  use: {
    baseURL,
    channel: process.env.STAGELIK_BROWSER_CHANNEL ?? 'chrome',
    screenshot: 'only-on-failure',
  },
})
