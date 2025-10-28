// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://sriphonevca.com.br',
  output: 'server',
  adapter: vercel(),
  
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
          drop_console: false, // Temporariamente habilitado para debug
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'supabase': ['@supabase/supabase-js'],
            'analytics': ['@vercel/analytics'],
          },
        },
      },
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
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
