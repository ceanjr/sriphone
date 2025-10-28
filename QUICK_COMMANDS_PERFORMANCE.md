# ⚡ COMANDOS RÁPIDOS - Otimização de Performance

Guia de comandos prontos para copiar e executar durante a otimização.

---

## 🚀 SETUP INICIAL

### 1. Backup e Branch

```bash
# Fazer backup
git add .
git commit -m "backup antes otimização de performance"
git push

# Criar branch de trabalho
git checkout -b feature/performance-optimization

# Criar tag de referência
git tag baseline-performance
```

### 2. Instalar Ferramentas

```bash
# Ferramentas de análise
npm install -D @lhci/cli vite-bundle-visualizer
npm install -g lighthouse ttf2woff2 glyphhanger

# Web Vitals (opcional)
npm install web-vitals
```

---

## 📊 ANÁLISE INICIAL

### Lighthouse Baseline

```bash
# Build
npm run build

# Servir
npx serve dist -p 3000 &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 3

# Rodar Lighthouse (Desktop)
npx lighthouse http://localhost:3000 \
  --preset=desktop \
  --output=html \
  --output=json \
  --output-path=./reports/lighthouse-baseline-desktop

# Rodar Lighthouse (Mobile)
npx lighthouse http://localhost:3000 \
  --preset=mobile \
  --output=html \
  --output=json \
  --output-path=./reports/lighthouse-baseline-mobile

# Matar servidor
kill $SERVER_PID

# Ver relatórios
open reports/lighthouse-baseline-desktop.html
open reports/lighthouse-baseline-mobile.html
```

### Bundle Analysis

```bash
# Analisar bundle
npm run build -- --stats

# Visualizar (abre no browser)
npx vite-bundle-visualizer

# Ver tamanhos
du -sh dist
find dist -type f -name "*.js" -o -name "*.css" | xargs du -h | sort -h

# Top 10 maiores arquivos
find dist -type f -exec du -h {} \; | sort -rh | head -10
```

### Coverage Analysis (Chrome DevTools)

```bash
# 1. npm run preview
# 2. Abrir Chrome DevTools (F12)
# 3. Cmd+Shift+P → "Show Coverage"
# 4. Refresh página
# 5. Ver CSS/JS não usado em vermelho
```

---

## 🔴 PRIORIDADE 1: API ROUTES

### Criar Estrutura

```bash
# Criar diretórios
mkdir -p src/pages/api
mkdir -p src/lib/cache

# Criar arquivo de API
cat > src/pages/api/produtos.ts << 'EOF'
import type { APIRoute } from 'astro'
import { productService } from '../../lib/supabase'

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor')
  const limit = parseInt(url.searchParams.get('limit') || '30')
  const categoria = url.searchParams.get('categoria')
  
  let result
  if (categoria && categoria !== 'todos') {
    result = await productService.getByCategory(categoria, cursor, limit)
  } else {
    result = await productService.getPaginated(cursor, limit)
  }
  
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}
EOF

echo "✅ API route criada: src/pages/api/produtos.ts"
```

### Testar API Route

```bash
# Build e preview
npm run build
npm run preview &
sleep 3

# Testar endpoint
curl http://localhost:4321/api/produtos?limit=5 | jq '.produtos | length'
# Deve retornar: 5

curl http://localhost:4321/api/produtos?categoria=some-id&limit=10 | jq '.produtos'

# Matar preview
killall node
```

---

## 🔴 PRIORIDADE 2: HYBRID RENDERING

### Atualizar Config

```bash
# Backup do config atual
cp astro.config.mjs astro.config.mjs.bak

# Mudar output para hybrid
sed -i.bak "s/output: 'server'/output: 'hybrid'/" astro.config.mjs

# Verificar mudança
git diff astro.config.mjs

# Commit
git add astro.config.mjs
git commit -m "feat: mudar para hybrid rendering"
```

### Adicionar Prerender

```bash
# Adicionar export const prerender = true nas páginas

# catalogo.astro
sed -i '' '/^import/a\
export const prerender = true\
' src/pages/catalogo.astro

# Verificar
head -10 src/pages/catalogo.astro
```

### Testar Build

```bash
# Build com hybrid
npm run build

# Verificar se gerou arquivos estáticos
ls -lh dist/catalogo/

# Verificar tamanho
du -sh dist

# Preview
npm run preview
```

---

## 🖼️ PRIORIDADE 3: OTIMIZAR IMAGENS

### Converter Hero para Múltiplos Tamanhos

```bash
# Instalar sharp-cli
npm install -g sharp-cli

cd public/images

# Gerar múltiplos tamanhos do Barbudo.webp
sharp -i Barbudo.webp -o Barbudo-50.webp resize 50 50
sharp -i Barbudo.webp -o Barbudo-100.webp resize 100 100
sharp -i Barbudo.webp -o Barbudo-150.webp resize 150 150

# Verificar tamanhos
ls -lh Barbudo*.webp

cd ../..
```

### Otimizar Todas as Imagens

