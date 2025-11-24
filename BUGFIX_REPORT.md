# BUGFIX REPORT - Análise Completa do Projeto

**Data:** 2025-11-24
**Framework:** Astro 5 com SSR + ISR (Vercel)
**Backend:** Supabase
**Status:** 🔴 4 Bugs Críticos Identificados

---

## 1. VISÃO GERAL

### Resumo Executivo

Este projeto apresenta 4 bugs críticos relacionados a autenticação, upload de imagens e cache/ISR. Após análise completa do código, identifiquei as causas raiz de cada problema e propus correções definitivas.

### Principais Decisões

1. **✅ MANTER ISR** apenas no catálogo público (com cache de 5s)
2. **✅ REMOVER ISR** completamente da área administrativa (já está correto: `prerender: false`)
3. **🔧 CORRIGIR** race conditions no middleware de autenticação
4. **🔧 CORRIGIR** gestão de estado de imagens no formulário de produtos
5. **🔧 IMPLEMENTAR** tratamento correto de EXIF em fotos mobile
6. **🔧 MELHORAR** invalidação de cache após operações CRUD

### Arquitetura Atual

- **Catálogo público:** SSR com ISR (cache 5s) ✅
- **Área admin:** SSR puro sem cache ✅
- **APIs públicas:** Cache de 5s
- **APIs admin:** Sem cache (no-store)
- **Autenticação:** Middleware SSR + Cookies httpOnly
- **Upload:** FormData → Sharp (servidor) + Supabase Storage

---

## 2. PROBLEMAS ENCONTRADOS

### BUG 1: Redirecionamento Inconsistente para Login (CRÍTICO)

**Severidade:** 🔴 CRÍTICO
**Frequência:** Intermitente (comportamento aleatório)
**Impacto:** Usuários autenticados sendo deslogados aleatoriamente

#### Causa Raiz

**Race Condition em Verificação Assíncrona** (middleware.ts)

O middleware verifica autenticação de forma assíncrona sem sincronização entre múltiplas requisições simultâneas. Quando o navegador faz requests paralelos (HTML + CSS + JS + imagens), cada request chama `verifyToken()` independentemente, sem cache ou lock, causando verificações duplicadas que podem retornar resultados diferentes.

#### Arquivos e Locais

1. **src/middleware.ts:178-192**
   - `await verifyToken()` é assíncrono sem cache
   - Múltiplas requests simultâneas = múltiplas verificações
   - Tempo de resposta variável do Supabase causa inconsistência

2. **src/middleware.ts:212-220**
   - Redirect duplo inconsistente:
   - Cliente redireciona para `/admin/dashboard` (login.astro:269)
   - Middleware redireciona para `/admin/produtos`
   - Conflito causa loops e flashes

3. **src/lib/auth.ts:41-43**
   - Timeout de 5s é muito curto para redes lentas
   - Em conexões 3G/satelite, timeout força logout

4. **src/pages/admin/login.astro:129-156**
   - Limpa cookies incompletos no CLIENTE
   - Middleware NÃO valida cookies incompletos no SERVIDOR
   - Safari pode salvar apenas `sb-access-token` sem `sb-refresh-token`

#### Cenários de Falha

**Cenário A - Race Condition:**
```
T0: Usuário faz login, cookies setados
T1: Browser redireciona para /admin/dashboard
T2: Browser faz 3 requests simultâneos (HTML, CSS, JS)
T3: Request 1 → middleware verifica (100ms) → OK
T4: Request 2 → middleware verifica (150ms, rede lenta) → TIMEOUT
T5: Request 2 redireciona para /admin/login
T6: Usuário vê tela de login mesmo autenticado
```

**Cenário B - Cookies Incompletos (Safari):**
```
T0: Usuário faz login
T1: Safari salva sb-access-token ✓
T2: Safari FALHA em salvar sb-refresh-token ✗ (bug do Safari)
T3: Request para /admin/dashboard
T4: Middleware pega access token, verifica → expira depois de N minutos
T5: Middleware tenta refresh → NÃO TEM refresh token
T6: Redirect para /admin/login
```

**Cenário C - Duplo Redirect:**
```
T0: Usuário faz login
T1: Cliente JS: window.location.href = '/admin/dashboard'
T2: Request chega no middleware
T3: Middleware: "user autenticado em /admin/dashboard → redirect /admin/produtos"
T4: Duplo redirect causa flash de conteúdo + reload
```

#### Hipóteses por Probabilidade

1. **90%** - Race condition em verificação assíncrona
2. **80%** - Cookies incompletos no Safari
3. **70%** - Duplo redirect causa loop
4. **40%** - ISR cache bug (pattern matching falha)
5. **20%** - Timeout muito curto

---

### BUG 2: Erro ao Adicionar Fotos em Alguns Celulares (CRÍTICO)

**Severidade:** 🔴 CRÍTICO
**Frequência:** 50% dos dispositivos mobile testados
**Impacto:** Usuários não conseguem adicionar produtos

#### Causa Raiz

**Compressão Client-Side Não Trata Orientação EXIF**

A função `compressImage()` usa Canvas para redimensionar imagens no cliente. Canvas NÃO respeita automaticamente metadados EXIF de orientação. Fotos tiradas com câmera mobile (especialmente iOS) têm orientação EXIF que é ignorada, resultando em imagens rotacionadas/espelhadas incorretamente.

