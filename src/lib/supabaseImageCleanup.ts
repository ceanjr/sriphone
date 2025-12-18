// src/lib/supabaseImageCleanup.ts
// Utilitário para remover imagens órfãs do Supabase Storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Remove uma lista de imagens do bucket do Supabase
 * @param {string[]} urls Lista de URLs completas das imagens
 * @param {string} bucket Nome do bucket (ex: 'produtos')
 */
export async function removeSupabaseImages(
  urls: string[],
  bucket = 'produtos'
) {
  if (!urls || urls.length === 0) return;
  // Extrai o caminho relativo do arquivo a partir da URL
  const paths = urls
    .map((url) => {
      const match = url.match(/storage\/v1\/object\/public\/(.+)/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
  if (paths.length === 0) return;
  const { data, error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    console.error('Erro ao remover imagens órfãs do Supabase:', error);
  } else {
    console.log('Imagens órfãs removidas do Supabase:', data);
  }
}
