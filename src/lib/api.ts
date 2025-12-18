// Sistema centralizado de API - À prova de falhas
// Todos os requests passam por aqui

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Faz requisições à API com tratamento robusto de erros
 * Garante que sempre retorna um objeto válido, nunca lança exceção
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    console.log(`🔄 API Request: ${method} ${endpoint}`, body);

    // Preparar requisição
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      cache: 'no-store',
      credentials: 'same-origin',
    };

    // Adicionar body se necessário
    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Fazer requisição
    const response = await fetch(endpoint, fetchOptions);
    const status = response.status;

    console.log(`📥 API Response: ${status} ${response.statusText}`);

    // Ler o texto da resposta
    const text = await response.text();
    console.log(`📄 Response body: "${text}"`);

    // Se resposta vazia, retornar baseado no status
    if (!text || text.trim() === '') {
      if (response.ok) {
        return {
          success: true,
          status,
        };
      } else {
        return {
          success: false,
          error: `Erro ${status}: ${response.statusText}`,
          status,
        };
      }
    }

    // Tentar fazer parse do JSON
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return {
        success: false,
        error: `Resposta inválida do servidor: ${text.substring(0, 100)}`,
        status,
      };
    }

    // Se resposta OK (2xx)
    if (response.ok) {
      return {
        success: true,
        data,
        status,
      };
    }

    // Se erro (4xx, 5xx)
    return {
      success: false,
      error: data.error || data.message || `Erro ${status}`,
      status,
    };
  } catch (error: any) {
    console.error('❌ API Request failed:', error);
    return {
      success: false,
      error: error.message || 'Erro de conexão com o servidor',
    };
  }
}

// ============================================
// CATEGORIAS
// ============================================

export interface Categoria {
  id: string;
  nome: string;
  created_at?: string;
}

export async function getCategorias(): Promise<ApiResponse<Categoria[]>> {
  const result = await apiRequest<any>(
    '/api/admin/categorias'
  );

  if (result.success && result.data) {
    // API retorna { success, data }, então result.data = { success, data }
    // Precisamos acessar result.data.data para pegar o array
    const categorias = result.data.data || result.data || [];
    return {
      success: true,
      data: Array.isArray(categorias) ? categorias : [],
    };
  }

  return { success: false, error: result.error, data: [] };
}

export async function criarCategoria(nome: string): Promise<ApiResponse<Categoria>> {
  if (!nome || nome.trim() === '') {
    return {
      success: false,
      error: 'Nome da categoria é obrigatório',
    };
  }

  const result = await apiRequest<any>(
    '/api/admin/categorias',
    {
      method: 'POST',
      body: { nome: nome.trim() },
    }
  );

  if (result.success && result.data) {
    // API retorna { success, data }, então acessar result.data.data
    const categoria = result.data.data || result.data;
    return {
      success: true,
      data: categoria,
    };
  }

  return { success: false, error: result.error };
}

export async function editarCategoria(
  id: string,
  nome: string
): Promise<ApiResponse<Categoria>> {
  if (!id) {
    return {
      success: false,
      error: 'ID da categoria é obrigatório',
    };
  }

  if (!nome || nome.trim() === '') {
    return {
      success: false,
      error: 'Nome da categoria é obrigatório',
    };
  }

  const result = await apiRequest<any>(
    `/api/admin/categorias/${id}`,
    {
      method: 'PUT',
      body: { nome: nome.trim() },
    }
  );

  if (result.success && result.data) {
    const categoria = result.data.data || result.data;
    return {
      success: true,
      data: categoria,
    };
  }

  return { success: false, error: result.error };
}

export async function deletarCategoria(id: string): Promise<ApiResponse<void>> {
  if (!id) {
    return {
      success: false,
      error: 'ID da categoria é obrigatório',
    };
  }

  return await apiRequest(`/api/admin/categorias/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// PRODUTOS
// ============================================

export interface Produto {
  id: string;
  nome: string;
  codigo: string;
  preco: number;
  bateria?: number;
  condicao: string;
  categoria_id: string;
  descricao?: string;
  foto_principal?: string;
  created_at?: string;
}

export async function getProdutos(): Promise<ApiResponse<Produto[]>> {
  const result = await apiRequest<any>(
    '/api/admin/produtos'
  );

  if (result.success && result.data) {
    const produtos = result.data.data || result.data || [];
    return {
      success: true,
      data: Array.isArray(produtos) ? produtos : [],
    };
  }

  return { success: false, error: result.error, data: [] };
}

export async function criarProduto(dados: Partial<Produto>): Promise<ApiResponse<Produto>> {
  // Validações
  if (!dados.nome || dados.nome.trim() === '') {
    return {
      success: false,
      error: 'Nome do produto é obrigatório',
    };
  }

  if (!dados.preco || dados.preco <= 0) {
    return {
      success: false,
      error: 'Preço do produto é obrigatório',
    };
  }

  if (!dados.categoria_id) {
    return {
      success: false,
      error: 'Categoria do produto é obrigatória',
    };
  }

  const result = await apiRequest<any>(
    '/api/admin/produtos',
    {
      method: 'POST',
      body: dados,
    }
  );

  if (result.success && result.data) {
    const produto = result.data.data || result.data;
    return {
      success: true,
      data: produto,
    };
  }

  return { success: false, error: result.error };
}

export async function editarProduto(
  id: string,
  dados: Partial<Produto>
): Promise<ApiResponse<Produto>> {
  if (!id) {
    return {
      success: false,
      error: 'ID do produto é obrigatório',
    };
  }

  const result = await apiRequest<any>(
    `/api/admin/produtos/${id}`,
    {
      method: 'PUT',
      body: dados,
    }
  );

  if (result.success && result.data) {
    const produto = result.data.data || result.data;
    return {
      success: true,
      data: produto,
    };
  }

  return { success: false, error: result.error };
}

export async function deletarProduto(id: string): Promise<ApiResponse<void>> {
  if (!id) {
    return {
      success: false,
      error: 'ID do produto é obrigatório',
    };
  }

  return await apiRequest(`/api/admin/produtos/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// UPLOAD
// ============================================

export async function uploadImagem(file: File): Promise<ApiResponse<{ url: string }>> {
  if (!file) {
    return {
      success: false,
      error: 'Nenhum arquivo selecionado',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/admin/upload?t=${Date.now()}`, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store'
      }
    });

    const text = await response.text();
    
    if (!text) {
      return {
        success: response.ok,
        error: response.ok ? undefined : 'Resposta vazia do servidor',
      };
    }

    const data = JSON.parse(text);

    if (response.ok) {
      return {
        success: true,
        data,
      };
    }

    return {
      success: false,
      error: data.error || 'Erro ao fazer upload',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao fazer upload',
    };
  }
}
