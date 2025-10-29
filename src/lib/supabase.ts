// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

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
        categoria:categorias(id, nome, created_at)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar produto por ID:', error);
      return null;
    }
    // Corrigir categoria para ser objeto, não array
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
    // Corrigir categoria para ser objeto, não array
    return (data ?? []).map((item: any) => ({
      ...item,
      categoria: Array.isArray(item.categoria) && item.categoria.length > 0 ? item.categoria[0] : undefined
    })) as (Product & { categoria: Category })[];
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
        categoria:categorias(id, nome, created_at)
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
    
    const produtos = (data ?? []).map((item: any) => ({
      ...item,
      categoria: Array.isArray(item.categoria) && item.categoria.length > 0 ? item.categoria[0] : undefined
    })) as (Product & { categoria: Category })[];
    return {
      produtos,
      nextCursor: produtos.length === limit ? produtos[produtos.length - 1].created_at : null
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
        categoria:categorias(id, nome, created_at)
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
      categoria: Array.isArray(item.categoria) && item.categoria.length > 0 ? item.categoria[0] : undefined
    })) as (Product & { categoria: Category })[];
    return {
      produtos,
      nextCursor: produtos.length === limit ? produtos[produtos.length - 1].created_at : null
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

// Autenticação
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    // ✅ Salvar no localStorage para client-side
    if (data.session?.access_token) {
      localStorage.setItem('sb-access-token', data.session.access_token);
      localStorage.setItem('sb-auth-time', Date.now().toString());
    }
    
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-auth-time');
  },

  async getSession() {
    // ✅ NOVO: Verificar localStorage primeiro
    const token = localStorage.getItem('sb-access-token');
    const authTime = localStorage.getItem('sb-auth-time');
    
    // Se token existe e não expirou (7 dias)
    if (token && authTime) {
      const elapsed = Date.now() - parseInt(authTime);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (elapsed < sevenDays) {
        // Token ainda válido, retornar sessão mockada
        return { access_token: token };
      } else {
        // Token expirado, limpar
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-auth-time');
      }
    }
    
    // Fallback: tentar obter do Supabase
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};
