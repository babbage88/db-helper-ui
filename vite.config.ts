import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import { visualizer } from "rollup-plugin-visualizer";
import react from '@vitejs/plugin-react'
import fs from 'fs';



// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/react-router-dom/')
            ) {
              return '@framework-core';
            }
            if (id.includes('react-select')) {
              return 'react-select';
            }
            if (id.includes('react-hook-form')) {
              return 'react-hook-form';
            }
            if (id.includes('zod')) {
              return 'zod';
            }
            if (id.includes('tailwind-merge')) {
              return 'tailwind-merge';
            }
            if (id.includes('xterm')) {
              return 'xterm';
            }
            if (id.includes('axios')) {
              return 'axios';
            }
            if (id.includes('tanstack')) {
              return 'tanstack';
            }
            if (id.includes('sonner')) {
              return 'sonner';
            }
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
            if (id.includes('radix-ui')) {
              return 'radix-ui';
            }
          }
        
        }
      }
    }
  },
  plugins: [react(), tailwindcss(), visualizer({ open: false, filename: "bundle-analysis.html" })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/frontend.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/frontend.crt')),
    },
    fs: { strict: false }
  },
})
