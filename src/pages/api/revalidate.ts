// src/pages/api/revalidate.ts
// API para revalidar cache ISR após operações CRUD

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const path = url.searchParams.get('path');

    // Validar secret (defina em .env)
    const expectedSecret = import.meta.env.REVALIDATE_SECRET || 'seu_secret_aqui';
    
    if (secret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Path é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Revalidando cache para:', path);

    // Nota: O Vercel ISR é revalidado automaticamente no próximo acesso
    // Esta rota serve principalmente para logging e controle

    return new Response(
      JSON.stringify({ 
        success: true, 
        revalidated: true,
        path,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro ao revalidar:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST = GET; // Permitir POST também