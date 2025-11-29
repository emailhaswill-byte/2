import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Safely replace process.env.API_KEY with the string value
      // If env.API_KEY is undefined, it replaces with "undefined" (string) or undefined value, preventing crash
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '') 
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  };
});