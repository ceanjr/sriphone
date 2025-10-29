// src/pages/api/admin/produtos/index.ts
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    console.log('📋 GET /api/admin/produtos - Listando produtos...');

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select(`
        *,
        categorias (
          id,
          nome
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro Supabase:', error);
      throw error;
    }

    console.log('✅ Produtos encontrados:', data?.length || 0);

    return new Response(
      JSON.stringify({ success: true, data: data || [] }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro crítico em GET /api/admin/produtos:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao buscar produtos' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('📥 POST /api/admin/produtos - Iniciando...');
    
    const contentType = request.headers.get('content-type');
    console.log('📦 Content-Type:', contentType);
    
    if (!contentType?.includes('application/json')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Content-Type deve ser application/json' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const body = await request.text();
    console.log('📄 Body recebido (raw):', body.substring(0, 200));

    let produto: any;
    try {
      produto = JSON.parse(body);
      console.log('📦 Dados parseados:', produto);
    } catch (parseError: any) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `JSON inválido: ${parseError.message}` 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validações
    const errors: string[] = [];
    if (!produto.nome || produto.nome.trim() === '') {
      errors.push('Nome é obrigatório');
    }
    if (!produto.preco || isNaN(parseFloat(produto.preco))) {
      errors.push('Preço é obrigatório e deve ser um número');
    }
    if (!produto.categoria_id) {
      errors.push('Categoria é obrigatória');
    }

    if (errors.length > 0) {
      console.error('❌ Validação falhou:', errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errors.join(', '),
          details: errors
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Preparar dados
    const produtoData = {
      nome: produto.nome.trim(),
      codigo: produto.codigo?.trim() || null,
      preco: parseFloat(produto.preco),
      bateria: produto.bateria ? parseInt(produto.bateria) : null,
      condicao: produto.condicao || 'Novo',
      categoria_id: produto.categoria_id,
      descricao: produto.descricao?.trim() || null,
      imagens: Array.isArray(produto.imagens) ? produto.imagens : [],
      ativo: produto.ativo !== false,
    };

    console.log('💾 Salvando no Supabase:', produtoData);

    // Usar supabaseAdmin para bypassar RLS
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .insert([produtoData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro Supabase:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Erro ao criar produto',
          details: error
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Produto criado:', data);

    // CRITICAL: Com SSR, não há cache para revalidar
    // Resposta de sucesso
    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: 'Produto criado com sucesso!',
        note: 'Recarregue a página para ver as mudanças'
      }),
      { 
        status: 201, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro crítico em POST /api/admin/produtos:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor',
        stack: import.meta.env.DEV ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};