# 📊 Setup: Sistema de Visualizações

Sistema implementado para rastrear visualizações de usuários **NÃO AUTENTICADOS** no site e exibir no dashboard admin.

---

## 🎯 O que foi implementado:

### 1. ✅ Tabela no Banco de Dados
- Tabela `site_views` para armazenar visualizações
- Campos: session_id, page_url, referer, user_agent, ip_address, created_at
- Índices otimizados para performance
- RLS (Row Level Security) configurado

### 2. ✅ API para Registrar Visualizações
- Endpoint: `POST /api/track-view`
- Registra visualização no banco
- Valida sessionId

### 3. ✅ Tracking Automático no Site
- Script no Layout.astro
- Detecta usuários NÃO autenticados
- Gera sessionId único por visitante
- Throttle de 30 segundos entre registros
- Logs no console para debug

### 4. ✅ Dashboard Atualizado
- Métrica "Total de Visualizações"
- Conta apenas visualizações do **mês atual**
- Atualiza automaticamente

---

## 🚀 PASSO 1: Executar SQL no Supabase

### Acesse o Supabase SQL Editor:

1. Entre em: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Cole o SQL abaixo e execute:

```sql
-- Copie todo o conteúdo do arquivo:
-- supabase-migrations/create_site_views_table.sql
```

**Ou use o arquivo:**
```bash
cat supabase-migrations/create_site_views_table.sql
```

### ✅ Verificar se funcionou:

Execute este query:
```sql
SELECT
  'Tabela criada!' as status,
  COUNT(*) as total_views
FROM site_views;
```

Deve retornar: `status: "Tabela criada!", total_views: 0`

---

## 🧪 PASSO 2: Testar o Tracking

### 1. Abra o site em **modo anônimo** (Ctrl+Shift+N)

```
http://localhost:4321
```

### 2. Abra DevTools (F12) → Console

Deve ver:
```
[View Tracking] Visualização registrada
```

### 3. Verifique no banco de dados:

```sql
SELECT * FROM site_views ORDER BY created_at DESC LIMIT 10;
```

Deve mostrar sua visualização!

---

## 📊 PASSO 3: Ver no Dashboard

### 1. Faça login no admin

```
http://localhost:4321/admin/login
```

### 2. Acesse o Dashboard

```
http://localhost:4321/admin/dashboard
```

### 3. Verifique o card "Total de Visualizações"

Deve mostrar o número de visualizações do mês atual!

---

## 🔍 Como Funciona:

### Fluxo de Tracking:

1. **Usuário acessa o site (não autenticado)**
   - Script no Layout.astro detecta
   - Verifica cookies de autenticação

2. **Gera/Recupera SessionID**
   - Armazena em `localStorage`
   - Único por visitante

3. **Verifica Throttle**
   - Só registra se passaram 30s desde última view
   - Evita spam

4. **Envia para API**
   ```
   POST /api/track-view
   {
     "sessionId": "session_xxx",
     "pageUrl": "/catalogo",
     "referer": "https://google.com"
   }
   ```

5. **API Salva no Banco**
   - Tabela `site_views`
   - Com timestamp UTC

6. **Dashboard Busca Dados**
   - Endpoint `/api/admin/metricas`
   - Filtra por mês atual
   - Conta total de registros

---

## ⚙️ Configurações:

### Throttle (tempo mínimo entre visualizações):
```javascript
// src/layouts/Layout.astro, linha 205
if (lastView && (now - parseInt(lastView)) < 30000) {
  // 30000 = 30 segundos
```

### Filtro de Mês:
```typescript
// src/pages/api/admin/metricas.ts, linha 19
const inicioMes = new Date();
inicioMes.setDate(1);
inicioMes.setHours(0, 0, 0, 0);
```

---

## 🐛 Debug:

### Ver logs no console:
```javascript
console.log('[View Tracking] ...')
```

### Forçar novo registro:
```javascript
// No console do browser
sessionStorage.removeItem('last_view_time');
location.reload();
```

### Ver sessionId atual:
```javascript
localStorage.getItem('visitor_session_id')
```

### Limpar tudo e começar do zero:
```javascript
localStorage.removeItem('visitor_session_id');
sessionStorage.removeItem('last_view_time');
location.reload();
```

---

## 📈 Queries Úteis:

### Total de visualizações hoje:
```sql
SELECT COUNT(*) as views_hoje
FROM site_views
WHERE created_at >= CURRENT_DATE;
```

### Visualizações por dia (últimos 30 dias):
```sql
SELECT
  DATE(created_at) as dia,
  COUNT(*) as visualizacoes
FROM site_views
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;
```

### Top 10 páginas mais visitadas:
```sql
SELECT
  page_url,
  COUNT(*) as visualizacoes
FROM site_views
GROUP BY page_url
ORDER BY visualizacoes DESC
LIMIT 10;
```

### Visitantes únicos (por sessionId):
```sql
SELECT
  COUNT(DISTINCT session_id) as visitantes_unicos
FROM site_views
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);
```

---

## ✅ Checklist:

- [ ] SQL executado no Supabase
- [ ] Tabela `site_views` criada
- [ ] Código commitado e deployed
- [ ] Testado em modo anônimo
- [ ] Visualização registrada no banco
- [ ] Dashboard mostrando número correto
- [ ] Logs aparecendo no console

---

## 🎉 Pronto!

O sistema de visualizações está funcionando! Cada vez que um usuário não autenticado acessar o site, será contabilizado automaticamente.

**Observação:** Usuários autenticados (admin) NÃO são contabilizados para manter métricas limpas.
