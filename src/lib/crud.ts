// ============================================
// CATEGORIAS - CORRIGIDO
// ============================================

export async function getCategorias() {
  try {
    const response = await fetch('/api/admin/categorias');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao buscar categorias');
    }
    
    // ✅ CORRIGIDO: A API retorna { success, data }
    // Então devemos retornar result direto, não result.data
    return {
      success: true,
      data: result.data || [] // result.data já é o array de categorias
    };
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao buscar categorias',
      data: []
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
    
    // ✅ Retornar result direto (já tem success e data)
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

    // ✅ Retornar result direto
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

    // ✅ Retornar result direto
    return result;
  } catch (error: any) {
    console.error('Erro ao deletar categoria:', error);
    return { success: false, error: error.message || 'Erro ao deletar categoria' };
  }
}