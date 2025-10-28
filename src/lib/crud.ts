// CRUD DIRETO COM SUPABASE - SEM API ROUTES
// Zero possibilidade de erros de JSON!

import { supabase } from './supabase';

// ============================================
// CATEGORIAS
// ============================================

export async function getCategorias() {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error);
    return { success: false, error: error.message || 'Erro ao buscar categorias' };
  }
}

export async function criarCategoria(nome: string) {
  try {
    if (!nome || nome.trim() === '') {
      return { success: false, error: 'Nome é obrigatório' };
    }

    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome: nome.trim() }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Categoria já existe' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    return { success: false, error: error.message || 'Erro ao criar categoria' };
  }
}

export async function editarCategoria(id: string, nome: string) {
  try {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }
    
    if (!nome || nome.trim() === '') {
      return { success: false, error: 'Nome é obrigatório' };
    }

    const { data, error } = await supabase
      .from('categorias')
      .update({ nome: nome.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Categoria já existe' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao editar categoria:', error);
    return { success: false, error: error.message || 'Erro ao editar categoria' };
  }
}

export async function deletarCategoria(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return { success: false, error: 'Categoria em uso por produtos' };
      }
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar categoria:', error);
    return { success: false, error: error.message || 'Erro ao deletar categoria' };
  }
}

// ============================================
// PRODUTOS
// ============================================

export async function getProdutos() {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, categoria:categoria_id(id, nome)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return { success: false, error: error.message || 'Erro ao buscar produtos' };
  }
}

export async function criarProduto(produto: any) {
  try {
    if (!produto.nome || produto.nome.trim() === '') {
      return { success: false, error: 'Nome é obrigatório' };
    }
    
    if (!produto.codigo || produto.codigo.trim() === '') {
      return { success: false, error: 'Código é obrigatório' };
    }
    
    if (!produto.preco || produto.preco <= 0) {
      return { success: false, error: 'Preço inválido' };
    }

    const { data, error } = await supabase
      .from('produtos')
      .insert([produto])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Produto já existe' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return { success: false, error: error.message || 'Erro ao criar produto' };
  }
}

export async function editarProduto(id: string, produto: any) {
  try {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }

    const { data, error } = await supabase
      .from('produtos')
      .update(produto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Produto já existe' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao editar produto:', error);
    return { success: false, error: error.message || 'Erro ao editar produto' };
  }
}

export async function deletarProduto(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error);
    return { success: false, error: error.message || 'Erro ao deletar produto' };
  }
}
