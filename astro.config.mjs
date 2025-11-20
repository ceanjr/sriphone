// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://sriphonevca.com.br',
  output: 'server', // SSR com prerender seletivo
  adapter: vercel({
    // ISR habilitado para melhor performance
    isr: {
      // Cache de 5 minutos (300 segundos) para páginas dinâmicas
      expiration: 300,
      // Exclui rotas admin do ISR (sempre SSR puro)
      exclude: ['/api/admin/*', '/admin/*'],
    },
    // Configurações de edge functions para baixa latência
    edgeMiddleware: false,
    functionPerRoute: false, // Um bundle único é mais eficiente
  }),
  // adapter: node({ mode: 'standalone' }),
  
  // Otimização de imagens com Astro
  image: {
    domains: ['supabase.co', 'supabase.storage'],
    remotePatterns: [{
      protocol: 'https',
      hostname: '**.supabase.co',
    }],
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689, // ~16K x 16K
      }
    },
  },
  
  vite: {
    build: {
      assetsDir: '_astro',
      // Minificação apenas em produção
      minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
      terserOptions: process.env.NODE_ENV === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separar dependências grandes em chunks
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            if (id.includes('@vercel/analytics')) {
              return 'analytics';
            }
            // Separar módulos do catálogo
            if (id.includes('src/lib/catalog')) {
              if (id.includes('services')) return 'catalog-services';
              if (id.includes('render')) return 'catalog-render';
              if (id.includes('logic')) return 'catalog-logic';
              return 'catalog-core';
            }
            // Vendors comuns
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
    },

    // Development server configuration
    server: {
      // Configurações otimizadas para desenvolvimento
      host: true, // Permite acesso de qualquer host (incluindo ngrok)
      fs: {
        strict: false,
        allow: ['..'], // Permitir imports de fora do root
      },
      hmr: {
        overlay: false, // Desabilitar overlay que pode interferir com scripts
        protocol: 'ws',
        host: 'localhost',
      },
      watch: {
        // Melhorar performance do watch em sistemas WSL
        usePolling: false,
        interval: 100,
      },
    },

    // Otimizações para desenvolvimento
    optimizeDeps: {
      include: [
        '@supabase/supabase-js',
        '@vercel/analytics',
      ],
      // Forçar rebuild de dependências em dev para garantir versões atualizadas
      force: process.env.NODE_ENV === 'development',
    },

    // Logs mais limpos
    clearScreen: false,
  },
  // Compressão adicional
  compressHTML: true,
});