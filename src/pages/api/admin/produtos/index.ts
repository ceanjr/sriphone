import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const prerender = false;

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