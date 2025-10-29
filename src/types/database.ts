// Tipos compartilhados do banco de dados (Supabase)

export interface Categoria {
  id: string;
  nome: string;
  created_at: string;
}

export interface Produto {
  id: string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  preco: number;
  condicao: 'Novo' | 'Seminovo';
  bateria: number | null;
  categoria_id: string;
  imagens: string[];
  created_at: string;
}

export interface ProdutoComCategoria extends Produto {
  categoria: Categoria;
}

// Tipos de resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// Tipos para formulários
export type CategoriaFormData = Omit<Categoria, 'id' | 'created_at'>;

export type ProdutoFormData = Omit<Produto, 'id' | 'created_at'>;
