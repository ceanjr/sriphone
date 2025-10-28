# 🐛 DEBUG - Problema de Carregamento dos Produtos

**Status:** Em investigação  
**Problema:** Produtos ficam em "Carregando produtos..." eternamente  
**Data:** 28/10/2025 14:05 UTC

---

## 🔍 O QUE FOI FEITO

### 1. Correções Aplicadas ✅
- ✅ Removidos arquivos duplicados de API (já existiam em pastas)
- ✅ Corrigido JSON inline: usa `set:html` agora
- ✅ Corrigido parse: `innerHTML` ou `textContent`
- ✅ Adicionados logs de debug no console

### 2. Verificações Realizadas ✅
- ✅ Build funciona sem erros
- ✅ Dados estão sendo injetados no HTML corretamente (15 produtos)
- ✅ Script `initial-data` está presente na página
- ✅ Funções `carregarDados()` e `render.produtos()` existem

---

## 📊 DADOS NO HTML

O HTML gerado contém:

```html
<script type="application/json" id="initial-data">
{
  "produtos": [
    {"id":"51026c48...","nome":"iPhone 12 128 GB - Azul",...}, 
    ... (15 produtos total)
  ],
  "nextCursor": null,
  "categorias": [
    {"id":"380662b7...","nome":"iPhone 11",...},
    ... (9 categorias total)
  ]
}
</script>
```

✅ **Dados estão corretos no HTML!**

---

## 🎯 PRÓXIMO PASSO: TESTAR NO NAVEGADOR

### Como Testar

1. **Abrir no navegador:**
   ```
   http://localhost:4323/catalogo
   ```

2. **Abrir DevTools (F12)**

3. **Ir na aba Console**

4. **Verificar os logs:**
   ```
   🔍 initialDataEl: <script...>
   📦 initialData: {produtos: Array(15), categorias: Array(9), nextCursor: null}
   📦 Produtos: 15
   📦 Categorias: 9
   🚀 Iniciando carregarDados...
   📊 State produtos: 15
   ✅ Usando dados iniciais
   ```

5. **Se aparecer erro, copiar e enviar**

---

## 🔍 POSSÍVEIS CAUSAS

### Se os logs mostrarem:
- **`initialDataEl: null`** → Script não foi encontrado
- **`Produtos: 0`** → Parse falhou
- **Erro de sintaxe** → JSON inválido
- **`render is not defined`** → Função render não existe
- **Nada no console** → Script não está executando

---

## 🛠️ COMANDOS ÚTEIS

### Reiniciar dev server
```bash
# Parar
pkill -f "astro dev"

# Iniciar
cd /home/ceanbrjr/Dev/sriphone
npm run dev
```

### Ver HTML gerado
```bash
# SSG
cat dist/static/catalogo/index.html | grep "initial-data" -A 1

# Dev mode
curl http://localhost:4323/catalogo | grep "initial-data" -A 1
```

### Ver logs do servidor
```bash
tail -f /tmp/dev.log
```

---

## 💡 SOLUÇÕES ALTERNATIVAS

### Se o problema persistir:

#### Opção 1: Forçar dados via window
```javascript
// Adicionar antes do script principal
window.__INITIAL_DATA__ = {
  produtos: [...],
  categorias: [...]
};

// No script
const initialData = window.__INITIAL_DATA__ || {};
```

#### Opção 2: Usar atributo data-*
```html
<div id="app" data-produtos='[...]'></div>
```

```javascript
const app = document.getElementById('app');
const produtos = JSON.parse(app.dataset.produtos);
```

#### Opção 3: Buscar da API sempre
```javascript
// Remover lógica de dados iniciais
// Sempre usar fetch('/api/produtos')
```

---

## 📝 CHECKLIST DE DEBUG

- [x] Build funciona
- [x] HTML contém dados
- [x] Script está presente
- [ ] Console mostra logs ← **ESTAMOS AQUI**
- [ ] Dados são parseados
- [ ] render.produtos() é chamado
- [ ] Produtos aparecem na tela

---

## 🚀 QUANDO RESOLVER

1. Remover logs de debug
2. Commitar correção final
3. Continuar com otimizações:
   - Remover Supabase dos componentes admin
   - Otimizar imagens
   - Converter fonte WOFF2

---

**Status:** ⏳ Aguardando teste no navegador  
**Próximo:** Abrir console e verificar logs
