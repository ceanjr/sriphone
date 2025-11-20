# 🔧 Troubleshooting - JavaScript não funciona em Dev

## ⚡ SOLUÇÕES RÁPIDAS (Tente nesta ordem)

### 1. **Limpar tudo e reiniciar**
```bash
# Limpar cache e processos
pkill -f "astro dev"
npm run clean
npm run dev
```

### 2. **Usar build + preview (ALTERNATIVA RECOMENDADA)**
```bash
# Mais estável que dev mode
npm run dev:build
```
Isso faz build completo e depois preview. JavaScript funcionará 100%.

### 3. **Modo debug verbose**
```bash
npm run dev:debug
```
Mostra logs detalhados para identificar o problema.

---

## 🔍 DIAGNÓSTICO COMPLETO

### Passo 1: Execute o diagnóstico
```bash
npm run diagnose
# ou
./debug-dev.sh
```

### Passo 2: Verifique o navegador

Abra DevTools (F12) e verifique:

#### **Console Tab:**
- Há erros em vermelho?
- Copie e cole aqui qualquer erro

#### **Network Tab:**
- Filtre por "JS"
- Algum arquivo .js está com status 404 ou erro?
- Arquivos estão sendo carregados?

#### **Sources Tab:**
- Expanda `localhost:4321` → `_astro`
- Os arquivos .js estão lá?
- Consegue ver o código fonte?

#### **Application Tab:**
- Service Workers → Deve estar vazio em dev
- Cache Storage → Limpe tudo
- Local Storage → Limpe se houver lixo

---

## 🐛 ERROS COMUNS E SOLUÇÕES

### Erro: "Cannot find module"
```bash
rm -rf node_modules
npm install
npm run dev
```

### Erro: "Port 4321 is already in use"
```bash
pkill -f "astro dev"
# ou
lsof -ti:4321 | xargs kill
```

### Erro: Scripts não carregam (404)
```bash
rm -rf dist .astro node_modules/.vite
npm run dev
```

### Erro: "fetch failed" ou CORS
Verifique se `.env` tem as variáveis corretas:
```bash
cat .env | grep PUBLIC_
```

---

## 🚀 ALTERNATIVAS PARA DESENVOLVIMENTO

### Opção 1: Build + Preview (RECOMENDADO)
```bash
npm run dev:build
```

**Prós:**
- ✅ JavaScript funciona 100%
- ✅ Mais estável que dev mode
- ✅ Preview em http://localhost:4321

**Contras:**
- ⏱️ Rebuild necessário após mudanças (15-30s)
- Use `npm run build && npm run preview` após cada alteração

### Opção 2: Watch + Preview
```bash
# Terminal 1 - Watch para rebuild automático
npm run build -- --watch

# Terminal 2 - Preview server
npm run preview
```

### Opção 3: Dev normal com logs
```bash
npm run dev:debug 2>&1 | tee dev.log
```
Salva todos os logs em `dev.log` para análise.

---

## 📊 CHECKLIST DE DEBUG

Execute este checklist e anote os resultados:

- [ ] Executei `npm run diagnose`
- [ ] Limpei cache: `npm run clean`
- [ ] Matei processos: `pkill -f "astro dev"`
- [ ] Limpei cache do navegador (Ctrl+Shift+Del)
- [ ] Removi Service Workers (DevTools → Application)
- [ ] Verifiquei console do navegador (F12)
- [ ] Tentei `npm run dev:build`
- [ ] Logs do servidor não mostram erros

---

## 🔬 COLETA DE INFORMAÇÕES PARA DEBUG

Se nada funcionar, colete estas informações:

### 1. Logs do servidor
```bash
npm run dev:debug 2>&1 | head -100 > server-logs.txt
```

### 2. Erros do navegador
- Abra DevTools (F12)
- Console → Copie TODOS os erros
- Network → Screenshot de arquivos .js

### 3. Configuração atual
```bash
cat astro.config.mjs > config-backup.txt
cat package.json > package-backup.txt
env | grep PUBLIC_ > env-vars.txt
```

### 4. Estado dos arquivos
```bash
ls -la src/lib/supabase.ts
ls -la src/pages/catalogo.astro
```

---

## 📞 ÚLTIMA OPÇÃO: Reconstrução Total

Se absolutamente nada funcionar:

```bash
# 1. Backup do código
cp -r src src-backup

# 2. Limpar TUDO
rm -rf node_modules dist .astro node_modules/.vite
rm package-lock.json

# 3. Reinstalar do zero
npm install

# 4. Tentar dev
npm run dev

# 5. Se não funcionar, usar build+preview
npm run dev:build
```

---

## 💡 DICAS IMPORTANTES

1. **Use build+preview para desenvolvimento urgente**
   - É mais lento mas funciona 100%
   - Comando: `npm run dev:build`

2. **Sempre limpe cache antes de testar**
   - Comando: `npm run clean`

3. **Verifique logs do NAVEGADOR, não só do servidor**
   - 90% dos problemas aparecem no console do navegador

4. **Service Worker é o demônio em dev**
   - Sempre desregistre em Application → Service Workers

---

## ❓ PERGUNTAS PARA DEBUG

Responda estas perguntas:

1. **Há ALGUM erro no console do navegador?**
   - Sim/Não → Se sim, qual?

2. **Arquivos .js aparecem na aba Network?**
   - Sim/Não → Se não, problema no build

3. **Service Workers está vazio em Application?**
   - Sim/Não → Se não, limpe

4. **`npm run dev:build` funciona?**
   - Sim/Não → Se sim, problema é específico do dev mode

5. **Qual navegador está usando?**
   - Chrome/Firefox/Safari → Teste em outro navegador

---

## 🎯 SOLUÇÃO TEMPORÁRIA GARANTIDA

Enquanto debugamos o `npm run dev`, use isto:

```bash
# Crie um alias
alias dev-work="npm run build && npm run preview"

# Use assim
dev-work
```

Após cada mudança no código:
1. Ctrl+C para parar o preview
2. Execute `dev-work` novamente
3. Espere 15-30s
4. Teste no navegador

**Isso funciona 100% enquanto resolvemos o dev mode.**
