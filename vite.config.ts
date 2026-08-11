import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

// Cloudflare Web Analytics.
//
// O site é servido pela Netlify e não passa pelo proxy da Cloudflare, então a
// Cloudflare não enxerga o tráfego sozinha: a medição depende inteiramente
// deste script no HTML.
//
// Duas escolhas de propósito:
//
// - Só no build (`apply: 'build'`). Em `npm run dev` o beacon contaria os
//   acessos de localhost junto com os reais e sujaria o painel.
// - Só quando o token existe. Assim um build sem a variável configurada
//   continua passando, em vez de publicar um `data-cf-beacon` vazio.
//
// O roteamento em SPA não precisa de configuração: o próprio beacon mede cada
// troca de rota do react-router.
//
// Fica só neste config, e não no da extensão, de propósito. As páginas da
// extensão têm `script-src 'self'` na CSP do manifest — um script vindo de
// static.cloudflareinsights.com seria bloqueado lá.
function cloudflareWebAnalytics(token: string): Plugin {
  return {
    name: 'cloudflare-web-analytics',
    apply: 'build',
    transformIndexHtml: () =>
      token
        ? [
            {
              tag: 'script',
              attrs: {
                // `type="module"` é a forma que a Cloudflare publica hoje: já
                // adia a execução como `defer` e deixa navegadores antigos de
                // fora do script.
                type: 'module',
                src: 'https://static.cloudflareinsights.com/beacon.min.js',
                'data-cf-beacon': JSON.stringify({token}),
              },
              injectTo: 'body',
            },
          ]
        : [],
  };
}

export default defineConfig(({mode}) => {
  // Prefixo vazio para ler tanto o .env.local quanto as variáveis do build da
  // Netlify. O token do beacon é público — aparece no HTML de todas as
  // páginas —, mas fica em variável para poder mudar sem commit e para não
  // existir em dev.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      cloudflareWebAnalytics(env.CF_BEACON_TOKEN ?? ''),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
