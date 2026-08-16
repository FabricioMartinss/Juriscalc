import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Build dedicado da extensão (Chrome Side Panel).
// Gera a pasta `extension/` pronta para "Carregar sem compactação" no chrome://extensions.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // caminhos relativos para funcionar como página chrome-extension://
  publicDir: 'extension-src', // copia manifest.json e background.js para a saída
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'extension',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'sidepanel.html'),
    },
  },
});
