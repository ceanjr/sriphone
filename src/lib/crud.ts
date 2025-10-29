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
    
    return result;
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

    const response = await fetch('/api/admin/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim() }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar categoria');
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
      return { success: false, error: 'ID é obrigatório' };
    }
    
    if (!nome || nome.trim() === '') {
      return { success: false, error: 'Nome é obrigatório' };
    }

    const response = await fetch(`/api/admin/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim() }),
    });

    const result = await response.json();

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
      return { success: false, error: 'ID é obrigatório' };
    }

    const response = await fetch(`/api/admin/categorias/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao deletar categoria');
    }

    return result;
  } catch (error: any) {
    console.error('Erro ao deletar categoria:', error);
    return { success: false, error: error.message || 'Erro ao deletar categoria' };
  }
}

// ============================================
// PRODUTOS
// ============================================

export async function criarProduto(produto: any) {
  try {
    const response = await fetch('/api/admin/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produto),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar produto');
    }

    return result;
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

    const response = await fetch(`/api/admin/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produto),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao editar produto');
    }

    return result;
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

    const response = await fetch(`/api/admin/produtos/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao deletar produto');
    }

    return result;
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error);
    return { success: false, error: error.message || 'Erro ao deletar produto' };
  }
}

export async function getProdutos() {
  try {
    const response = await fetch('/api/admin/produtos');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao buscar produtos');
    }
    
    return result;
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return { success: false, error: error.message || 'Erro ao buscar produtos' };
  }
}
