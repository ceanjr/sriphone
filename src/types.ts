// src/types.ts

export interface Product {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  preco: number;
  condicao: 'Novo' | 'Seminovo';
  bateria: number;
  categoria: string;
  imagemPrincipal: string;
  imagens: string[];
}

export interface Category {
    id: string;
    nome: string;
    created_at?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}