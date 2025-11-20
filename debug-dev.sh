#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "🔍 DIAGNÓSTICO COMPLETO - Modo de Desenvolvimento"
echo "════════════════════════════════════════════════════════"
echo ""

# 1. Verificar Node e npm
echo "1️⃣ Versões instaladas:"
echo "   Node: $(node -v)"
echo "   npm: $(npm -v)"
echo ""

# 2. Verificar variáveis de ambiente
echo "2️⃣ Variáveis de ambiente:"
if [ -f .env ]; then
    echo "   ✅ Arquivo .env encontrado"
    echo "   Variáveis definidas:"
    grep -E "^PUBLIC_" .env | cut -d= -f1 | sed 's/^/      - /'
else
    echo "   ❌ Arquivo .env NÃO encontrado"
fi
echo ""

# 3. Verificar dependências
echo "3️⃣ Dependências críticas:"
npm list @supabase/supabase-js 2>/dev/null | grep @supabase || echo "   ❌ Supabase não instalado"
npm list astro 2>/dev/null | grep astro || echo "   ❌ Astro não instalado"
echo ""

# 4. Limpar cache e reinstalar
echo "4️⃣ Limpando cache..."
rm -rf node_modules/.vite 2>/dev/null && echo "   ✅ Cache Vite limpo" || echo "   ⚠️ Cache Vite não encontrado"
rm -rf dist 2>/dev/null && echo "   ✅ Pasta dist removida" || echo "   ⚠️ Pasta dist não encontrada"
rm -rf .astro 2>/dev/null && echo "   ✅ Cache Astro limpo" || echo "   ⚠️ Cache Astro não encontrado"
echo ""

# 5. Verificar portas em uso
echo "5️⃣ Portas em uso:"
PORT_4321=$(lsof -ti:4321 2>/dev/null)
if [ -n "$PORT_4321" ]; then
    echo "   ⚠️ Porta 4321 em uso (PID: $PORT_4321)"
    echo "   Execute: kill $PORT_4321"
else
    echo "   ✅ Porta 4321 disponível"
fi
echo ""

# 6. Verificar Service Worker residual no Chrome
echo "6️⃣ Service Worker:"
echo "   ⚠️ IMPORTANTE: Abra Chrome DevTools e:"
echo "      1. Application → Service Workers"
echo "      2. Clique em 'Unregister' em todos"
echo "      3. Limpe o cache (Ctrl+Shift+Del)"
echo ""

# 7. Testar configuração Astro
echo "7️⃣ Configuração Astro:"
if [ -f astro.config.mjs ]; then
    echo "   ✅ astro.config.mjs encontrado"
    echo "   Verificando NODE_ENV:"
    echo "      Current: ${NODE_ENV:-'undefined'}"
else
    echo "   ❌ astro.config.mjs NÃO encontrado"
fi
echo ""

echo "════════════════════════════════════════════════════════"
echo "📋 PRÓXIMOS PASSOS:"
echo "════════════════════════════════════════════════════════"
echo ""
echo "1. Execute este comando para limpar tudo:"
echo "   rm -rf node_modules/.vite dist .astro"
echo ""
echo "2. Mate processos na porta 4321:"
echo "   pkill -f 'astro dev'"
echo ""
echo "3. Tente iniciar o dev server:"
echo "   npm run dev"
echo ""
echo "4. Se ainda não funcionar, teste o build:"
echo "   npm run build && npm run preview"
echo ""
echo "════════════════════════════════════════════════════════"
