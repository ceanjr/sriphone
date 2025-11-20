// @ts-check
// Config alternativo para preview local com Node adapter
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://sriphonevca.com.br',
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  image: {
    domains: ['supabase.co', 'supabase.storage'],
    remotePatterns: [{
      protocol: 'https',
      hostname: '**.supabase.co',
    }],
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689,
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
    },
  },

  compressHTML: true,
});
