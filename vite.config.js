import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En desarrollo las llamadas a /api pasan al backend de Spring Boot, así no hace falta CORS
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