```bash
# Instalar squoosh-cli
npm install -g @squoosh/cli

# Otimizar todas as imagens
squoosh-cli \
  --webp '{"quality":85}' \
  --resize '{"enabled":true,"width":800}' \
  -d public/images/optimized \
  public/images/*.{jpg,jpeg,png}

# Comparar tamanhos
du -sh public/images/
du -sh public/images/optimized/
```

---

## 🔤 PRIORIDADE 4: CONVERTER FONTE

### OTF → WOFF2

```bash
cd public/fonts

# Converter
ttf2woff2 Halenoir-Bold.otf

# Verificar tamanho
ls -lh Halenoir-Bold.*

# Subset (apenas caracteres usados)
glyphhanger \
  --subset=Halenoir-Bold.otf \
  --formats=woff2 \
  --whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ÁÉÍÓÚáéíóúÂÊÔâêôÃÕãõÇç.,:;!?-()"

# Renomear subset
mv Halenoir-Bold-subset.woff2 Halenoir-Bold-subset.woff2

cd ../..

# Atualizar CSS
# Editar manualmente src/styles/global.css
```

---

## 🧪 TESTES E VALIDAÇÃO

### Lighthouse Após Mudanças

```bash
# Build
npm run build

# Preview
npm run preview &
SERVER_PID=$!
sleep 3

# Lighthouse
npx lighthouse http://localhost:4321 \
  --preset=desktop \
  --output=html \
  --output-path=./reports/lighthouse-after-$(date +%Y%m%d-%H%M).html

# Ver relatório
open reports/lighthouse-after-*.html

# Matar servidor
kill $SERVER_PID
```

### Comparar Antes/Depois

```bash
# Comparar JSONs do Lighthouse
npx lighthouse-ci compare \
  reports/lighthouse-baseline-desktop.json \
  reports/lighthouse-after-*.json
```

### Web Vitals Real User Monitoring

```bash
# Adicionar script no Layout.astro
cat >> src/layouts/Layout.astro << 'EOF'
<script>
  import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
  
  function sendToAnalytics(metric) {
    console.log(metric)
    // Enviar para analytics
    if (window.va) {
      window.va.track('Web Vitals', metric)
    }
  }
  
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
</script>
EOF
```

### Performance Budget

```bash
# Criar lighthouserc.js
cat > lighthouserc.js << 'EOF'
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4321/', 'http://localhost:4321/catalogo'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
}
EOF

# Rodar com budget
npm run build
npm run preview &
sleep 3
npx lhci autorun
killall node
```

---

## 🔍 DEBUG E ANÁLISE

### Ver Requests no Build

```bash
# Build verboso
ASTRO_TELEMETRY_DISABLED=1 npm run build -- --verbose
```

### Analisar Supabase Queries

```bash
# Ver queries no log (se tiver logging habilitado)
grep -r "supabase" .astro/

# Analisar tempo de build
time npm run build

# Profile build
NODE_ENV=production node --prof $(which astro) build
node --prof-process isolate-*.log > profile.txt
less profile.txt
```

### Network Waterfall

```bash
# Chrome DevTools Network tab
# 1. npm run preview
# 2. Abrir DevTools (F12)
# 3. Network tab
# 4. Disable cache
# 5. Throttling: Fast 3G
# 6. Reload
# 7. Exportar HAR: Save all as HAR
```

### Memory Leaks

```bash
# Chrome DevTools Memory tab
# 1. npm run preview
# 2. Abrir DevTools
# 3. Memory tab → Heap snapshot
# 4. Take snapshot (antes)
# 5. Interagir com o site
# 6. Take snapshot (depois)
# 7. Comparison → ver leaks
```

---

## 📦 OTIMIZAÇÃO CSS

### Analisar CSS Não Usado

```bash
# Instalar PurgeCSS
npm install -D @fullhuman/postcss-purgecss

# Analisar
npx purgecss \
  --css dist/**/*.css \
  --content dist/**/*.html \
  --output reports/purged-css/

# Comparar tamanhos
du -sh dist/_astro/*.css
du -sh reports/purged-css/*.css
```

### Tailwind Purge

```bash
# Verificar configuração do Tailwind
cat tailwind.config.mjs

# Rebuild com purge ativo
NODE_ENV=production npm run build

# Ver tamanho do CSS
find dist -name "*.css" -exec du -h {} \;
```

---

## 🚀 DEPLOY E MONITORAMENTO

### Deploy Vercel

```bash
# Commit mudanças
git add .
git commit -m "perf: implementar otimizações de performance"
git push origin feature/performance-optimization

# Deploy preview
npx vercel

# Deploy produção
npx vercel --prod

# Ver logs
npx vercel logs
```

### Monitorar Web Vitals no Vercel

```bash
# Ver analytics
open https://vercel.com/dashboard/analytics

# Ver Speed Insights
# Dashboard → projeto → Speed Insights
```

### Configurar Alerts

