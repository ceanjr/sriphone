import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function rollback() {
  console.log('🔄 Convertendo imagens para formato de URLs simples...\n');
  
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, codigo, nome, imagens');

  if (error) throw error;

  console.log(`📦 Total: ${produtos?.length || 0} produtos\n`);

  let converted = 0;

  for (const product of produtos || []) {
    const imagens = product.imagens;
    
    if (!imagens || imagens.length === 0) continue;

    // Se for string JSON, extrair apenas medium URL
    if (typeof imagens[0] === 'string' && imagens[0].startsWith('{')) {
      console.log(`🔄 ${product.codigo}`);
      
      const mediumUrls = imagens.map((img: string) => {
        try {
          const parsed = JSON.parse(img);
          return parsed.medium;
        } catch {
          return img;
        }
      });

      const { error: updateError } = await supabase
        .from('produtos')
        .update({ imagens: mediumUrls })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ❌ Erro: ${updateError.message}`);
      } else {
        console.log(`  ✅ ${mediumUrls.length} URL(s) extraída(s)`);
        converted++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ ${converted} produtos convertidos`);
  console.log('='.repeat(60));
  console.log('\n✅ Agora as imagens são URLs simples (medium, 600px)');
}

rollback().catch(error => {
  console.error('\n💥 Erro:', error);
  process.exit(1);
});
