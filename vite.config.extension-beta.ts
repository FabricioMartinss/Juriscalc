import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Build da extensão BETA (DARE + FEDTJ + GRD).
// Gera a pasta `extension-beta/`, separada da `extension/` oficial — carregue
// as duas em perfis diferentes do Chrome (ou desative uma antes de testar a
// outra) para não misturar as duas versões.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  publicDir: 'extension-src-beta',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'extension-beta',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'sidepanel.html'),
    },
  },
});
