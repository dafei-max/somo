import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('\x1b[31m[proxy error]\x1b[0m', err.message);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('\x1b[36m[proxy →]\x1b[0m', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(
              `\x1b[36m[proxy ←]\x1b[0m`,
              proxyRes.statusCode,
              req.method,
              req.url
            );
          });
        },
      },
    },
  },
});
