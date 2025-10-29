import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

/**
 * Atualizar um produto existente
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tenta converter o corpo da requisição em JSON
    let produto;
    try {
      produto = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid or empty JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!produto || Object.keys(produto).length === 0) {
      return new Response(JSON.stringify({ error: 'No product data provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Valida campos obrigatórios
    if (!produto.nome || !produto.preco || !produto.categoria_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Atualiza o produto no banco
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .update({
        nome: produto.nome,
        codigo: produto.codigo || null,
        preco: produto.preco,
        bateria: produto.bateria || null,
        condicao: produto.condicao || 'Novo',
        categoria_id: produto.categoria_id,
        descricao: produto.descricao || null,
        imagens: produto.imagens?.length ? produto.imagens : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/produtos/[id]:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Deletar um produto
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabaseAdmin
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/produtos/[id]:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
