// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
console.log('PUBLIC_SUPABASE_URL:', import.meta.env.PUBLIC_SUPABASE_URL);
console.log('PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing!');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.error('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'OK' : 'MISSING');
  throw new Error('Supabase credentials are required. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
  }
});

// Tipos do banco de dados
export interface Product {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  preco: number;
  condicao: 'Novo' | 'Seminovo';
  bateria: number;
  categoria_id: string;
  categoria?: Category;
  imagens: string[];
  created_at: string;
}

export interface Category {
  id: string;
  nome: string;
  created_at: string;
}

// Funções de Produtos
export const productService = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from('produtos')
      .select(
        `
        id,
        codigo,
        nome,
        descricao,
        preco,
        condicao,
        bateria,
        categoria_id,
        imagens,
        created_at,
        categoria:categorias(id, nome, created_at)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar produto por ID:', error);
      return null;
    }
    let categoria: Category | undefined = undefined;
    if (data && Array.isArray(data.categoria) && data.categoria.length > 0) {
      categoria = data.categoria[0];
    }
    return { ...data, categoria } as Product & { categoria: Category };
  },

  async getAll() {
    const { data, error } = await supabase
      .from('produtos')
      .select(
        `
        id,
        codigo,
        nome,
        descricao,
        preco,
        condicao,
        bateria,
        categoria_id,
        imagens,
        created_at,
        categoria:categorias(id, nome, created_at)
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      ...item,
      categoria: Array.isArray(item.categoria) && item.categoria.length > 0 ? item.categoria[0] : undefined
    })) as (Product & { categoria: Category })[];
  },

  async getPaginated(cursor?: string | null, limit: number = 30) {
    let query = supabase
      .from('produtos')
      .select(
        `
        id,
        codigo,
        nome,
        descricao,
        preco,
        condicao,
        bateria,
        categoria_id,
        imagens,
        created_at,
        categoria:categoria_id(id, nome, created_at)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const produtos = (data ?? []).map((item: any) => ({
      ...item,
      categoria: item.categoria || undefined
    })) as (Product & { categoria: Category })[];
    return {
      produtos,
      nextCursor: produtos.length === limit ? produtos[produtos.length - 1].created_at : null
    };
  },

  async getByCategory(categoriaId: string, cursor?: string | null, limit: number = 30) {
    let query = supabase
      .from('produtos')
      .select(
        `
        id,
        codigo,
        nome,
        descricao,
        preco,
        condicao,
        bateria,
        categoria_id,
        imagens,
        created_at,
        categoria:categoria_id(id, nome, created_at)
      `
      )
      .eq('categoria_id', categoriaId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const produtos = (data ?? []).map((item: any) => ({
      ...item,
      categoria: item.categoria || undefined
    })) as (Product & { categoria: Category })[];
    return {
      produtos,
      nextCursor: produtos.length === limit ? produtos[produtos.length - 1].created_at : null
    };
  },

  async getPaginatedOffset(page: number = 0, limit: number = 30) {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('produtos')
      .select(
        `
        id,
        codigo,
        nome,
        descricao,
        preco,
        condicao,
        bateria,
        categoria_id,
        imagens,
        created_at,
        categoria:categorias(id, nome, created_at)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const produtos = (data ?? []).map((item: any) => ({
      ...item,
      categoria: Array.isArray(item.categoria) && item.categoria.length > 0 ? item.categoria[0] : undefined
    })) as (Product & { categoria: Category })[];
    return { 
      data: produtos, 
      count: count || 0,
      hasMore: count ? (to < count - 1) : false
    };
  },

  async create(product: Omit<Product, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('produtos')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async update(id: string, product: Partial<Product>) {
    const { data, error } = await supabase
      .from('produtos')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async delete(id: string) {
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('imagens').getPublicUrl(filePath);
    return data.publicUrl;
  },
};

// Funções de Categorias
export const categoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome, created_at')
      .order('nome');

    if (error) throw error;
    return data as Category[];
  },

  async create(nome: string) {
    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome }])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async update(id: string, nome: string) {
    const { data, error } = await supabase
      .from('categorias')
      .update({ nome })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async delete(id: string) {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) throw error;
  },
};

// Autenticação - MELHORADO
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    console.log('[authService] Iniciando logout...');

    try {
      // 1. Limpar sessão do Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[authService] Erro ao fazer logout no Supabase:', error);
      } else {
        console.log('[authService] ✅ Logout do Supabase concluído');
      }
    } catch (error) {
      console.error('[authService] Exceção ao fazer logout:', error);
    }

    // 2. Limpar TODOS os tokens do localStorage manualmente e de forma síncrona
    if (typeof window !== 'undefined') {
      try {
        console.log('[authService] Limpando localStorage...');
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-auth-time');

        // Limpar todas as chaves que começam com 'sb-' por segurança
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        console.log('[authService] ✅ localStorage limpo');
      } catch (error) {
        console.error('[authService] Erro ao limpar localStorage:', error);
      }
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
    
    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
    
    return data.user;
  },

  onAuthStateChange(callback: (session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    
    return subscription;
  },

  // Verifica se está autenticado (método mais rápido)
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null && session.expires_at ? session.expires_at * 1000 > Date.now() : false;
  }
};