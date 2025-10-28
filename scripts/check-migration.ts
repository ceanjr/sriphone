import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration() {
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('codigo, nome, imagens')
    .limit(3);

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('📊 Formato das imagens no banco:\n');
  produtos?.forEach(p => {
    console.log(`\n${p.codigo} - ${p.nome}`);
    console.log('Tipo:', typeof p.imagens);
    console.log('Array?', Array.isArray(p.imagens));
    console.log('Conteúdo:', JSON.stringify(p.imagens, null, 2));
  });
}

checkMigration();
