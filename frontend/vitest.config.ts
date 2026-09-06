import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    exclude: ['node_modules', '.next', 'e2e'],
    // Compartilha o jsdom entre arquivos em vez de recriá-lo por arquivo —
    // suite ainda pequena, mas evita o custo crescer proporcional aos testes.
    isolate: false,
  },
})
