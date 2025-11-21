// src/pages/api/admin/produtos/[id]/index.ts
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { logProductAction } from '../../../../../lib/logger';

export const prerender = false;

// Helper para obter informações do request
function getRequestInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  return { userAgent, ipAddress };
}

// Helper para obter email do usuário autenticado
async function getUserEmail(cookies: any) {
  try {
    const sessionCookie = cookies.get('sb-access-token')?.value;
    if (!sessionCookie) return undefined;

    const payload = JSON.parse(atob(sessionCookie.split('.')[1]));
    return payload.email;
  } catch {
    return undefined;
  }
}

/**
 * PUT - Atualizar produto
 */
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

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

      // Log de erro: falha ao atualizar produto
      await logProductAction({
        action: 'update_product',
        productId: id || 'unknown',
        productName: produtoData.nome || 'unknown',
        userEmail,
        status: 'error',
        errorMessage: error.message,
        ipAddress,
        userAgent,
      });

      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Produto atualizado:', data);

    // Log de sucesso: produto atualizado
    await logProductAction({
      action: 'update_product',
      productId: data.id,
      productName: data.nome,
      userEmail,
      status: 'success',
      details: produtoData,
      ipAddress,
      userAgent,
    });

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

    // Log de erro: exceção não tratada
    await logProductAction({
      action: 'update_product',
      productId: id || 'unknown',
      productName: 'unknown',
      userEmail,
      status: 'error',
      errorMessage: error.message,
      ipAddress,
      userAgent,
    });

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * DELETE - Deletar produto
 */
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);
  const { id } = params;

  try {
    console.log('🗑️ DELETE /api/admin/produtos/' + id);

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro, buscar o produto para verificar se existe e obter o nome
    const { data: produto, error: fetchError } = await supabaseAdmin
      .from('produtos')
      .select('id, nome, imagens')
      .eq('id', id)
      .single();

    if (fetchError || !produto) {
      console.error('❌ Produto não encontrado:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Produto não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📦 Produto encontrado:', produto.nome);

    // Deletar o produto
    console.log('🗑️ Executando delete para ID:', id);
    const deleteResult = await supabaseAdmin
      .from('produtos')
      .delete()
      .eq('id', id);

    console.log('🗑️ Resultado do delete:', JSON.stringify(deleteResult, null, 2));

    if (deleteResult.error) {
      console.error('❌ Erro Supabase ao deletar:', deleteResult.error);

      // Log de erro: falha ao deletar produto
      await logProductAction({
        action: 'delete_product',
        productId: id,
        productName: produto.nome,
        userEmail,
        status: 'error',
        errorMessage: deleteResult.error.message,
        ipAddress,
        userAgent,
      });

      return new Response(
        JSON.stringify({ success: false, error: deleteResult.error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o produto ainda existe (para confirmar deleção)
    const { data: checkProduct } = await supabaseAdmin
      .from('produtos')
      .select('id')
      .eq('id', id)
      .single();

    if (checkProduct) {
      console.error('❌ Produto ainda existe após tentativa de deleção');
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao deletar produto - produto ainda existe' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Produto deletado com sucesso:', produto.nome);

    // Log de sucesso: produto deletado
    await logProductAction({
      action: 'delete_product',
      productId: id,
      productName: produto.nome,
      userEmail,
      status: 'success',
      ipAddress,
      userAgent,
    });

    // Revalidar cache
    try {
      await fetch(`${new URL(request.url).origin}/api/revalidate?secret=seu_secret_aqui&path=/catalogo`);
    } catch (e) {
      console.warn('⚠️ Erro ao revalidar cache:', e);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Produto "${produto.nome}" deletado com sucesso` }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    console.error('❌ Erro crítico em DELETE:', error);

    // Log de erro: exceção não tratada
    await logProductAction({
      action: 'delete_product',
      productId: id || 'unknown',
      productName: 'unknown',
      userEmail,
      status: 'error',
      errorMessage: error.message,
      ipAddress,
      userAgent,
    });

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