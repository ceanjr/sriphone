import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../lib/auth';
import sharp from 'sharp';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tamanho antes da otimização (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        error: 'Arquivo muito grande. Tamanho máximo: 10MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Otimizar imagem com Sharp
    const originalSize = buffer.length;
    let optimizedBuffer: Buffer;

    try {
      // Processar imagem
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Redimensionar apenas se for maior que 1200px
      let sharpInstance = image;
      if (metadata.width && metadata.width > 1200) {
        sharpInstance = sharpInstance.resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Converter para WebP com qualidade 80
      optimizedBuffer = await sharpInstance
        .webp({
          quality: 80,
          effort: 4 // Balanço entre compressão e velocidade
        })
        .toBuffer();

      console.log(`📊 Otimização: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedBuffer.length / 1024).toFixed(1)}KB (${((1 - optimizedBuffer.length / originalSize) * 100).toFixed(1)}% redução)`);
    } catch (sharpError: any) {
      console.error('Erro ao otimizar imagem:', sharpError);
      return new Response(JSON.stringify({
        error: 'Erro ao processar imagem'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Gerar nome único com extensão .webp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${randomString}.webp`;
    const filePath = `produtos/${fileName}`;

    // Upload para Supabase Storage com token autenticado
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(filePath, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 ano (imagens são imutáveis)
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({
        error: 'Erro ao fazer upload da imagem'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('imagens')
      .getPublicUrl(filePath);

    return new Response(JSON.stringify({
      url: publicUrl,
      path: filePath,
      fileName: fileName,
      optimized: true,
      originalSize: originalSize,
      optimizedSize: optimizedBuffer.length,
      savings: ((1 - optimizedBuffer.length / originalSize) * 100).toFixed(1) + '%'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Deletar imagem(ns)
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Suporta tanto path único quanto array de paths
    const paths = body.paths || (body.path ? [body.path] : []);

    if (!paths || paths.length === 0) {
      return new Response(JSON.stringify({ error: 'Path(s) da imagem não informado(s)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { error } = await supabase.storage
      .from('imagens')
      .remove(paths);

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      deleted: paths.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
