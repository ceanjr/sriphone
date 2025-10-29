// ============================================
// CATEGORIAS - CLIENT SIDE
// ============================================

async function getCategorias() {
  try {
    console.log('[getCategorias] Buscando categorias...');
    const response = await fetch('/api/admin/categorias');
    const text = await response.text();

    if (!text) throw new Error('Resposta vazia do servidor');
    const result = JSON.parse(text);

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao buscar categorias');
    }

    console.log('[getCategorias] Resultado:', result);
    return result;
  } catch (error) {
    console.error('[getCategorias] Erro:', error);
    return { success: false, error: error.message || 'Erro ao buscar categorias' };
  }
}

async function criarCategoria(nome) {
  try {
    if (!nome || nome.trim() === '') {
      console.warn('[criarCategoria] Nome vazio.');
      return { success: false, error: 'Nome é obrigatório' };
    }

    console.log('[criarCategoria] Enviando:', nome.trim());
    const response = await fetch('/api/admin/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim() }),
    });

    const text = await response.text();
    let result = null;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.warn('[criarCategoria] Resposta inválida:', text);
      throw new Error('Resposta inválida da API');
    }

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar categoria');
    }

    console.log('[criarCategoria] Criada com sucesso:', result);
    return result;
  } catch (error) {
    console.error('[criarCategoria] Erro:', error);
    return { success: false, error: error.message || 'Erro ao criar categoria' };
  }
}

async function editarCategoria(id, nome) {
  try {
    if (!id) return { success: false, error: 'ID é obrigatório' };
    if (!nome || nome.trim() === '')
      return { success: false, error: 'Nome é obrigatório' };

    console.log('[editarCategoria] Enviando:', id, nome.trim());
    const response = await fetch(`/api/admin/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim() }),
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao editar categoria');
    }

    console.log('[editarCategoria] Atualizada com sucesso:', result);
    return result;
  } catch (error) {
    console.error('[editarCategoria] Erro:', error);
    return { success: false, error: error.message || 'Erro ao editar categoria' };
  }
}

async function deletarCategoria(id) {
  try {
    if (!id) return { success: false, error: 'ID é obrigatório' };

    console.log('[deletarCategoria] Enviando:', id);
    const response = await fetch(`/api/admin/categorias/${id}`, {
      method: 'DELETE',
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao deletar categoria');
    }

    console.log('[deletarCategoria] Deletada com sucesso:', result);
    return result;
  } catch (error) {
    console.error('[deletarCategoria] Erro:', error);
    return { success: false, error: error.message || 'Erro ao deletar categoria' };
  }
}

// Expor globalmente
window.getCategorias = getCategorias;
window.criarCategoria = criarCategoria;
window.editarCategoria = editarCategoria;
window.deletarCategoria = deletarCategoria;

console.log('✅ categorias-client.js carregado com sucesso');
