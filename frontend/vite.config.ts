import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], 
        },
      },
    },
    chunkSizeWarningLimit: 60000,
  },
  server: {
    proxy: {
      '^/(login|sign-up|protected|refresh|online-users|admin-panel|admin-panel-users|change-password|predict|import-csv|recent-imports|upload-profile-pic|change-username|logs)': {
        target: 'https://track-async-api.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