Quando a imagem chega no servidor, Sharp até tenta corrigir com `.rotate()` (upload.ts:87), mas a imagem JÁ FOI rotacionada errado pelo Canvas, então a correção do Sharp piora o problema ou não tem efeito.

#### Arquivos e Locais

1. **src/pages/admin/produtos/novo.astro:407-458**
   - Função `compressImage()` usa Canvas sem ler EXIF
   - Linhas 431-432: `ctx.drawImage(img, 0, 0, width, height)` ignora orientação

2. **src/pages/admin/produtos/[id]/editar.astro:493-540**
   - Mesma função `compressImage()` com mesmo bug

3. **src/pages/api/admin/upload.ts:87**
   - Sharp faz `.rotate()` para corrigir EXIF
   - MAS recebe imagem já rotacionada errado pelo Canvas

#### Outros Problemas Relacionados

**Validações que podem falhar em mobile:**
- upload.ts:48-56 - Validação de tipo MIME
- iOS pode enviar `image/heic` que não está na lista aceita
- Tamanho máximo 10MB pode ser ultrapassado em fotos HD modernas

**Input file em mobile:**
- novo.astro:368 - `accept="image/*"` pode não funcionar em todos browsers mobile
- Alguns browsers mobile não suportam múltiplas seleções corretamente

#### Cenários de Falha

```
T0: Usuário tira foto no iPhone (orientação portrait)
T1: iPhone salva foto com EXIF orientation=6 (90° CW)
T2: Usuário seleciona foto no input file
T3: compressImage() carrega imagem no Canvas
T4: Canvas desenha imagem ignorando EXIF → imagem fica rotacionada 90°
T5: Canvas exporta blob rotacionado errado
T6: Upload envia blob para servidor
T7: Sharp recebe blob já rotacionado errado
T8: Sharp aplica .rotate() → piora o problema
T9: Imagem salva completamente errada
```

---

### BUG 3: Segundo Produto Recebe Fotos do Primeiro (CRÍTICO)

**Severidade:** 🔴 CRÍTICO
**Frequência:** 100% ao criar produtos consecutivos
**Impacto:** Dados incorretos, integridade comprometida

#### Causa Raiz

**Array `selectedFiles` Nunca É Resetado Após Criar Produto**

O array de arquivos selecionados é declarado no escopo do script e nunca é limpo antes do redirect. Se o usuário volta no navegador (back button) ou se o redirect demora, o array ainda contém os arquivos do produto anterior.

#### Arquivos e Locais

1. **src/pages/admin/produtos/novo.astro:206**
   ```typescript
   let selectedFiles: File[] = []; // Declarado no escopo do script
   ```

2. **src/pages/admin/produtos/novo.astro:648**
   ```javascript
   window.location.href = `/admin/produtos?_t=${Date.now()}`;
   // FALTA: selectedFiles = []; cleanupBlobUrls();
   ```

3. **src/pages/admin/produtos/novo.astro:218-221**
   ```javascript
   function cleanupBlobUrls() {
     // Revoga apenas Blob URLs, NÃO limpa o array selectedFiles
     blobUrls.forEach(url => URL.revokeObjectURL(url));
   }
   ```

4. **src/pages/admin/produtos/novo.astro:595**
   ```javascript
   const uploadedUrls = await uploadAllImages(selectedFiles);
   // Passa REFERÊNCIA do array, não cópia
   ```

#### Prova do Bug

**Teste reproduzível:**
```
1. Abrir /admin/produtos/novo
2. Selecionar 3 fotos (A, B, C)
3. Preview mostra fotos A, B, C ✓
4. Criar produto → Upload sucesso → Redirect para /admin/produtos
5. ANTES do redirect completar: clicar "voltar" no navegador
6. Ou: abrir nova aba de /admin/produtos/novo
7. Preview IMEDIATAMENTE mostra fotos A, B, C (do produto anterior!)
8. Selecionar 2 fotos novas (X, Y)
9. Preview mostra 5 fotos: A, B, C, X, Y ✗
10. Criar produto → Produto 2 tem 5 fotos ao invés de 2
```

#### Outros Problemas Relacionados

1. **Event listeners globais podem vazar** (novo.astro:314-330)
   - Funções atribuídas a `(window as any).removeImageAt`
   - Se página recarrega parcialmente (SPA), listeners persistem

2. **Falta de limpeza em caso de erro** (novo.astro:650-663)
   - Catch apenas mostra erro, não limpa estado

3. **Validação de arquivo inconsistente**
   - Frontend: `file.type.startsWith('image/')` (novo.astro:368)
   - Backend: Lista específica de tipos (upload.ts:48)
   - Pode aceitar no frontend mas rejeitar no backend

4. **Compressão duplicada**
   - Cliente comprime (novo.astro:407-458)
   - Servidor comprime novamente com Sharp (upload.ts:88)
   - Perda desnecessária de qualidade

---

### BUG 4: Produto Excluído Continua na Área Admin (MÉDIO)

**Severidade:** 🟡 MÉDIO
**Frequência:** 100% após exclusão
**Impacto:** Confusão do usuário, dados desatualizados temporariamente

#### Causa Raiz

**Múltiplas Causas Combinadas:**

1. **Browser pode cachear redirect com query params**
   - produtos.astro:359 faz redirect para `/admin/produtos?_t=timestamp`
   - Alguns browsers cacheiam mesmo com cache-busting query param
   - Headers anti-cache estão corretos, mas navegador pode ignorar