```bash
# Criar workflow para CI
mkdir -p .github/workflows

cat > .github/workflows/lighthouse-ci.yml << 'EOF'
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm install -g @lhci/cli
      - run: |
          npm run preview &
          sleep 5
          lhci autorun --upload.target=temporary-public-storage
EOF

git add .github/workflows/lighthouse-ci.yml
git commit -m "ci: adicionar lighthouse ci"
git push
```

---

## 🔄 ROLLBACK (Se Algo Der Errado)

### Reverter Mudanças

```bash
# Ver commits
git log --oneline -10

# Reverter último commit
git revert HEAD

# Ou resetar para commit específico
git reset --hard <commit-hash>

# Force push (cuidado!)
git push -f origin feature/performance-optimization
```

### Restaurar Backup

```bash
# Restaurar config
cp astro.config.mjs.bak astro.config.mjs

# Rebuild
npm run build

# Deploy
npx vercel --prod
```

---

## 📊 RELATÓRIO FINAL

### Gerar Relatório Completo

```bash
# Criar pasta de relatórios
mkdir -p reports/final

# Lighthouse
npm run build
npm run preview &
sleep 3

npx lighthouse http://localhost:4321 \
  --preset=desktop \
  --output=html \
  --output-path=reports/final/lighthouse-desktop.html

npx lighthouse http://localhost:4321 \
  --preset=mobile \
  --output=html \
  --output-path=reports/final/lighthouse-mobile.html

killall node

# Bundle
npx vite-bundle-visualizer --open false --filename reports/final/bundle-analysis.html

# Tamanhos
du -sh dist > reports/final/sizes.txt
find dist -type f -exec du -h {} \; | sort -rh | head -20 >> reports/final/sizes.txt

# Git diff
git diff --stat baseline-performance > reports/final/changes.txt

# Abrir relatórios
open reports/final/
```

### Comparativo Antes/Depois

```bash
# Criar tabela comparativa
cat > reports/final/comparison.md << 'EOF'
# Comparativo de Performance

## Lighthouse Scores

| Métrica | Antes | Depois | Melhora |
|---------|-------|--------|---------|
| Performance | XX | YY | +ZZ% |
| FCP | XXms | YYms | -ZZ% |
| LCP | XXms | YYms | -ZZ% |
| TBT | XXms | YYms | -ZZ% |
| CLS | X.XX | Y.YY | -ZZ% |

## Bundle Size

| Tipo | Antes | Depois | Redução |
|------|-------|--------|---------|
| JS | XXkB | YYkB | -ZZ% |
| CSS | XXkB | YYkB | -ZZ% |
| Total | XXkB | YYkB | -ZZ% |

## Mudanças Implementadas

- [ ] Supabase movido para server-side
- [ ] Paginação implementada
- [ ] Imagens otimizadas
- [ ] Hybrid rendering configurado
- [ ] Fonte convertida para WOFF2
- [ ] Critical CSS expandido
- [ ] Cache híbrido implementado
EOF

# Editar com valores reais
code reports/final/comparison.md
```

---

## ✅ CHECKLIST FINAL

```bash
# Executar todos os checks
cat > scripts/check-performance.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 Verificando Performance..."

# 1. Build
echo "📦 Building..."
npm run build

# 2. Tamanho
echo "📊 Verificando tamanho do bundle..."
BUNDLE_SIZE=$(du -sk dist | cut -f1)
if [ $BUNDLE_SIZE -gt 1024 ]; then
  echo "⚠️  Bundle muito grande: ${BUNDLE_SIZE}KB (max 1MB)"
else
  echo "✅ Bundle size OK: ${BUNDLE_SIZE}KB"
fi

# 3. Lighthouse
echo "🚦 Rodando Lighthouse..."
npm run preview &
SERVER_PID=$!
sleep 5

SCORE=$(npx lighthouse http://localhost:4321 --preset=desktop --quiet --output=json | jq '.categories.performance.score * 100')

kill $SERVER_PID

if [ $(echo "$SCORE < 90" | bc) -eq 1 ]; then
  echo "❌ Lighthouse Score baixo: $SCORE (min 90)"
  exit 1
else
  echo "✅ Lighthouse Score OK: $SCORE"
fi

echo "✅ Todos os checks passaram!"
EOF

chmod +x scripts/check-performance.sh
./scripts/check-performance.sh
```

---

## 🎯 COMANDOS MAIS USADOS

### Durante Desenvolvimento

```bash
# Build + Preview + Lighthouse
npm run build && npm run preview & sleep 3 && npx lighthouse http://localhost:4321 --view && killall node

# Watch bundle size
watch -n 5 'du -sh dist'

# Test API
curl http://localhost:4321/api/produtos?limit=5 | jq

# Check types
npm run astro check
```

### Troubleshooting

```bash
# Limpar caches
rm -rf node_modules/.vite
rm -rf .astro
rm -rf dist

# Reinstalar
npm ci

# Rebuild limpo
npm run build -- --clean

# Ver erros de build
npm run build 2>&1 | tee build.log
```

---

**💡 Dica:** Salve este arquivo e use como referência rápida durante a otimização!

---

_Última atualização: 28/10/2025_
