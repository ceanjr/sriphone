// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://sriphonevca.com.br',
  output: 'server', // Astro 5.x: usar 'server' com prerender seletivo
  adapter: vercel({
    // ISR no Vercel
    isr: true,
  }),
  
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
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
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

    // PWA optimizations
    server: {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  },
  // Compressão adicional
  compressHTML: true,
});