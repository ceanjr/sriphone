// src/scripts/catalogo.js
import { productService, categoryService, authService } from '../lib/supabase';

// Função helper para extrair URL da imagem (compatível com formato antigo e novo)
function getImageUrl(imagens, size = 'medium', index = 0) {
  if (!imagens || imagens.length === 0) return '/placeholder.jpg';
  
  const image = imagens[index];
  if (!image) return '/placeholder.jpg';
  
  // Se for string JSON, fazer parse
  if (typeof image === 'string') {
    if (image.startsWith('{')) {
      try {
        const parsed = JSON.parse(image);
        return parsed[size] || parsed.medium || parsed.thumbnail || '/placeholder.jpg';
      } catch {
        return image; // URL direta (formato antigo)
      }
    }
    return image; // URL direta (formato antigo)
  }
  
  // Formato objeto direto
  if (typeof image === 'object' && image !== null && 'thumbnail' in image) {
    return image[size] || image.medium || image.thumbnail || '/placeholder.jpg';
  }
  
  return '/placeholder.jpg';
}

export function initCatalogo() {
  // ==================== Estado ====================
  const state = {
    produtos: [],
    categorias: [],
    categoriaAtiva: 'todos',
    modoVisualizacao: window.innerWidth < 768 ? 'coluna' : 'grade',
    filtros: {
      busca: '',
      condicao: '',
      bateria: 0,
      ordenacao: 'recente',
    },
  };

  // ==================== Elementos DOM ====================
  const elementos = {
    modalLogin: document.getElementById('modal-login'),
    formLogin: document.getElementById('form-login'),
    loginError: document.getElementById('login-error'),
    searchInput: document.getElementById('search-input'),
    toggleFiltros: document.getElementById('toggle-filtros'),
    filtrosAvancados: document.getElementById('filtros-avancados'),
    btnLimparFiltros: document.getElementById('btn-limpar-filtros'),
    produtosContainer: document.getElementById('produtos-container'),
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('empty-state'),
    categoriasLista: document.getElementById('categorias-lista'),
    filtroCondicao: document.getElementById('filtro-condicao'),
    filtroBateria: document.getElementById('filtro-bateria'),
    filtroOrdenacao: document.getElementById('filtro-ordenacao'),
    categoriaSelect: document.getElementById('categoria-select'),
    visualizacaoContainer: document.querySelector('.visualizacao-container'),
    visualizacaoBtns: document.querySelectorAll('.visualizacao-btn'),
  };

  // ==================== Ordenação de Categorias ====================
  function ordenarCategorias(categorias) {
    const ordem = {
      todos: 0,
      'iphone 4': 1,
      'iphone 4s': 2,
      'iphone 5': 3,
      'iphone 5c': 4,
      'iphone 5s': 5,
      'iphone 6': 6,
      'iphone 6 plus': 7,
      'iphone 6s': 8,
      'iphone 6s plus': 9,
      'iphone 7': 10,
      'iphone 7 plus': 11,
      'iphone 8': 12,
      'iphone 8 plus': 13,
      'iphone x': 14,
      'iphone xr': 15,
      'iphone xs': 16,
      'iphone xs max': 17,
      'iphone 11': 18,
      'iphone 11 pro': 19,
      'iphone 11 pro max': 20,
      'iphone se': 21,
      'iphone se 2': 22,
      'iphone se 3': 23,
      'iphone 12': 24,
      'iphone 12 mini': 25,
      'iphone 12 pro': 26,
      'iphone 12 pro max': 27,
      'iphone 13': 28,
      'iphone 13 mini': 29,
      'iphone 13 pro': 30,
      'iphone 13 pro max': 31,
      'iphone 14': 32,
      'iphone 14 plus': 33,
      'iphone 14 pro': 34,
      'iphone 14 pro max': 35,
      'iphone 15': 36,
      'iphone 15 plus': 37,
      'iphone 15 pro': 38,
      'iphone 15 pro max': 39,
      'iphone 16': 40,
      'iphone 16 plus': 41,
      'iphone 16 pro': 42,
      'iphone 16 pro max': 43,
      'iphone 17': 44,
      'iphone 17 air': 45,
      'iphone 17 pro': 46,
      'iphone 17 pro max': 47,
    };

    return [...categorias].sort((a, b) => {
      const nomeA = a.nome.toLowerCase().trim();
      const nomeB = b.nome.toLowerCase().trim();

      const ordemA = ordem[nomeA];
      const ordemB = ordem[nomeB];

      if (ordemA !== undefined && ordemB !== undefined) {
        return ordemA - ordemB;
      }

      if (ordemA !== undefined) return -1;
      if (ordemB !== undefined) return 1;

      return nomeA.localeCompare(nomeB, 'pt-BR');
    });
  }

  // ==================== Utilitários ====================
  const utils = {
    formatarPreco(valor) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valor);
    },

    calcularLarguraBateria(bateria) {
      return (bateria / 100) * 14;
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
  };

  // ==================== Função para calcular cor da bateria ====================
  function getBateriaColor(bateria) {
    if (bateria >= 80) return 'bateria-verde';
    return 'bateria-vermelho';
  }

  // ==================== Templates ====================
  const templates = {
    produtoCard(produto) {
      const precoFormatado = utils.formatarPreco(produto.preco);
      const bateriaWidth = utils.calcularLarguraBateria(produto.bateria);
      const bateriaColorClass = getBateriaColor(produto.bateria);
      const imagemPrincipal = getImageUrl(produto.imagens, 'medium', 0);
      const temBateria = produto.bateria && produto.bateria > 0;

      const produtoModalData = JSON.stringify({
        id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        descricao: produto.descricao,
        preco: precoFormatado,
        condicao: produto.condicao,
        bateria: produto.bateria,
        categoria: produto.categoria?.nome || '',
        imagens: produto.imagens || [],
      }).replace(/"/g, '&quot;');

      const produtoEditData = JSON.stringify({
        id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.preco,
        condicao: produto.condicao,
        bateria: produto.bateria,
        categoria_id: produto.categoria_id,
        imagens: produto.imagens || [],
      }).replace(/"/g, '&quot;');

      const badges = `
      ${
        !temBateria
          ? `<span class="condicao-badge ${produto.condicao.toLowerCase()}">${
              produto.condicao
            }</span>`
          : ''
      }
      ${
        temBateria
          ? `
      <div class="bateria-indicator ${bateriaColorClass}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="bateria-icon">
              <rect x="2" y="7" width="18" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M20 10H22V14H20" stroke="currentColor" stroke-width="2"/>
              <rect x="4" y="9" width="${bateriaWidth}" height="6" rx="1" fill="currentColor" class="bateria-fill"/>
          </svg>
          <span>${produto.bateria}%</span>
      </div>
      `
          : ''
      }
    `;

      if (state.modoVisualizacao === 'lista') {
        return `
<article class="produto-card" data-produto-id="${
          produto.id
        }" data-produto="${produtoModalData}">
    <button class="btn-editar-produto" data-produto-edit="${produtoEditData}" aria-label="Editar produto">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>
    <div class="produto-info">
        <div class="lista-left">
            <h3>${utils.escapeHtml(produto.nome)}</h3>
            <p class="descricao">${utils.escapeHtml(produto.descricao)}</p>
            <span class="modal-codigo">${
              produto.codigo ? `Cod.: ${utils.escapeHtml(produto.codigo)}` : ''
            }</span>
        </div>
        <div class="lista-right">
            <div class="lista-badges">
                ${badges}
            </div>
            <div class="produto-footer">
                <span class="preco">${precoFormatado}</span>
            </div>
        </div>
    </div>
</article>
`;
      }

      return `
<article class="produto-card" data-produto-id="${
        produto.id
      }" data-produto="${produtoModalData}">
    <button class="btn-editar-produto" data-produto-edit="${produtoEditData}" aria-label="Editar produto">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>
    <div class="produto-image">
        ${
          imagemPrincipal && imagemPrincipal !== '/placeholder.jpg'
            ? `<div class="image-container">
                <div class="image-skeleton"></div>
                <img data-src="${imagemPrincipal}" alt="${utils.escapeHtml(
                produto.nome
              )}" class="lazy-image" loading="lazy" decoding="async" />
              </div>`
            : `
            <div class="image-placeholder">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M9 12L12 9L15 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
        `
        }
        ${badges}
    </div>
    <div class="produto-info">
        <h3>${utils.escapeHtml(produto.nome)}</h3>
        <p class="descricao">${utils.escapeHtml(produto.descricao)}</p>
        <div class="produto-footer">
            <span class="preco">${precoFormatado}</span>
            <button class="btn-detalhes">Ver detalhes</button>
        </div>
    </div>
</article>
`;
    },

    categoriaSecao(nomeCategoria, produtos) {
      return `
      <div class="categoria-section">
          <h2 class="categoria-titulo">${utils.escapeHtml(nomeCategoria)}</h2>
          <div class="categoria-grid ${state.modoVisualizacao}">
              ${produtos.map((p) => templates.produtoCard(p)).join('')}
          </div>
      </div>
    `;
    },
  };

  // ==================== Lógica de Negócio ====================
  const business = {
    filtrarProdutos() {
      return state.produtos.filter((p) => {
        if (
          state.categoriaAtiva !== 'todos' &&
          p.categoria_id !== state.categoriaAtiva
        ) {
          return false;
        }

        if (state.filtros.busca) {
          const busca = state.filtros.busca.toLowerCase();
          const match =
            p.nome.toLowerCase().includes(busca) ||
            p.descricao.toLowerCase().includes(busca) ||
            p.codigo.toLowerCase().includes(busca) ||
            p.categoria?.nome.toLowerCase().includes(busca);
          if (!match) return false;
        }

        if (state.filtros.condicao && p.condicao !== state.filtros.condicao) {
          return false;
        }

        if (p.bateria < state.filtros.bateria) {
          return false;
        }

        return true;
      });
    },

    ordenarProdutos(produtos) {
      const copia = [...produtos];

      switch (state.filtros.ordenacao) {
        case 'preco-asc':
          return copia.sort((a, b) => a.preco - b.preco);
        case 'preco-desc':
          return copia.sort((a, b) => b.preco - a.preco);
        case 'bateria':
          return copia.sort((a, b) => b.bateria - a.bateria);
        default:
          return copia.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
      }
    },

    agruparPorCategoria(produtos) {
      const grupos = new Map();

      produtos.forEach((p) => {
        const catNome = p.categoria?.nome || 'Sem Categoria';
        if (!grupos.has(catNome)) {
          grupos.set(catNome, []);
        }
        grupos.get(catNome).push(p);
      });

      return grupos;
    },
  };

  // ==================== Renderização ====================
  const render = {
    categorias() {
      if (!elementos.categoriaSelect) return;

      const categoriasOrdenadas = ordenarCategorias(state.categorias);

      elementos.categoriaSelect.innerHTML = `
    <option value="todos">Todos</option>
    ${categoriasOrdenadas
      .map(
        (cat) => `
        <option value="${cat.id}">${utils.escapeHtml(cat.nome)}</option>
      `
      )
      .join('')}
  `;

      if (elementos.categoriasLista) {
        elementos.categoriasLista.innerHTML = categoriasOrdenadas
          .map(
            (cat) => `
        <button class="categoria-btn" data-categoria="${cat.id}">
            ${utils.escapeHtml(cat.nome)}
        </button>
      `
          )
          .join('');
      }

      elementos.categoriaSelect.value = state.categoriaAtiva;
      document.querySelectorAll('.categoria-btn').forEach((btn) => {
        btn.classList.toggle(
          'active',
          btn.dataset.categoria === state.categoriaAtiva
        );
      });

      document.querySelectorAll('.categoria-btn').forEach((btn) => {
        btn.addEventListener('click', handlers.categoriaClick);
      });

      elementos.categoriaSelect.addEventListener(
        'change',
        handlers.categoriaSelectChange
      );

      elementos.visualizacaoBtns.forEach((btn) => {
        btn.classList.toggle(
          'active',
          btn.dataset.view === state.modoVisualizacao
        );
      });
    },

    produtos() {
      if (!elementos.produtosContainer || !elementos.emptyState) return;

      elementos.produtosContainer.classList.remove('coluna', 'grade', 'lista');
      elementos.produtosContainer.classList.add(state.modoVisualizacao);
      document.querySelectorAll('.categoria-grid').forEach((grid) => {
        grid.classList.remove('coluna', 'grade', 'lista');
        grid.classList.add(state.modoVisualizacao);
      });

      let produtosFiltrados = business.filtrarProdutos();
      produtosFiltrados = business.ordenarProdutos(produtosFiltrados);

      if (produtosFiltrados.length === 0) {
        elementos.produtosContainer.innerHTML = '';
        elementos.emptyState.style.display = 'block';
        return;
      }

      elementos.emptyState.style.display = 'none';

      if (state.categoriaAtiva === 'todos') {
        const grupos = business.agruparPorCategoria(produtosFiltrados);

        const categoriasComProdutos = Array.from(grupos.keys()).map(
          (nomeCategoria) => {
            const categoria = state.categorias.find(
              (c) => c.nome === nomeCategoria
            );
            return {
              nome: nomeCategoria,
              categoria: categoria || {
                id: '',
                nome: nomeCategoria,
                created_at: '',
              },
            };
          }
        );

        const categoriasOrdenadas = ordenarCategorias(
          categoriasComProdutos.map((c) => c.categoria)
        );

        elementos.produtosContainer.innerHTML = categoriasOrdenadas
          .map((cat) => {
            const prods = grupos.get(cat.nome);
            return prods ? templates.categoriaSecao(cat.nome, prods) : '';
          })
          .filter((html) => html !== '')
          .join('');
      } else {
        elementos.produtosContainer.innerHTML = produtosFiltrados
          .map((p) => templates.produtoCard(p))
          .join('');
      }

      elementos.produtosContainer
        .querySelectorAll('.produto-card')
        .forEach((card) => {
          card.addEventListener('click', handlers.produtoClick);
          
          // Preload inteligente para modal (especialmente importante em mobile)
          setupCardPreload(card);
        });

      setupEditButtons();
      setupLazyLoading();
    },

    loading(mostrar) {
      if (elementos.loading) {
        elementos.loading.style.display = mostrar ? 'flex' : 'none';
      }
    },
  };

  // ==================== Handlers ====================
  const handlers = {
    categoriaClick(e) {
      const target = e.currentTarget;
      const categoriaId = target.dataset.categoria;

      document
        .querySelectorAll('.categoria-btn')
        .forEach((b) => b.classList.remove('active'));
      target.classList.add('active');

      state.categoriaAtiva = categoriaId || 'todos';
      if (elementos.categoriaSelect) {
        elementos.categoriaSelect.value = state.categoriaAtiva;
      }
      renderProdutosComDelay();
    },

    categoriaSelectChange(e) {
      const target = e.target;
      state.categoriaAtiva = target.value;

      document.querySelectorAll('.categoria-btn').forEach((b) => {
        b.classList.toggle(
          'active',
          b.dataset.categoria === state.categoriaAtiva
        );
      });

      renderProdutosComDelay();
    },

    produtoClick(e) {
      const card = e.currentTarget;
      const produtoData = card.dataset.produto;

      if (produtoData) {
        try {
          const produto = JSON.parse(produtoData);
          window.abrirModalProduto(produto);
        } catch (error) {
          console.error('Erro ao abrir produto:', error);
        }
      }
    },

    searchInput(e) {
      const target = e.target;
      state.filtros.busca = target.value;
      renderProdutosComDelay();
    },

    toggleFiltros() {
      elementos.filtrosAvancados?.classList.toggle('active');
    },

    filtroCondicao(e) {
      const target = e.target;
      state.filtros.condicao = target.value;
      renderProdutosComDelay();
    },

    filtroBateria(e) {
      const target = e.target;
      state.filtros.bateria = parseInt(target.value);
      renderProdutosComDelay();
    },

    filtroOrdenacao(e) {
      const target = e.target;
      state.filtros.ordenacao = target.value;
      renderProdutosComDelay();
    },

    limparFiltros() {
      state.filtros = {
        busca: '',
        condicao: '',
        bateria: 0,
        ordenacao: 'recente',
      };
      state.categoriaAtiva = 'todos';

      if (elementos.searchInput) elementos.searchInput.value = '';
      if (elementos.filtroCondicao) elementos.filtroCondicao.selectedIndex = 0;
      if (elementos.filtroBateria) elementos.filtroBateria.selectedIndex = 0;
      if (elementos.filtroOrdenacao)
        elementos.filtroOrdenacao.selectedIndex = 0;
      if (elementos.categoriaSelect) elementos.categoriaSelect.value = 'todos';

      document.querySelectorAll('.categoria-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.categoria === 'todos');
      });

      renderProdutosComDelay();
    },

    visualizacaoClick(e) {
      const target = e.currentTarget;
      const view = target.dataset.view;

      state.modoVisualizacao = view;
      localStorage.setItem('modoVisualizacao', view);

      elementos.visualizacaoBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.view === view);
      });

      elementos.produtosContainer?.classList.remove('coluna', 'grade', 'lista');
      elementos.produtosContainer?.classList.add(view);
      document.querySelectorAll('.categoria-grid').forEach((grid) => {
        grid.classList.remove('coluna', 'grade', 'lista');
        grid.classList.add(view);
      });

      // Não precisa re-render, apenas trocar as classes CSS
      // renderProdutosComDelay();
    },

    async loginSubmit(e) {
      e.preventDefault();

      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');

      try {
        await authService.signIn(emailInput.value, passwordInput.value);

        elementos.modalLogin?.classList.remove('active');
        elementos.formLogin?.reset();

        if (elementos.loginError) {
          elementos.loginError.textContent = '';
          elementos.loginError.classList.remove('show');
        }
      } catch (error) {
        if (elementos.loginError) {
          elementos.loginError.textContent =
            error.message || 'Credenciais inválidas';
          elementos.loginError.classList.add('show');
        }
      }
    },

    closeModalLogin() {
      elementos.modalLogin?.classList.remove('active');
    },
  };

  // ==================== API ====================
  const api = {
    async carregarDados() {
      try {
        render.loading(true);
        if (elementos.emptyState) elementos.emptyState.style.display = 'none';
        if (elementos.produtosContainer)
          elementos.produtosContainer.innerHTML = '';

        const [produtosData, categoriasData] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
        ]);

        state.produtos = produtosData;
        state.categorias = categoriasData;

        render.categorias();
        renderProdutosComDelay();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar produtos. Tente novamente.');
      } finally {
        render.loading(false);
      }
    },
  };

  // ==================== Event Listeners ====================
  function setupEventListeners() {
    elementos.searchInput?.addEventListener('input', handlers.searchInput);
    elementos.toggleFiltros?.addEventListener('click', handlers.toggleFiltros);
    elementos.filtroCondicao?.addEventListener(
      'change',
      handlers.filtroCondicao
    );
    elementos.filtroBateria?.addEventListener('change', handlers.filtroBateria);
    elementos.filtroOrdenacao?.addEventListener(
      'change',
      handlers.filtroOrdenacao
    );
    elementos.btnLimparFiltros?.addEventListener(
      'click',
      handlers.limparFiltros
    );

    elementos.visualizacaoBtns.forEach((btn) => {
      btn.addEventListener('click', handlers.visualizacaoClick);
    });

    elementos.formLogin?.addEventListener('submit', handlers.loginSubmit);
    elementos.modalLogin
      ?.querySelector('.modal-close')
      ?.addEventListener('click', handlers.closeModalLogin);
    elementos.modalLogin
      ?.querySelector('.modal-overlay')
      ?.addEventListener('click', handlers.closeModalLogin);

    window.addEventListener('produtos-updated', () => {
      api.carregarDados();
    });
  }

  // ==================== Funções Globais ====================
  window.abrirModalLogin = () => {
    elementos.modalLogin?.classList.add('active');
  };

  // ==================== Inicialização ====================
  function init() {
    const savedView = localStorage.getItem('modoVisualizacao');
    state.modoVisualizacao =
      savedView || (window.innerWidth < 768 ? 'coluna' : 'grade');
    setupEventListeners();
    api.carregarDados();

    authService.onAuthStateChange(() => {
      setupEditButtons();
    });
  }

  init();

  // ==================== Controle de Botões de Editar ====================
  async function setupEditButtons() {
    const isAdmin = await authService.isAuthenticated();

    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach((button) => {
      if (isAdmin) {
        button.style.display = 'flex';
        button.addEventListener('click', handleEditClick);
      } else {
        button.style.display = 'none';
      }
    });
  }

  // ==================== Lazy Loading de Imagens ====================
  function setupLazyLoading() {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const imageContainer = img.closest('.image-container');
            const skeleton = imageContainer?.querySelector('.image-skeleton');
            
            // Preload da imagem
            const tempImg = new Image();
            tempImg.onload = () => {
              img.src = img.dataset.src;
              img.classList.add('loaded');
              skeleton?.classList.add('hidden');
              
              // Fade in suave
              setTimeout(() => {
                skeleton?.remove();
              }, 300);
            };
            
            tempImg.onerror = () => {
              img.classList.add('error');
              skeleton?.classList.add('hidden');
              
              // Mostrar placeholder de erro
              imageContainer.innerHTML = `
                <div class="image-error">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" stroke-width="2"/>
                    <circle cx="9" cy="9" r="1" fill="currentColor"/>
                    <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              `;
            };
            
            tempImg.src = img.dataset.src;
            observer.unobserve(img);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    // Observar todas as imagens lazy
    document.querySelectorAll('.lazy-image').forEach((img) => {
      imageObserver.observe(img);
    });

    // Re-observar quando novos produtos são adicionados
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const lazyImages = node.querySelectorAll?.('.lazy-image') || [];
              lazyImages.forEach((img) => {
                imageObserver.observe(img);
              });
            }
          });
        }
      });
    });

    const container = elementos.produtosContainer;
    if (container) {
      mutationObserver.observe(container, {
        childList: true,
        subtree: true
      });
    }
  }

  // ==================== Preload Inteligente de Modal ====================
  function setupCardPreload(card) {
    const isMobile = window.innerWidth <= 768;
    let preloadTimeout;
    let hasPreloaded = false;

    // Função para fazer preload das imagens do modal
    function preloadModalImages() {
      if (hasPreloaded) return;
      
      const produtoData = card.dataset.produto;
      if (!produtoData) return;

      try {
        const produto = JSON.parse(produtoData);
        if (produto.imagens && produto.imagens.length > 0) {
          // Precarregar primeira imagem imediatamente
          const firstImg = new Image();
          const firstImgUrl = getImageUrl(produto.imagens, 'medium', 0);
          
          if (firstImgUrl && firstImgUrl !== '/placeholder.jpg') {
            firstImg.src = firstImgUrl;
          }

          // Precarregar segunda imagem se disponível (mobile)
          if (isMobile && produto.imagens.length > 1) {
            setTimeout(() => {
              const secondImg = new Image();
              const secondImgUrl = getImageUrl(produto.imagens, 'medium', 1);
              if (secondImgUrl && secondImgUrl !== '/placeholder.jpg') {
                secondImg.src = secondImgUrl;
              }
            }, 100);
          }

          hasPreloaded = true;
        }
      } catch (error) {
        console.warn('Erro no preload do modal:', error);
      }
    }

    if (isMobile) {
      // Mobile: preload no touchstart (mais rápido)
      card.addEventListener('touchstart', () => {
        clearTimeout(preloadTimeout);
        preloadTimeout = setTimeout(preloadModalImages, 50);
      }, { passive: true });

      // Fallback para hover em mobile híbrido
      card.addEventListener('mouseenter', () => {
        clearTimeout(preloadTimeout);
        preloadTimeout = setTimeout(preloadModalImages, 100);
      });
    } else {
      // Desktop: preload no hover
      card.addEventListener('mouseenter', () => {
        clearTimeout(preloadTimeout);
        preloadTimeout = setTimeout(preloadModalImages, 200);
      });
    }

    // Cancelar preload se saiu antes de completar
    card.addEventListener('mouseleave', () => {
      clearTimeout(preloadTimeout);
    });

    card.addEventListener('touchend', () => {
      clearTimeout(preloadTimeout);
    });
  }  function handleEditClick(e) {
    e.stopPropagation();
    e.preventDefault();

    const btn = e.currentTarget;
    const produtoDataStr = btn.dataset.produtoEdit;

    if (!produtoDataStr) {
      console.error('Dados do produto não encontrados no botão');
      mostrarToast('Erro: dados do produto não encontrados', 'error');
      return;
    }

    try {
      const produtoData = JSON.parse(produtoDataStr);
      // Redirect to edit page
      window.location.href = `/admin/produtos/novo?edit=${produtoData.id}`;
    } catch (error) {
      console.error('Erro ao parsear dados do produto:', error);
      mostrarToast('Erro ao carregar dados do produto', 'error');
    }
  }

  function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function renderProdutosComDelay() {
    const produtos = business.filtrarProdutos();
    const container = elementos.produtosContainer;

    if (!container) return;

    container.innerHTML = '';
    let i = 0;

    function renderChunk() {
      const chunk = produtos.slice(i, i + 10);
      chunk.forEach((p) =>
        container.insertAdjacentHTML('beforeend', templates.produtoCard(p))
      );
      i += 10;

      if (i < produtos.length) {
        requestIdleCallback(renderChunk);
      }
    }

    requestIdleCallback(renderChunk);
  }
}

initCatalogo();
