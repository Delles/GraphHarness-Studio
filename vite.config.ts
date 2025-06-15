import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron to find assets correctly
  build: {
    outDir: 'dist/renderer' // Output renderer code to a subfolder
  }
});
