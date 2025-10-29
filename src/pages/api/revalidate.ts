// src/pages/api/revalidate.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const path = url.searchParams.get('path');

    // Validar secret
    const expectedSecret = import.meta.env.REVALIDATE_SECRET || 'seu_secret_aqui';
    
    if (secret !== expectedSecret) {
      return new Response(
        JSON.stringify({ 
          revalidated: false, 
          error: 'Token inválido' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!path) {
      return new Response(
        JSON.stringify({ 
          revalidated: false, 
          error: 'Path é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔄 Revalidando cache para:', path);

    // CRITICAL: No Vercel, com SSR (prerender=false), não há cache estático
    // Precisamos usar On-Demand ISR apenas se a página for prerendered
    // Como /catalogo está em SSR, não há cache para revalidar
    
    // Solução: Forçar reload do browser via header
    return new Response(
      JSON.stringify({ 
        revalidated: true,
        message: 'SSR page - no static cache to revalidate',
        path,
        timestamp: new Date().toISOString(),
        note: 'Changes will appear on next request (browser reload)'
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Revalidated': 'true'
        } 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro ao revalidar:', error);
    return new Response(
      JSON.stringify({ 
        revalidated: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

export const POST = GET;