import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://sriphonevca.com.br',
  output: 'static',
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  vite: {
    define: {
      'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(
        process.env.PUBLIC_SUPABASE_URL
      ),
      'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.PUBLIC_SUPABASE_ANON_KEY
      ),
    },
    build: {
      minify: 'esbuild',
      target: 'esnext',
      chunkSizeWarningLimit: 1000,
    },
  },
});
