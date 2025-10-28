// src/lib/catalog/templates.ts
// Templates HTML para renderização do catálogo

import { utils, getBateriaColor } from '../utils';
import type { Product } from '../logic/filters';

export const templates = {
  produtoCard(produto: Product): string {
    const precoFormatado = utils.formatarPreco(produto.preco);
    const imagemPrincipal = utils.getImageUrl(produto.imagens, 'medium', 0);
    const larguraBateria = utils.calcularLarguraBateria(produto.bateria);
    const corBateria = getBateriaColor(produto.bateria);
    
    const produtoEditData = btoa(JSON.stringify({
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco,
      condicao: produto.condicao,
      bateria: produto.bateria,
      categoria_id: produto.categoria_id,
      imagens: produto.imagens || []
    }));

    const badges = produto.condicao === 'Novo' 
      ? '<span class="badge badge-novo">Novo</span>'
      : `<div class="bateria-container">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="7" width="18" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
            <rect x="5" y="10" width="${larguraBateria}" height="4" rx="1" fill="currentColor" class="${corBateria}"/>
            <path d="M20 10v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>${produto.bateria}%</span>
        </div>`;

    return `
<a href="/produto/${produto.id}" class="produto-card" data-produto-id="${produto.id}">
    <button class="btn-editar-produto" data-produto-edit="${produtoEditData}" aria-label="Editar produto">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>
    <div class="produto-image">
        ${
          imagemPrincipal && imagemPrincipal !== '/placeholder.jpg'
            ? `<img 
                src="${imagemPrincipal}" 
                alt="${utils.escapeHtml(produto.nome)}" 
                loading="lazy" 
                decoding="async"
                fetchpriority="low"
                width="600" 
                height="600"
                style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); object-fit: cover; aspect-ratio: 1;"
              />`
            : `
            <div class="image-placeholder">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            `
        }
    </div>
    <div class="produto-info">
        <span class="produto-codigo">${utils.escapeHtml(produto.codigo || '')}</span>
        <h3 class="produto-nome">${utils.escapeHtml(produto.nome)}</h3>
        <div class="produto-footer">
            ${badges}
            <span class="preco">${precoFormatado}</span>
        </div>
    </div>
</a>
`;
  },

  categoriaSecao(nomeCategoria: string, produtos: Product[]): string {
    return `
<div class="categoria-secao">
    <h2 class="categoria-titulo">${utils.escapeHtml(nomeCategoria)}</h2>
    <div class="categoria-grid ${produtos.length === 1 ? 'single-item' : ''}">
        ${produtos.map(p => templates.produtoCard(p)).join('')}
    </div>
</div>
`;
  }
};
