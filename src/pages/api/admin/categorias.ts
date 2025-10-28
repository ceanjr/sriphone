// src/pages/api/admin/categorias.ts
import type { APIRoute } from 'astro'
import { categoryService, authService } from '../../../lib/supabase'

// GET - Listar categorias
export const GET: APIRoute = async ({ request }) => {
  try {
    const categorias = await categoryService.getAll()
    
    return new Response(JSON.stringify(categorias), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300'
      }
    })
  } catch (error: any) {
    console.error('API /admin/categorias GET error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST - Criar categoria
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { nome } = body
    
    if (!nome) {
      return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const categoria = await categoryService.create(nome)
    
    return new Response(JSON.stringify(categoria), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('API /admin/categorias POST error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT - Atualizar categoria
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { id, nome } = body
    
    if (!id || !nome) {
      return new Response(JSON.stringify({ error: 'ID e nome são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const categoria = await categoryService.update(id, nome)
    
    return new Response(JSON.stringify(categoria), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('API /admin/categorias PUT error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE - Deletar categoria
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    await categoryService.delete(id)
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('API /admin/categorias DELETE error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
