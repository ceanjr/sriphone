// src/pages/api/produtos.ts
import type { APIRoute } from 'astro'
import { productService } from '../../lib/supabase'

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = parseInt(url.searchParams.get('limit') || '30')
    const categoria = url.searchParams.get('categoria')
    
    // Paginação cursor-based
    let result
    if (categoria && categoria !== 'todos') {
      result = await productService.getByCategory(categoria, cursor, limit)
    } else {
      result = await productService.getPaginated(cursor, limit)
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('API /produtos error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
