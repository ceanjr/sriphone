// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  site: 'https://sriphonevca.com.br',
  output: 'static',
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
