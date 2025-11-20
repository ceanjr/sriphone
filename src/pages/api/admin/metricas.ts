// src/pages/api/admin/metricas.ts
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    // Total de produtos
    const { data: produtos, error: prodError } = await supabaseAdmin
      .from('produtos')
      .select('id');

    if (prodError) throw prodError;

    const totalProdutos = produtos?.length || 0;

    // Total de visualizações do site (usuários não autenticados) no mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: totalVisualizacoes, error: viewsError } = await supabaseAdmin
      .from('site_views')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', inicioMes.toISOString());

    if (viewsError) {
      console.warn('Erro ao buscar visualizações (tabela pode não existir ainda):', viewsError);
    }

    // Produtos por categoria (contagem manual)
    const { data: categorias, error: catError } = await supabaseAdmin
      .from('categorias')
      .select('id, nome');

    if (catError) throw catError;

    // Contar produtos por categoria
    const categoriasComContagem = await Promise.all(
      (categorias || []).map(async (cat) => {
        const { count } = await supabaseAdmin
          .from('produtos')
          .select('id', { count: 'exact', head: true })
          .eq('categoria_id', cat.id);
        
        return {
          id: cat.id,
          nome: cat.nome,
          produtos_count: count || 0
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalProdutos,
        totalVisualizacoes, // Usar a variável calculada
        categorias: categoriasComContagem
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar métricas:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};