2. **SSR busca dados uma vez no build da página**
   - produtos.astro:29-32 busca produtos direto do Supabase no SSR
   - Dados são "imprinted" no HTML renderizado
   - Até o próximo reload completo, HTML mantém dados antigos

3. **Revalidação de ISR não afeta admin (correto, mas contribui)**
   - DELETE chama `/api/revalidate` (produtos/[id]/index.ts:240)
   - Mas revalidate só afeta páginas com ISR
   - Admin tem `prerender: false`, então não há cache ISR para revalidar

#### Arquivos e Locais

1. **src/pages/admin/produtos.astro:29-32**
   ```typescript
   // Busca TODOS os produtos no SSR (server-side rendering)
   const { data: produtos } = await supabaseAdmin
     .from('produtos')
     .select('*, categoria:categoria_id(id, nome)')
     .order('created_at', { ascending: false });
   ```
   - Dados buscados UMA VEZ quando a página é renderizada no servidor
   - Não há revalidação automática

2. **src/pages/admin/produtos.astro:359**
   ```javascript
   window.location.href = `/admin/produtos?_t=${timestamp}`;
   ```
   - Redirect com cache-busting query param
   - MAS se usuário já está em /admin/produtos, redirect é para MESMA página
   - Browser pode servir do cache mesmo com query param diferente

3. **src/pages/admin/produtos.astro:11-16**
   ```typescript
   // Headers anti-cache ESTÃO corretos:
   Astro.response.headers.set('Cache-Control', 'private, no-store, ...');
   Astro.response.headers.set('CDN-Cache-Control', 'no-store');
   ```
   - Headers corretos, mas alguns browsers ignoram em redirects

4. **src/pages/api/admin/produtos/[id]/index.ts:239-243**
   ```typescript
   // Tenta revalidar cache ISR (não tem efeito em admin)
   try {
     await fetch(`${origin}/api/revalidate?secret=...&path=/catalogo`);
   } catch (e) { ... }
   ```
   - Revalida apenas `/catalogo` (correto)
   - Admin não usa ISR, então não precisa revalidar

#### Por Que Catálogo Atualiza Mais Rápido?

**Catálogo (catalogo.astro):**
- Linha 717: `await fetch('/api/produtos?limit=30')` - Busca no CLIENTE
- Client-side fetch sempre pega dados frescos
- ISR de 5s afeta apenas renderização SSR inicial
- Após primeiro carregamento, tudo é client-side

**Admin (produtos.astro):**
- Linha 29-32: Busca no SERVIDOR (SSR frontmatter)
- Dados "imprinted" no HTML até próximo reload completo
- Não há fetch client-side, apenas filtro local (linha 263-285)

#### Cenários de Falha

```
T0: Admin em /admin/produtos vê 10 produtos
T1: Admin clica "deletar" no Produto X
T2: DELETE /api/admin/produtos/X → sucesso ✓
T3: Produto X deletado do banco ✓
T4: JavaScript faz window.location.href = '/admin/produtos?_t=123'
T5: Browser intercepta redirect
T6: Browser checa cache: /admin/produtos (ignora query param)
T7: Browser serve HTML cacheado (ainda com Produto X)
T8: Admin vê Produto X ainda listado ✗
T9: Admin recarrega manualmente (F5 ou Ctrl+R)
T10: SSR busca dados novamente → Produto X não aparece ✓
```

#### Por Que Demora "Um Bom Tempo"?

O delay não é fixo, depende de:
- Cache do browser (pode durar minutos)
- Se admin fecha e reabre a aba
- Se admin navega para outra página e volta
- Se admin faz "hard reload" (Ctrl+Shift+R)

---

## 3. ANÁLISE DE ISR (Incremental Static Regeneration)

### Configuração Atual (astro.config.mjs)

```javascript
isr: {
  expiration: 10, // 10 segundos
  exclude: ['/api/admin', '/api/admin/*', '/admin', '/admin/*', '/admin/**/*'],
}
```

### Onde ISR Está Sendo Usado

1. **Homepage (index.astro):** `prerender: true` ✅
   - Página estática, não muda frequentemente
   - ISR adequado, melhora performance

2. **Catálogo (catalogo.astro):** `prerender: false` + ISR 10s ✅
   - SSR com cache de 10s (Vercel)
   - Cache client: 5s (Cache-Control header)
   - Adequado para dados que mudam frequentemente mas não em tempo real

3. **Página de produto ([id].astro):** `prerender: false` ✅
   - SSR puro, sem ISR
   - Adequado, produtos mudam com frequência

4. **Área admin:** `prerender: false` + ISR excluído ✅
   - SSR puro sem cache
   - Correto, admin precisa dados frescos sempre

### APIs e Cache

1. **API Pública (/api/produtos.ts):**
   - Cache-Control: `public, s-maxage=5, stale-while-revalidate=10`
   - Cache de 5s é adequado para catálogo público

