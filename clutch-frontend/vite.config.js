import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    proxy: {

      // ==========================================
      // IDENTITY SERVICE
      // ==========================================
      '/api/v1/admin': {
        target: 'http://identity-service:8081',
        changeOrigin: true,
      },

      '/api/v1/auth': {
        target: 'http://identity-service:8081',
        changeOrigin: true,
      },

      '/api/v1/colleges': {
        target: 'http://identity-service:8081',
        changeOrigin: true,
      },

      '/api/v1/users': {
        target: 'http://identity-service:8081',
        changeOrigin: true,
      },


      // ==========================================
      // ACADEMIC SERVICE
      // ==========================================
      '/api/v1/academic': {
        target: 'http://academic-service:8082',
        changeOrigin: true,
      },

      '/api/v1/attendance': {
        target: 'http://academic-service:8082',
        changeOrigin: true,
      },

      '/api/v1/sections': {
        target: 'http://academic-service:8082',
        changeOrigin: true,
      },

      '/api/v1/subjects': {
        target: 'http://academic-service:8082',
        changeOrigin: true,
      },

      '/api/v1/blocks': {
        target: 'http://academic-service:8082',
        changeOrigin: true,
      },


      // ==========================================
      // PLACEMENT SERVICE
      // ==========================================
      '/api/v1/placement': {
        target: 'http://placement-service:8083',
        changeOrigin: true,
      }
    }
  }
})