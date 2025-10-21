// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static'; // MUDANÇA AQUI

export default defineConfig({
  site: 'https://sriphonevca.com.br',
  output: 'static', // Mantém static
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
      assetsDir: 'scripts', // Garante que os scripts vão para /scripts na saída
    },
  },
});
