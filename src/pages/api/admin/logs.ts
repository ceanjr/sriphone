// src/pages/api/admin/logs.ts
import type { APIRoute } from 'astro';
import { verifyAuth } from '../../../lib/auth';
import { getRecentLogs, cleanOldLogs } from '../../../lib/logger';

export const prerender = false;

/**
 * GET - Buscar logs recentes
 */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obter parâmetro de limite (padrão: 60)
    const limit = parseInt(url.searchParams.get('limit') || '60');

    // Limpar logs antigos antes de buscar
    await cleanOldLogs();

    // Buscar logs
    const { data, error } = await getRecentLogs(limit);

    if (error) {
      console.error('Erro ao buscar logs:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao buscar logs'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        total: data?.length || 0
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao buscar logs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * DELETE - Limpar logs antigos manualmente
 */
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { success, error } = await cleanOldLogs();

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao limpar logs antigos'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logs antigos removidos com sucesso'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao limpar logs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
