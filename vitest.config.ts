import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    // Both suites run together: the app's logic under tests/, and the router
    // Worker's failover decisions under workers/. They are separate TypeScript
    // projects but there is no reason to run them as separate commands.
    include: ['tests/**/*.test.ts', 'workers/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    // Mirrors the `@/*` path in tsconfig.json. Declared by hand rather than
    // via vite-tsconfig-paths — one line against one more dependency.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
