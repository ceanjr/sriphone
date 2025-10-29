// CRUD COM API ROUTES - USA SUPABASE ADMIN (BYPASSA RLS)

// ============================================
// CATEGORIAS
// ============================================

export async function getCategorias() {
  try {
    const response = await fetch('/api/admin/categorias');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao buscar categorias');
    }
    
    // ✅ CORRIGIDO: Garante que sempre retorna { success, data }
    return {
      success: true,
      data: result.data || result.categorias || [] // Aceita ambos os formatos
    };
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao buscar categorias',
      data: [] // Sempre retorna array vazio em caso de erro
    };
  }
}

export async function criarCategoria(nome: string) {
  try {
    if (!nome || nome.trim() === '') {
      console.log('[criarCategoria] Nome vazio ou inválido:', nome);
      return { success: false, error: 'Nome é obrigatório' };
    }

    console.log('[criarCategoria] Enviando para API:', nome.trim());
    const response = await fetch('/api/admin/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim() }),
    });

    let result = null;
    const text = await response.text();
    console.log('[criarCategoria] Resposta da API:', text);
    
    if (text) {
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.log('[criarCategoria] Erro ao parsear resposta:', e);
        throw new Error('Resposta inválida da API: ' + text);
      }
    }
    
    if (!response.ok) {
      throw new Error((result && result.error) || 'Erro ao criar categoria');
    }
    
    return result;
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    return { success: false, error: error.message || 'Erro ao criar categoria' };
  }
}

export async function editarCategoria(id: string, nome: string) {
  try {
    if (!id) {
      console.log('[editarCategoria] ID vazio:', id);
      return { success: false, error: 'ID é obrigatório' };
    }
    if (!nome || nome.trim() === '') {
      console.log('[editarCategoria] Nome vazio ou inválido:', nome);
      return { success: false, error: 'Nome é obrigatório' };
    }

    console.log('[editarCategoria] Enviando para API:', id, nome.trim());
    const response = await fetch(`/api/admin/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim() }),
    });

    const result = await response.json();
    console.log('[editarCategoria] Resposta da API:', result);

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao editar categoria');
    }

    return result;
  } catch (error: any) {
    console.error('Erro ao editar categoria:', error);
    return { success: false, error: error.message || 'Erro ao editar categoria' };
  }
}

export async function deletarCategoria(id: string) {
  try {
    if (!id) {
      console.log('[deletarCategoria] ID vazio:', id);
      return { success: false, error: 'ID é obrigatório' };
    }

    console.log('[deletarCategoria] Enviando para API:', id);
    const response = await fetch(`/api/admin/categorias/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    console.log('[deletarCategoria] Resposta da API:', result);

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao deletar categoria');
    }

    return result;
  } catch (error: any) {
    console.error('Erro ao deletar categoria:', error);
    return { success: false, error: error.message || 'Erro ao deletar categoria' };
  }
}