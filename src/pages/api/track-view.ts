// src/pages/api/track-view.ts
// Registra visualização de usuário não autenticado
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();
    const { sessionId, pageUrl, referer } = body;

    // Validar sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'sessionId é obrigatório'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extrair user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Inserir visualização no banco
    const { error } = await supabase
      .from('site_views')
      .insert([{
        session_id: sessionId,
        page_url: pageUrl || '/',
        referer: referer || null,
        user_agent: userAgent,
        ip_address: clientAddress || null,
      }]);

    if (error) {
      console.error('Erro ao registrar visualização:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Visualização registrada'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
