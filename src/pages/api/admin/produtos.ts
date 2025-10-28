// src/pages/api/admin/produtos.ts
import type { APIRoute } from 'astro'
import { productService } from '../../../lib/supabase'

// POST - Criar produto
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const produto = await productService.create(body)
    
    return new Response(JSON.stringify(produto), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('API /admin/produtos POST error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT - Atualizar produto
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const produto = await productService.update(id, updates)
    
    return new Response(JSON.stringify(produto), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('API /admin/produtos PUT error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE - Deletar produto
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
    
    await productService.delete(id)
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('API /admin/produtos DELETE error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
