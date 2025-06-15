import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Use Vitest's global APIs (describe, test, expect, etc.)
    environment: 'node', // Or 'jsdom' if testing browser-like environments
    coverage: {
      provider: 'c8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      all: true, // Include all files in coverage analysis, not just tested ones
      include: ['src/**/*.ts'], // Glob patterns to include for coverage
      exclude: [ // Glob patterns to exclude from coverage
        'src/**/main.ts', // Exclude main Electron process setup
        'src/**/preload.ts', // Exclude preload script
        'src/**/*.d.ts', // Exclude type definition files
        'src/**/sync-service.ts', // Exclude the stubbed sync-service for now
        'src/scripts/**', // Exclude seeding scripts
        'src/data/**', // Exclude sample data
        // Add other files/patterns to exclude if necessary
      ],
    },
    // Optional: If you have global setup/teardown files
    // setupFiles: ['./vitest.setup.ts'],
    // globalSetup: ['./vitest.global-setup.ts'],
  },
});
