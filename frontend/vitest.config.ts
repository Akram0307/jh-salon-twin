import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/__tests__/**/*.test.[jt]s?(x)'],
    exclude: ['node_modules/**', 'dist/**', 'playwright_checks/**', '.vitepress/**', 'cypress/**', '{*.{test,spec}.{js,ts,jsx,tsx},test.{js,ts,jsx,tsx}}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 70,
        lines: 70,
        functions: 70,
        statements: 70
      }
    }
  }
})
