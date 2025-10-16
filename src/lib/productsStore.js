// src/lib/productsStore.js
// Sistema de gerenciamento de produtos (localStorage para demonstração)

const PRODUCTS_KEY = 'sr_iphone_products';
const CATEGORIES_KEY = 'sr_iphone_categories';

// Produtos iniciais de exemplo
const initialProducts = [
  {
    id: '1',
    codigo: 'IP14PM256',
    nome: 'iPhone 14 Pro Max',
    descricao: '256GB, Preto Espacial, Seminovo Premium',
    preco: 5499.00,
    condicao: 'Seminovo',
    bateria: 95,
    categoria: 'iPhone 14',
    imagemPrincipal: '/produtos/iphone-14-pro-1.jpg',
    imagens: [
      '/produtos/iphone-14-pro-1.jpg',
      '/produtos/iphone-14-pro-2.jpg',
      '/produtos/iphone-14-pro-3.jpg'
    ]
  },
  {
    id: '2',
    codigo: 'IP13128',
    nome: 'iPhone 13',
    descricao: '128GB, Azul Meia-Noite, Como Novo',
    preco: 3299.00,
    condicao: 'Seminovo',
    bateria: 98,
    categoria: 'iPhone 13',
    imagemPrincipal: '/produtos/iphone-13-1.jpg',
    imagens: [
      '/produtos/iphone-13-1.jpg',
      '/produtos/iphone-13-2.jpg'
    ]
  }
];

// Categorias iniciais
const initialCategories = [
  { id: '1', nome: 'iPhone 15' },
  { id: '2', nome: 'iPhone 14' },
  { id: '3', nome: 'iPhone 13' },
  { id: '4', nome: 'iPhone 12' },
  { id: '5', nome: 'iPhone SE' }
];

export const productsStore = {
  // Produtos
  getProducts() {
    if (typeof window === 'undefined') return initialProducts;
    const stored = localStorage.getItem(PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : initialProducts;
  },

  saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  addProduct(product) {
    const products = this.getProducts();
    const newProduct = {
      ...product,
      id: Date.now().toString()
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(id, updatedProduct) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedProduct };
      this.saveProducts(products);
      return products[index];
    }
    return null;
  },

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    this.saveProducts(filtered);
  },

  // Categorias
  getCategories() {
    if (typeof window === 'undefined') return initialCategories;
    const stored = localStorage.getItem(CATEGORIES_KEY);
    return stored ? JSON.parse(stored) : initialCategories;
  },

  saveCategories(categories) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  },

  addCategory(nome) {
    const categories = this.getCategories();
    const newCategory = {
      id: Date.now().toString(),
      nome
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  },

  updateCategory(id, nome) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index].nome = nome;
      this.saveCategories(categories);
      return categories[index];
    }
    return null;
  },

  deleteCategory(id) {
    const categories = this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    this.saveCategories(filtered);
  }
};