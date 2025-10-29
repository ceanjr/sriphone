// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { cache } from './cache';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing!');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.error('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'OK' : 'MISSING');
  throw new Error('Supabase credentials are required. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        categoria:categorias(id, nome)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar produto por ID:', error);
      return null;
    }
    
    return data as Product & { categoria: Category };
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
        categoria:categorias(id, nome)
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Product & { categoria: Category })[];
  },

  // Paginação cursor-based (mais eficiente)
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
        categoria:categorias(id, nome)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Cursor-based pagination (mais eficiente que offset)
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return {
      produtos: data as (Product & { categoria: Category })[],
      nextCursor: data.length === limit ? data[data.length - 1].created_at : null
    };
  },

  // Paginação por categoria
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
        categoria:categorias(id, nome)
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
    
    return {
      produtos: data as (Product & { categoria: Category })[],
      nextCursor: data.length === limit ? data[data.length - 1].created_at : null
    };
  },

  // Manter offset-based para compatibilidade (deprecated)
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
        categoria:categorias(id, nome)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { 
      data: data as (Product & { categoria: Category })[], 
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

// Funções de Categorias (com cache otimizado)
export const categoryService = {
  async getAll() {
    // Tentar buscar do cache primeiro
    const cacheKey = 'categories:all';
    const cached = cache.get<Category[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome, created_at') // Otimizado: campos específicos ao invés de *
      .order('nome');

    if (error) throw error;
    
    // Armazenar no cache por 10 minutos
    cache.set(cacheKey, data as Category[], 10 * 60 * 1000);
    
    return data as Category[];
  },

  async create(nome: string) {
    cache.delete('categories:all'); // Limpar cache
    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome }])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async update(id: string, nome: string) {
    cache.delete('categories:all'); // Limpar cache
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
    cache.delete('categories:all'); // Limpar cache
    const { error } = await supabase.from('categorias').delete().eq('id', id);

    if (error) throw error;
  },
};

// Autenticação
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    // Store access token in localStorage for client-side requests
    if (data.session?.access_token) {
      localStorage.setItem('sb-access-token', data.session.access_token);
    }
    
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token');
    if (error) throw error;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};
