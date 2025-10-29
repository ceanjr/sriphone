import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .select('*')
      .order('nome');

    if (error) throw error;

return new Response(
  JSON.stringify({ success: true, data }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
);
  } catch (error: any) {
    console.error('Error fetching categorias:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro ao buscar categorias' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { nome } = await request.json();

    if (!nome || nome.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categorias')
      .insert([{ nome: nome.trim() }])
      .select()
      .single();

    if (error) {
if (error.code === '23505') { // conflito (duplicado)
  return new Response(
    JSON.stringify({ success: false, error: 'Categoria já existe' }),
    { status: 409, headers: { 'Content-Type': 'application/json' } }
  );
}
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating categoria:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro ao criar categoria' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
