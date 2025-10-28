import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Buscar 1 produto
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .limit(1)
    .single();
  
  console.log('Formato original:', typeof produtos.imagens[0]);
  console.log('Conteúdo:', produtos.imagens[0]);
  
  // Tentar parse
  const parsed = JSON.parse(produtos.imagens[0]);
  console.log('\nParsed:', parsed);
  console.log('Thumbnail:', parsed.thumbnail);
}

test();
