import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // required for Docker to expose the dev server
    port: 5173,
    allowedHosts: true, // allow any hostname (covers Docker, reverse proxies, custom hostnames)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
