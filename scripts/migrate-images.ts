// scripts/migrate-images.ts
// Script de migração de imagens para produtos

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase faltando!');
  console.error('Configure: PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY (ou PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ImageVariant {
  thumbnail: string;
  medium: string;
  large: string;
}

const SIZES = {
  thumbnail: 200,
  medium: 600,
  large: 1200
};

async function downloadImage(url: string): Promise<Buffer> {
  console.log(`  📥 Baixando: ${url.substring(url.lastIndexOf('/') + 1)}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro ao baixar: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function processImage(buffer: Buffer, size: number): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

async function uploadVariant(
  buffer: Buffer,
  productCode: string,
  imageIndex: number,
  variant: 'thumbnail' | 'medium' | 'large'
): Promise<string> {
  const fileName = `${productCode}_${imageIndex}_${variant}.webp`;
  const filePath = `produtos/${fileName}`;

  // Tentar upload com upsert
  const { data, error: uploadError } = await supabase.storage
    .from('imagens')
    .upload(filePath, buffer, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '3600'
    });

  if (uploadError) {
    // Se RLS bloqueou, tentar método alternativo
    console.log(`    ⚠️  RLS bloqueou upload, tentando alternativa...`);
    
    // Retornar URL temporária (imagem será mantida em memória por enquanto)
    // Este é um workaround - em produção, desabilite RLS temporariamente
    throw new Error(`RLS ativo - desabilite policies no bucket 'imagens' temporariamente`);
  }

  const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(filePath);
  return urlData.publicUrl;
}

async function migrateProductImages(product: any) {
  console.log(`\n🔄 Migrando: ${product.codigo} - ${product.nome}`);
  
  const oldImages = product.imagens;
  if (!oldImages || oldImages.length === 0) {
    console.log('  ⚠️  Sem imagens para migrar');
    return;
  }

  // Se já está no formato novo, pular
  if (typeof oldImages[0] === 'object') {
    console.log('  ✅ Já migrado (formato novo detectado)');
    return;
  }

  const newImages: ImageVariant[] = [];

  for (let i = 0; i < oldImages.length; i++) {
    const imageUrl = oldImages[i];
    console.log(`  📸 Processando imagem ${i + 1}/${oldImages.length}`);

    try {
      // 1. Baixar imagem original
      const originalBuffer = await downloadImage(imageUrl);
      console.log(`  ✓ Baixada (${(originalBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

      // 2. Processar 3 variantes
      const variants: ImageVariant = { thumbnail: '', medium: '', large: '' };

      for (const [variant, size] of Object.entries(SIZES)) {
        console.log(`  🔧 Gerando ${variant} (${size}px)...`);
        const processedBuffer = await processImage(originalBuffer, size);
        const url = await uploadVariant(
          processedBuffer,
          product.codigo,
          i,
          variant as keyof ImageVariant
        );
        variants[variant as keyof ImageVariant] = url;
        console.log(`  ✓ ${variant}: ${(processedBuffer.length / 1024).toFixed(0)} KB`);
      }

      newImages.push(variants);
    } catch (error: any) {
      console.error(`  ❌ Erro na imagem ${i + 1}:`, error.message);
      throw error;
    }
  }

  // 3. Atualizar banco de dados
  console.log('  💾 Atualizando banco de dados...');
  const { error } = await supabase
    .from('produtos')
    .update({ imagens: newImages })
    .eq('id', product.id);

  if (error) throw error;

  console.log(`  ✅ Produto migrado com sucesso!`);
  console.log(`  📊 ${oldImages.length} imagem(ns) → ${newImages.length * 3} variantes`);
}

async function migrateAll() {
  console.log('🚀 Iniciando migração de imagens\n');
  console.log('='.repeat(60));

  // 1. Buscar todos os produtos
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, codigo, nome, imagens')
    .order('created_at', { ascending: false });

  if (error) throw error;

  console.log(`\n📦 Total de produtos: ${produtos?.length || 0}`);

  if (!produtos || produtos.length === 0) {
    console.log('❌ Nenhum produto encontrado');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  // 2. Processar cada produto
  for (const product of produtos) {
    try {
      // Verificar se já está migrado
      if (product.imagens && product.imagens.length > 0 && typeof product.imagens[0] === 'object') {
        skipped++;
        console.log(`\n⏭️  Pulando: ${product.codigo} (já migrado)`);
        continue;
      }

      await migrateProductImages(product);
      migrated++;
      
      // Delay entre produtos para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      errors++;
      console.error(`\n❌ Erro ao migrar ${product.codigo}:`, error.message);
      console.log('   Continuando com próximo produto...\n');
    }
  }

  // 3. Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Migrados: ${migrated}`);
  console.log(`⏭️  Pulados: ${skipped}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📦 Total: ${produtos.length}`);
  console.log('='.repeat(60));

  if (errors === 0) {
    console.log('\n🎉 Migração concluída com sucesso!');
  } else {
    console.log('\n⚠️  Migração concluída com alguns erros. Verifique os logs acima.');
  }
}

// Executar
migrateAll().catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});
