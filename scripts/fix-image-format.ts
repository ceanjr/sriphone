// scripts/fix-image-format.ts
// Corrigir formato das imagens (de strings JSON para objetos JSON)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImageFormat() {
  console.log('🔧 Corrigindo formato das imagens...\n');
  
  // 1. Buscar todos os produtos
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, codigo, nome, imagens');

  if (error) throw error;

  console.log(`📦 Total de produtos: ${produtos?.length || 0}\n`);

  let fixed = 0;
  let skipped = 0;

  for (const product of produtos || []) {
    const imagens = product.imagens;
    
    if (!imagens || imagens.length === 0) {
      skipped++;
      continue;
    }

    // Verificar se está no formato errado (string JSON em vez de objeto)
    if (typeof imagens[0] === 'string' && imagens[0].startsWith('{')) {
      console.log(`🔄 Corrigindo: ${product.codigo}`);
      
      // Converter strings JSON para objetos
      const fixedImages = imagens.map((img: string) => {
        if (typeof img === 'string' && img.startsWith('{')) {
          return JSON.parse(img);
        }
        return img;
      });

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ imagens: fixedImages })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ❌ Erro: ${updateError.message}`);
      } else {
        console.log(`  ✅ Corrigido (${fixedImages.length} imagens)`);
        fixed++;
      }
    } else if (typeof imagens[0] === 'object') {
      console.log(`⏭️  ${product.codigo} - já está correto`);
      skipped++;
    } else {
      console.log(`⚠️  ${product.codigo} - formato desconhecido`);
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO');
  console.log('='.repeat(60));
  console.log(`✅ Corrigidos: ${fixed}`);
  console.log(`⏭️  Pulados: ${skipped}`);
  console.log('='.repeat(60));
  
  if (fixed > 0) {
    console.log('\n🎉 Formato corrigido! Agora teste o site novamente.');
  }
}

fixImageFormat().catch(error => {
  console.error('\n💥 Erro:', error);
  process.exit(1);
});
