import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        globals: true,
        include: ['test/**/*.test.{ts,tsx}', 'test/**/*.spec.{ts,tsx}'],
        exclude: ['node_modules', '.next', 'e2e'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname),
        },
    },
})
