import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';



// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'frontend.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'frontend.crt')),
    },
  },
})
