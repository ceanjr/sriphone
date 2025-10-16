// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos do banco de dados
export interface Product {
  id: string
  codigo: string
  nome: string
  descricao: string
  preco: number
  condicao: 'Novo' | 'Seminovo'
  bateria: number
  categoria_id: string
  categoria?: Category
  imagens: string[]
  created_at: string
}

export interface Category {
  id: string
  nome: string
  created_at: string
}

// Funções de Produtos
export const productService = {
  async getAll() {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as (Product & { categoria: Category })[]
  },

  async create(product: Omit<Product, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('produtos')
      .insert([product])
      .select()
      .single()
    
    if (error) throw error
    return data as Product
  },

  async update(id: string, product: Partial<Product>) {
    const { data, error } = await supabase
      .from('produtos')
      .update(product)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Product
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async uploadImage(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `produtos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('imagens')
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}

// Funções de Categorias
export const categoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data as Category[]
  },

  async create(nome: string) {
    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome }])
      .select()
      .single()
    
    if (error) throw error
    return data as Category
  },

  async update(id: string, nome: string) {
    const { data, error } = await supabase
      .from('categorias')
      .update({ nome })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Category
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Autenticação
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
  }
}