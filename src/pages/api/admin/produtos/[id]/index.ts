// src/pages/api/admin/produtos/[id]/index.ts
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const prerender = false;

/**
 * PUT - Atualizar produto
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    console.log('📝 PUT /api/admin/produtos/' + id);
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const produto = await request.json();
    console.log('📦 Dados recebidos:', produto);

    // Preparar dados
    const produtoData: any = {};
    if (produto.nome !== undefined) produtoData.nome = produto.nome.trim();
    if (produto.codigo !== undefined) produtoData.codigo = produto.codigo?.trim() || null;
    if (produto.preco !== undefined) produtoData.preco = parseFloat(produto.preco);
    if (produto.bateria !== undefined) produtoData.bateria = produto.bateria ? parseInt(produto.bateria) : null;
    if (produto.condicao !== undefined) produtoData.condicao = produto.condicao;
    if (produto.categoria_id !== undefined) produtoData.categoria_id = produto.categoria_id;
    if (produto.descricao !== undefined) produtoData.descricao = produto.descricao?.trim() || null;
    if (produto.imagens !== undefined) produtoData.imagens = Array.isArray(produto.imagens) ? produto.imagens : [];

    console.log('💾 Atualizando no Supabase:', produtoData);

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .update(produtoData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro Supabase:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Produto atualizado:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: 'Produto atualizado com sucesso!',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro crítico em PUT:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * DELETE - Deletar produto
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    console.log('🗑️ DELETE /api/admin/produtos/' + id);
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdmin
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro Supabase:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Produto deletado');

    // Revalidar cache
    try {
      await fetch(`${new URL(request.url).origin}/api/revalidate?secret=seu_secret_aqui&path=/catalogo`);
    } catch (e) {
      console.warn('⚠️ Erro ao revalidar cache:', e);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Erro crítico em DELETE:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Criar produto (arquivo separado)
export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('📥 POST /api/admin/produtos - Iniciando...');
    
    const produto = await request.json();
    console.log('📦 Dados recebidos:', produto);

    // Validações
    if (!produto.nome || !produto.preco || !produto.categoria_id) {
      console.error('❌ Validação falhou:', { produto });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Campos obrigatórios faltando: nome, preco, categoria_id' 
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
          error: error.message || 'Erro ao criar produto' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Produto criado:', data);

    // CRITICAL: Revalidar cache ISR
    try {
      await fetch(`${new URL(request.url).origin}/api/revalidate?secret=seu_secret_aqui&path=/catalogo`);
    } catch (e) {
      console.warn('⚠️ Erro ao revalidar cache:', e);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: 'Produto criado com sucesso!' 
      }),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro crítico em POST /api/admin/produtos:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};