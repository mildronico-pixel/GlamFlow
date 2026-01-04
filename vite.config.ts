import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    // Prevents crash if API_KEY is undefined during build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  }
});