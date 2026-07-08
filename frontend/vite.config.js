import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000, // KB
  },
  plugins: [
    react(),
    nodePolyfills(), // Ye library ab automatically 'events' aur 'util' handle kar legi
   ],
   define: {
    global: 'window', // Sirf ye line hi kaafi hoti hai simple-peer ke liye
  },
});