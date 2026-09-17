import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main Process entry
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            rollupOptions: {
              external: ['electron', 'node:path', 'node:fs', 'node:os', 'node:child_process']
            }
          },
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, './shared'),
              '@electron': path.resolve(__dirname, './electron')
            }
          }
        }
      },
      {
        // Preload Script entry
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: 'inline',
            rollupOptions: {
              external: ['electron']
            }
          },
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, './shared')
            }
          }
        }
      }
    ])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@electron': path.resolve(__dirname, './electron')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
