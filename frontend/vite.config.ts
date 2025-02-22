import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/(login|signup|protected|refresh|admin-panel|admin-panel-users|change-password|predict|import-csv|recent-imports|upload-profile-pic|change-username)': {
        target: 'http://192.168.0.103:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