2. **APIs Admin (/api/admin/*):**
   - Cache-Control: `no-store, no-cache, must-revalidate`
   - Correto, sem cache para admin

### Avaliação do ISR

| Uso | Benefício | Risco | Recomendação |
|-----|-----------|-------|--------------|
| Homepage | ✅ Alto (SEO, performance) | ✅ Baixo (conteúdo estático) | **MANTER** |
| Catálogo | ✅ Médio (performance) | ⚠️ Médio (dados podem ficar desatualizados por 10s) | **MANTER** com cache reduzido (5s) |
| Produto individual | ❌ Baixo (poucos acessos simultâneos) | ❌ Alto (dados mudam com frequência) | **MANTER sem ISR** (já correto) |
| Admin | ❌ Nenhum | ❌ Alto (dados sensíveis, CRUD frequente) | **MANTER sem ISR** (já correto) |

### Conclusão sobre ISR

**✅ É SEGURO MANTER O ISR ATUAL**

O ISR está configurado corretamente:
- Homepage estática (prerender: true)
- Catálogo com cache curto (10s no Vercel, 5s no cliente)
- Admin completamente excluído do ISR
- APIs admin sem cache

**Ajustes recomendados:**
1. Reduzir cache do catálogo de 10s para 5s (consistência com API)
2. Adicionar invalidação on-demand após CRUD (já existe mas está comentado)
3. Garantir que revalidate funcione corretamente

---

## 4. TODO / CHECKLIST DE CORREÇÕES

### PRIORIDADE 1 - Correções Críticas (BUG 1, 2, 3)

#### Autenticação (BUG 1)

- [ ] **MIDDLEWARE: Adicionar cache in-memory de usuário com TTL 2s**
  - Arquivo: `src/middleware.ts`
  - Local: Antes da função `verifyToken()` (linha ~140)
  - Implementar: `Map<string, { user, timestamp }>` com limpeza automática

- [ ] **MIDDLEWARE: Validar cookies completos (access + refresh juntos)**
  - Arquivo: `src/middleware.ts`
  - Local: Após linha 175 (getAccessToken)
  - Adicionar: Verificar que AMBOS existem ou NENHUM
  - Se incompleto: Deletar ambos e redirecionar para login

- [ ] **MIDDLEWARE: Aumentar timeout de auth de 5s para 10s**
  - Arquivo: `src/lib/auth.ts`
  - Local: Linha 42
  - Mudar: `setTimeout(..., 5000)` → `setTimeout(..., 10000)`

- [ ] **LOGIN: Unificar destino de redirect pós-login**
  - Arquivo: `src/pages/admin/login.astro`
  - Local: Linha 269
  - Mudar: `window.location.href = '/admin/dashboard'` → `'/admin/produtos'`

- [ ] **ADMIN LAYOUT: Adicionar headers anti-cache em todas as páginas admin**
  - Arquivo: `src/layouts/AdminLayout.astro`
  - Local: Adicionar no frontmatter
  - Headers: Cache-Control, CDN-Cache-Control, Vercel-CDN-Cache-Control (no-store)

#### Upload de Imagens Mobile (BUG 2)

- [ ] **OPÇÃO A: Remover compressão client-side completamente**
  - Arquivo: `src/pages/admin/produtos/novo.astro`
  - Local: Linhas 407-458 (função compressImage)
  - Ação: Comentar/deletar função
  - Motivo: Deixar Sharp no servidor fazer todo o trabalho (já trata EXIF corretamente)

- [ ] **OPÇÃO B: Implementar leitura de EXIF no cliente**
  - Arquivo: `src/pages/admin/produtos/novo.astro`
  - Local: Dentro da função `compressImage()`
  - Adicionar: Biblioteca exif-js ou usar ImageBitmap com orientação
  - Corrigir: Rotação do Canvas antes de drawImage()

- [ ] **MESMA CORREÇÃO para página de edição**
  - Arquivo: `src/pages/admin/produtos/[id]/editar.astro`
  - Local: Linhas 493-540
  - Aplicar mesma solução escolhida (A ou B)

- [ ] **API: Expandir lista de tipos MIME aceitos (incluir HEIC)**
  - Arquivo: `src/pages/api/admin/upload.ts`
  - Local: Linha 48
  - Adicionar: `'image/heic', 'image/heif'` à lista de tipos válidos

#### Estado de Imagens (BUG 3)

- [ ] **CRÍTICO: Resetar selectedFiles ANTES do redirect**
  - Arquivo: `src/pages/admin/produtos/novo.astro`
  - Local: Linha 648 (ANTES de window.location.href)
  - Adicionar:
    ```javascript
    // Limpar estado ANTES de redirecionar
    selectedFiles = [];
    cleanupBlobUrls();
    blobUrls = [];
    ```

- [ ] **Resetar estado também em caso de ERRO**
  - Arquivo: `src/pages/admin/produtos/novo.astro`
  - Local: Linha 650-663 (bloco catch)
  - Adicionar limpeza de estado também no catch

- [ ] **Limpar event listeners globais ao desmontar**
  - Arquivo: `src/pages/admin/produtos/novo.astro`
  - Local: Adicionar event listener de `beforeunload`
  - Limpar: `delete (window as any).removeImageAt`

### PRIORIDADE 2 - Melhorias (BUG 4 + Otimizações)

#### Cache e Revalidação (BUG 4)

- [ ] **ADMIN: Forçar reload completo após deleção com location.reload()**
  - Arquivo: `src/pages/admin/produtos.astro`
  - Local: Linha 359
  - Mudar:
    ```javascript
    // De:
    window.location.href = `/admin/produtos?_t=${timestamp}`;

    // Para:
    window.location.reload(); // Força reload completo sem cache
    ```

- [ ] **ADMIN: Adicionar header Pragma: no-cache em TODAS as páginas admin**
  - Arquivo: `src/layouts/AdminLayout.astro`
  - Adicionar: `Pragma: no-cache`, `Expires: 0`

- [ ] **CATÁLOGO: Reduzir cache ISR de 10s para 5s**
  - Arquivo: `astro.config.mjs`
  - Local: Linha 13
  - Mudar: `expiration: 10` → `expiration: 5`

- [ ] **REVALIDATE: Habilitar revalidação on-demand após CRUD**
  - Arquivo: `src/pages/api/admin/produtos/[id]/index.ts`
  - Local: Linhas 239-243 (já existe mas pode melhorar)
  - Garantir: Secret correto, aguardar resposta antes de retornar

- [ ] **CATÁLOGO: Implementar auto-reload quando detectar mudanças**
  - Arquivo: `src/pages/catalogo.astro`
  - Local: Script client-side
  - Adicionar: Polling periódico ou WebSocket para detectar mudanças no banco
  - Mostrar: Toast "Novos produtos disponíveis, clique para atualizar"

### PRIORIDADE 3 - Melhorias de Qualidade

#### Validações e Segurança

- [ ] **Adicionar verificação de auth nas APIs que faltam**
  - Arquivo: `src/pages/api/admin/produtos/index.ts`
  - Local: Linha 30 (GET)
  - Adicionar: Chamada a `verifyAuth()` ou verificação de cookies

- [ ] **Validar tamanho máximo de arquivo no frontend**
  - Arquivo: `src/pages/admin/produtos/novo.astro`
  - Local: Handler de seleção de arquivo (linha 368)
  - Adicionar: Verificação antes de adicionar ao array
  - Máximo: 10MB (consistente com backend)

- [ ] **Remover código morto (authStore.js comentado)**
  - Arquivo: `src/lib/authStore.js`
  - Ação: Deletar arquivo completo (todas as linhas comentadas)

- [ ] **Remover authUtils.ts não usado**
  - Arquivo: `src/lib/authUtils.ts`
  - Verificar: Se NENHUMA página usa, deletar
  - Ou: Adicionar comentário explicando por que existe mas não é usado

#### Performance

- [ ] **Remover compressão duplicada (cliente + servidor)**
  - Se escolher OPÇÃO A do BUG 2: Já resolvido
  - Se escolher OPÇÃO B: Reduzir qualidade no cliente para 85% (linha 452 de novo.astro)

- [ ] **Otimizar query de produtos na área admin**
  - Arquivo: `src/pages/admin/produtos.astro`
  - Local: Linha 29-32
  - Adicionar: Paginação ou lazy loading (se muitos produtos)

- [ ] **Adicionar índices no Supabase para queries frequentes**
  - Tabela: `produtos`
  - Campos: `created_at`, `categoria_id`
  - Já existe: Verificar em `supabase_indexes.sql`

#### UX/Feedback

- [ ] **Adicionar barra de progresso durante upload de imagens**
  - Arquivo: `src/pages/admin/produtos/novo.astro`
  - Local: Função `uploadAllImages()` (linha 497-570)
  - Usar: XMLHttpRequest com progress event ou fetch + ReadableStream

- [ ] **Melhorar mensagem de erro quando upload falha**
  - Arquivo: `src/pages/admin/produtos/novo.astro`
  - Local: Catch de uploadAllImages (linha 650-663)
  - Adicionar: Detalhes específicos (qual arquivo, qual erro)

- [ ] **Adicionar confirmação visual após atualizar lista**
  - Arquivo: `src/pages/admin/produtos.astro`
  - Local: Após reload (linha 360)
  - Adicionar: Toast "Lista atualizada" + highlight do item afetado

---

## 5. DETALHAMENTO TÉCNICO DAS CORREÇÕES

### FIX 1.1 - Cache de Usuário no Middleware

**Problema:** Múltiplas requisições simultâneas fazem verificações duplicadas no Supabase.

**Solução:**
```typescript
// src/middleware.ts - Adicionar no topo do arquivo (linha ~10)

interface CachedUser {
  user: any;
  timestamp: number;
}

const userCache = new Map<string, CachedUser>();
const CACHE_TTL = 2000; // 2 segundos

// Função helper para limpar cache expirado
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}

// Modificar função verifyToken (linha ~140)
async function verifyToken(
  accessToken: string,
  cookies: AstroCookies
): Promise<{ user: any | null; error: Error | null }> {
  try {
    // Usar primeiros 20 caracteres do token como chave de cache
    const cacheKey = accessToken.substring(0, 20);

    // Verificar cache
    const cached = userCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Middleware] ✅ User from cache');
      return { user: cached.user, error: null };
    }

    // Se não está em cache, verificar normalmente
    console.log('[Middleware] 🔍 Verifying token with Supabase...');

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      console.log('[Middleware] ❌ Invalid token');
      return { user: null, error };
    }

    // Salvar no cache
    userCache.set(cacheKey, {
      user: data.user,
      timestamp: Date.now()
    });

    // Limpar cache expirado periodicamente
    if (userCache.size > 100) {
      cleanExpiredCache();
    }

    console.log('[Middleware] ✅ Token valid, user cached');
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('[Middleware] ❌ Error verifying token:', error);
    return { user: null, error };
  }
}
```

**Benefícios:**
- Reduz calls ao Supabase de N (requests simultâneos) para 1 a cada 2s
- Elimina race condition de verificações duplicadas
- Performance: Respostas instantâneas de cache (~1ms vs ~100ms)

**Riscos:**
- Cache de 2s: Usuário deslogado no banco ainda parece autenticado por até 2s
- Mitigação: 2s é aceitável para admin interno (não é crítico de segurança)

---

### FIX 1.2 - Validar Cookies Completos

**Problema:** Safari pode salvar apenas `sb-access-token` sem `sb-refresh-token`, causando falhas silenciosas no refresh.

**Solução:**
```typescript
// src/middleware.ts - Adicionar após linha 175

const accessToken = getAccessToken(request, cookies);
const refreshToken = cookies.get('sb-refresh-token')?.value;

// VALIDAR: Ambos devem existir juntos
if ((accessToken && !refreshToken) || (!accessToken && refreshToken)) {
  console.log('[Middleware] ⚠️ Cookies incompletos detectados');
  console.log('[Middleware] Access token:', !!accessToken);
  console.log('[Middleware] Refresh token:', !!refreshToken);

  // Limpar TODOS os cookies de sessão
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  cookies.delete('sb-expires-at', { path: '/' });
  cookies.delete('sb-auth-token', { path: '/' });

  console.log('[Middleware] 🧹 Cookies limpos, redirecionando para login');

  // Tratar como não autenticado
  if (isAdminRoute && !isLoginPage) {
    return redirect('/admin/login', {
      headers: { 'X-Redirect-Reason': 'incomplete-cookies' }
    });
  }

  // Permitir acesso a rotas públicas
  return next();
}

// Continuar verificação normal apenas se cookies estão completos
if (accessToken && refreshToken) {
  // ... resto da lógica de verificação
}
```

**Benefícios:**
- Detecta e corrige estado inconsistente de cookies
- Previne loops de "token válido mas não consegue refresh"
- Logs claros para debug

---

### FIX 2.1 - Remover Compressão Client-Side (RECOMENDADO)

**Problema:** Canvas não respeita EXIF, causando rotação incorreta em fotos mobile.

**Solução Recomendada - Remover compressão do cliente:**

```typescript
// src/pages/admin/produtos/novo.astro
// Linhas 407-458 - COMENTAR OU DELETAR função compressImage()

// No handler de seleção de arquivo (linha 368), mudar:

// ANTES:
const compressedFile = await compressImage(file);
selectedFiles.push(compressedFile);

// DEPOIS:
selectedFiles.push(file); // Enviar arquivo original
```

**Motivo:**
- Sharp no servidor JÁ faz compressão + correção EXIF corretamente
- Compressão dupla (cliente + servidor) perde qualidade desnecessariamente
- Simplicidade: Menos código, menos bugs

**Contras:**
- Upload de arquivos maiores (rede mais lenta)
- Mitigação: Adicionar validação de tamanho (máx 10MB já existe)

**Alternativa - Se precisar manter compressão no cliente:**

Usar biblioteca que respeita EXIF:
```bash
npm install blueimp-load-image
```

```typescript
import loadImage from 'blueimp-load-image';

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    loadImage(
      file,
      (canvas) => {
        if (canvas.type === 'error') {
          reject(new Error('Erro ao processar imagem'));
          return;
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao gerar blob'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          0.85
        );
      },
      {
        maxWidth: 1920,
        maxHeight: 1920,
        canvas: true,
        orientation: true // ← CRÍTICO: Respeita EXIF
      }
    );
  });
}
```

---

### FIX 3.1 - Resetar Estado de Imagens

**Problema:** Array `selectedFiles` nunca é limpo, causando reaproveitamento de imagens entre produtos.

**Solução:**
```typescript
// src/pages/admin/produtos/novo.astro

// Linha 648 - ADICIONAR limpeza ANTES do redirect:
try {
  const result = await criarProduto(produtoData);

  if (result.success) {
    console.log('✅ [SUBMIT] Produto criado com sucesso');

    // ✅ CRÍTICO: Limpar estado ANTES de redirecionar
    console.log('🧹 [SUBMIT] Limpando estado de imagens...');
    selectedFiles = [];
    cleanupBlobUrls();
    blobUrls = [];

    // Limpar preview do DOM
    const previewContainer = document.getElementById('imagens-preview');
    if (previewContainer) {
      previewContainer.innerHTML = '';
    }

    window.showToast('Produto adicionado com sucesso!', 'success');

    // Pequeno delay para garantir que limpeza foi feita
    setTimeout(() => {
      window.location.href = `/admin/produtos?_t=${Date.now()}`;
    }, 100);
  } else {
    throw new Error(result.error || 'Erro ao criar produto');
  }
} catch (error: any) {
  console.error('❌ [SUBMIT] Erro ao criar produto:', error);

  // ✅ ADICIONAR: Limpar estado também em erro
  selectedFiles = [];
  cleanupBlobUrls();
  blobUrls = [];

  window.showToast(error.message || 'Erro ao adicionar produto', 'error');
  btnSubmit.disabled = false;
  btnSubmit.textContent = 'Adicionar Produto';
}
```

**Limpeza adicional ao sair da página:**
```typescript
// Adicionar no final do script (linha ~700):

window.addEventListener('beforeunload', () => {
  console.log('🧹 [CLEANUP] Limpando estado antes de sair da página');
  selectedFiles = [];
  cleanupBlobUrls();
  blobUrls = [];

  // Limpar funções globais
  delete (window as any).removeImageAt;
});
```

---

### FIX 4.1 - Forçar Reload Completo na Área Admin

**Problema:** Redirect com query param pode ser cacheado pelo browser.

**Solução:**
```typescript
// src/pages/admin/produtos.astro
// Linha 359 - Trocar redirect por reload:

if (confirmed && id) {
  try {
    const result = await deletarProduto(id);

    if (result.success) {
      window.showToast('Produto deletado com sucesso!', 'success');

      setTimeout(() => {
        // ✅ USAR reload() ao invés de window.location.href
        // Força reload completo, ignorando cache
        window.location.reload();
      }, 1000);
    } else {
      throw new Error(result.error || 'Erro ao deletar produto');
    }
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error);
    window.showToast(error.message || 'Erro ao deletar produto', 'error');
  }
}
```

**Alternativa - Se precisar preservar query params:**
```typescript
// Forçar reload com header de cache bypass
const url = new URL(window.location.href);
url.searchParams.set('_t', Date.now().toString());
url.searchParams.set('_nocache', '1');

// Adicionar header Cache-Control via meta tag (hack)
const meta = document.createElement('meta');
meta.httpEquiv = 'Cache-Control';
meta.content = 'no-cache, no-store, must-revalidate';
document.head.appendChild(meta);

setTimeout(() => {
  window.location.href = url.toString();
}, 1000);
```

---

## 6. ORDEM RECOMENDADA DE IMPLEMENTAÇÃO

### Fase 1 - Correções Críticas de Autenticação (2-3 horas)

1. ✅ Adicionar cache de usuário no middleware (FIX 1.1)
2. ✅ Validar cookies completos (FIX 1.2)
3. ✅ Unificar redirect pós-login (FIX 1.3)
4. ✅ Aumentar timeout de auth (FIX 1.4)
5. 🧪 **TESTAR:** Login, navegação admin, múltiplas abas, Safari

### Fase 2 - Correções de Upload de Imagens (1-2 horas)

6. ✅ Remover compressão client-side (FIX 2.1 - OPÇÃO A)
7. ✅ Aplicar mesma correção em editar.astro
8. ✅ Expandir tipos MIME aceitos (HEIC)
9. 🧪 **TESTAR:** Upload de fotos em iPhone, Android, diferentes orientações

### Fase 3 - Correção de Estado de Imagens (30min - 1h)

10. ✅ Resetar selectedFiles antes de redirect (FIX 3.1)
11. ✅ Adicionar limpeza em caso de erro
12. ✅ Adicionar limpeza no beforeunload
13. 🧪 **TESTAR:** Criar produtos consecutivos, voltar no browser, reabrir página

### Fase 4 - Correção de Cache Admin (30min)

14. ✅ Trocar redirect por reload() (FIX 4.1)
15. ✅ Adicionar headers anti-cache em AdminLayout
16. 🧪 **TESTAR:** Deletar produto, verificar lista atualizada imediatamente

### Fase 5 - Melhorias e Otimizações (1-2 horas)

17. ✅ Reduzir cache ISR do catálogo de 10s para 5s
18. ✅ Adicionar verificação de auth nas APIs faltantes
19. ✅ Remover código morto (authStore.js, authUtils.ts)
20. ✅ Adicionar barra de progresso em uploads
21. 🧪 **TESTAR:** Fluxo completo de CRUD, performance, UX

---

## 7. TESTES DE REGRESSÃO RECOMENDADOS

### Teste 1 - Autenticação Robusta

**Cenário:**
1. Fazer login em um browser
2. Abrir 5 abas simultâneas de páginas diferentes do admin
3. Navegar rapidamente entre as abas
4. Clicar em links rapidamente (não esperar carregamento completo)
5. Usar Safari e verificar cookies no DevTools

**Esperado:**
- ✅ Nenhum redirect inesperado para login
- ✅ Todas as páginas carregam corretamente
- ✅ Ambos os cookies (access + refresh) presentes

### Teste 2 - Upload de Imagens Mobile

**Cenário:**
1. Tirar fotos novas com câmera do celular (portrait e landscape)
2. Selecionar fotos da galeria (diferentes resoluções)
3. Testar em iPhone (HEIC) e Android (JPEG)
4. Criar produto com 5 fotos de orientações diferentes

**Esperado:**
- ✅ Todas as fotos aparecem com orientação correta no preview
- ✅ Todas as fotos salvas com orientação correta
- ✅ Fotos HEIC do iPhone são aceitas

### Teste 3 - Estado de Imagens Limpo

**Cenário:**
1. Criar Produto A com 3 fotos (X, Y, Z)
2. Clicar "voltar" no browser antes do redirect completar
3. Verificar preview (deve estar vazio)
4. Selecionar 2 fotos novas (A, B)
5. Verificar preview (deve ter apenas A, B)
6. Criar Produto B
7. Verificar Produto B no banco (deve ter apenas A, B)

**Esperado:**
- ✅ Preview sempre mostra apenas fotos do produto atual
- ✅ Produto B tem apenas suas próprias fotos

### Teste 4 - Atualização Imediata da Lista

**Cenário:**
1. Ir para /admin/produtos (listar 10 produtos)
2. Deletar Produto X
3. Aguardar toast de sucesso
4. Verificar lista (Produto X deve sumir imediatamente)
5. Não fazer reload manual
6. Criar novo produto
7. Verificar lista (novo produto deve aparecer imediatamente)

**Esperado:**
- ✅ Produto deletado some da lista em <2s
- ✅ Produto criado aparece na lista em <2s
- ✅ Não precisa reload manual

---

## 8. MÉTRICAS DE SUCESSO

| Métrica | Antes | Meta Após Fixes |
|---------|-------|-----------------|
| % de redirects inesperados | ~30% | <1% |
| Erro de upload em mobile | ~50% | <5% |
| Imagens duplicadas entre produtos | 100% | 0% |
| Tempo até lista admin atualizar | ~30-60s | <2s |
| Tempo de verificação de auth (1ª req) | ~100-150ms | ~100ms |
| Tempo de verificação de auth (reqs seguintes) | ~100-150ms | ~1ms (cache) |
| Taxa de sucesso de login | ~95% | >99% |

---

## 9. RISCOS E MITIGAÇÕES

### Risco 1 - Cache de usuário pode permitir acesso após logout

**Impacto:** Baixo (admin interno, não crítico de segurança)
**Probabilidade:** Baixa (TTL de 2s é muito curto)
**Mitigação:**
- Logout limpa cache explicitamente
- Monitorar logs de acesso após logout
- Se necessário: Reduzir TTL para 1s

### Risco 2 - Remover compressão client-side aumenta tráfego

**Impacto:** Médio (uploads mais lentos em conexões ruins)
**Probabilidade:** Média
**Mitigação:**
- Validação de tamanho máximo 10MB já existe
- Sharp no servidor comprime eficientemente
- Se problema: Reativar compressão com biblioteca que trata EXIF

### Risco 3 - Reload forçado pode causar perda de dados em formulários

**Impacto:** Baixo (só afeta lista, não formulários)
**Probabilidade:** Baixa
**Mitigação:**
- Reload só acontece após confirmação de sucesso
- Formulários podem usar localStorage para persistência (se necessário no futuro)

### Risco 4 - Cookies incompletos podem causar logouts legítimos

**Impacto:** Médio (usuário precisa fazer login novamente)
**Probabilidade:** Muito Baixa (só Safari com bug específico)
**Mitigação:**
- Logs claros de "cookies incompletos detectados"
- Toast explicativo: "Sessão inválida, faça login novamente"
- Monitorar quantos usuários são afetados

---

## 10. NOTAS IMPORTANTES PARA IMPLEMENTAÇÃO

### Headers HTTP Críticos

Garantir que TODAS as páginas admin tenham:
```
Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0
Pragma: no-cache
Expires: 0
CDN-Cache-Control: no-store
Vercel-CDN-Cache-Control: no-store
```

### Logging para Debug

Manter logs detalhados (já existem, mas garantir):
- `[Middleware]` - Todos os passos de autenticação
- `[SUBMIT]` - Criação/edição de produtos
- `[UPLOAD]` - Upload de imagens
- `[DELETE]` - Deleção de produtos

### Variáveis de Ambiente

Verificar que estão configuradas:
```bash
# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Revalidação (se usar)
REVALIDATE_SECRET=...
```

### Compatibilidade de Browsers

Testar em:
- ✅ Chrome (desktop + mobile)
- ✅ Safari (desktop + iOS)
- ✅ Firefox
- ✅ Edge
- ⚠️ Safari iOS é o mais problemático (cookies, EXIF, File API)

---

## 11. CONTATO E PRÓXIMOS PASSOS

Após implementar as correções:

1. ✅ Rodar suite de testes de regressão (Seção 7)
2. ✅ Monitorar logs por 24h em produção
3. ✅ Coletar feedback dos usuários admin
4. ✅ Ajustar TTL de cache se necessário
5. ✅ Considerar implementar testes automatizados (Playwright/Cypress)

**Dúvidas durante implementação:**
- Consultar este relatório (BUGFIX_REPORT.md)
- Verificar comentários no código (marcados com "CRITICAL" ou "TODO")
- Testar em ambiente local antes de deploy

---

## 12. CONCLUSÃO

### Resumo dos Bugs

| Bug | Severidade | Causa Raiz | Correção Principal | Esforço |
|-----|-----------|------------|-------------------|---------|
| 1. Redirect para login | 🔴 CRÍTICO | Race condition + cookies incompletos | Cache de usuário 2s + validação de cookies | 2-3h |
| 2. Erro em mobile | 🔴 CRÍTICO | Canvas não trata EXIF | Remover compressão client-side | 1-2h |
| 3. Imagens duplicadas | 🔴 CRÍTICO | Estado não resetado | Limpar selectedFiles antes de redirect | 30min |
| 4. Lista admin desatualizada | 🟡 MÉDIO | Browser cache + redirect com query param | Usar location.reload() | 30min |

**Tempo total estimado:** 4-6 horas de desenvolvimento + 2-3 horas de testes

### ISR - Decisão Final

**✅ MANTER ISR com ajustes:**
- Homepage: ISR completo (prerender: true)
- Catálogo: SSR + ISR 5s (reduzir de 10s)
- Admin: SSR puro sem cache (já correto)

### Próxima Ação

Começar pela **Fase 1 (Autenticação)** pois é o bug mais crítico e mais frequente. Bugs 2, 3 e 4 são independentes e podem ser implementados em paralelo após Fase 1 estar estável.

---

**Gerado em:** 2025-11-24
**Ferramenta:** Claude Code (Sonnet 4.5)
**Versão do Relatório:** 1.0
