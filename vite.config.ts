import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    hmr: {
      port: 5173,
      host: 'localhost',
      clientPort: 5173,
      overlay: false
    },
    allowedHosts: ['localhost', '.replit.dev', '.repl.co', '.replit.app']
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  },
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});