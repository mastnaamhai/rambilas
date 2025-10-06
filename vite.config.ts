import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://your-backend-domain.com')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              pdf: ['jspdf', 'html2canvas'],
              utils: ['xlsx', 'jszip', 'pako']
            }
          }
        },
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      },
      server: {
        port: 5173,
        host: true,
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:8080',
            changeOrigin: true,
            secure: false
          },
          // Add proxy for GST API to handle CORS issues
          '/gst-api': {
            target: 'https://sheet.gstincheck.co.in',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/gst-api/, ''),
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('Proxying GST API request:', req.url);
              });
            }
          }
        }
      }
    };
});
