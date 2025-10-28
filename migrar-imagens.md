# 🔄 Migração de Imagens - 16 Produtos

## 📋 Objetivo
Converter as imagens existentes dos 16 produtos para 3 variantes otimizadas (thumbnail, medium, large) em WebP.

---

## 🚀 Passos Simples

### 1. Backup (5 min)
```bash
# Exportar produtos do Supabase Dashboard
# Guardar backup local
```

### 2. Migrar (20-30 min)
```bash
# Rodar script para todos os 16 produtos de uma vez
npm run migrate:all
```

O script irá:
- Baixar cada imagem original do Supabase
- Gerar 3 variantes (thumbnail 200px, medium 600px, large 1200px)
- Fazer upload das variantes
- Atualizar o banco de dados

### 3. Validar (5 min)
```bash
# Verificar se deu tudo certo
npm run dev

# Abrir /catalogo e conferir:
- [ ] 16 produtos aparecem corretamente
- [ ] Imagens carregam rápido
- [ ] Sem imagens quebradas
```

---

## 📊 Economia Esperada
- **Antes:** ~80 MB (16 produtos × 5MB)
- **Depois:** ~12 MB (85% redução)
- **Benefício:** Site 6x mais rápido

---

## ✅ Checklist Rápido
- [ ] Backup do DB
- [ ] Rodar `npm run migrate:all`
- [ ] Verificar site funcionando
- [ ] Deletar imagens antigas depois de 1 semana

---

**Tempo total:** ~40 minutos  
**Complexidade:** Baixa (apenas 16 produtos)
