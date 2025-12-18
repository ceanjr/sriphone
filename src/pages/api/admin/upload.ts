// src/pages/api/admin/upload.ts
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'node:crypto';

export const prerender = false;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

// Contador sequencial para garantir unicidade absoluta
let uploadCounter = 0;

export const POST: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();
  const requestId = crypto.randomBytes(4).toString('hex');
  uploadCounter++;
  const uploadId = `${Date.now()}-${uploadCounter}`;

  console.log('\n' + '='.repeat(80));
  console.log(`[UPLOAD ${requestId}] Nova requisição #${uploadCounter}`);
  console.log(`[UPLOAD ${requestId}] ID: ${uploadId}`);
  console.log('='.repeat(80));

  try {
    // 1. Verificar autenticação
    const authToken = cookies.get('sb-access-token')?.value;
    if (!authToken) {
      console.error(`[UPLOAD ${requestId}] ❌ Não autorizado`);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error(`[UPLOAD ${requestId}] ❌ Nenhum arquivo enviado`);
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[UPLOAD ${requestId}] 📁 Arquivo: ${file.name}`);
    console.log(
      `[UPLOAD ${requestId}] 📊 Tamanho: ${(file.size / 1024).toFixed(2)}KB`
    );
    console.log(`[UPLOAD ${requestId}] 📋 Tipo: ${file.type}`);

    // 3. Validações
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `Tipo não permitido: ${file.type}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande (máximo 10MB)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Gerar nome ÚNICO e GARANTIDO
    const timestamp = Date.now();
    const random1 = crypto.randomBytes(8).toString('hex'); // 16 chars
    const random2 = Math.random().toString(36).substring(2, 15); // 13 chars
    const counter = uploadCounter.toString().padStart(6, '0'); // 6 chars
    const ext = file.type.split('/')[1] || 'jpg';

    // Nome super único: timestamp-counter-random1-random2.ext
    const fileName = `${timestamp}-${counter}-${random1}-${random2}.${ext}`;
    const filePath = `produtos/${fileName}`;

    console.log(`[UPLOAD ${requestId}] 🎯 Path gerado: ${filePath}`);

    // 5. Converter para buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log(`[UPLOAD ${requestId}] 📦 Buffer: ${buffer.length} bytes`);

    // 6. Upload para Supabase (com retry)
    let uploadAttempt = 0;
    let uploadSuccess = false;
    let uploadData: any = null;
    let currentPath = filePath;

    while (!uploadSuccess && uploadAttempt < 3) {
      uploadAttempt++;
      console.log(
        `[UPLOAD ${requestId}] 📤 Tentativa ${uploadAttempt}/3: ${currentPath}`
      );

      const { data, error } = await supabaseAdmin.storage
        .from('imagens')
        .upload(currentPath, buffer, {
          contentType: file.type,
          upsert: false, // NUNCA sobrescrever
          cacheControl: '3600',
        });

      if (!error) {
        uploadData = data;
        uploadSuccess = true;
        console.log(
          `[UPLOAD ${requestId}] ✅ Upload bem-sucedido na tentativa ${uploadAttempt}`
        );
        break;
      }

      console.error(
        `[UPLOAD ${requestId}] ❌ Tentativa ${uploadAttempt} falhou:`,
        error.message
      );

      // Se já existe, gerar novo nome
      if (
        error.message?.includes('already exists') ||
        error.message?.includes('duplicate')
      ) {
        const retryTimestamp = Date.now();
        const retryRandom = crypto.randomBytes(6).toString('hex');
        currentPath = `produtos/${retryTimestamp}-${counter}-${retryRandom}.${ext}`;
        console.log(`[UPLOAD ${requestId}] 🔄 Novo path: ${currentPath}`);
      } else {
        // Outro erro, não tentar novamente
        return new Response(
          JSON.stringify({ error: `Erro no upload: ${error.message}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!uploadSuccess || !uploadData) {
      console.error(
        `[UPLOAD ${requestId}] ❌ Upload falhou após ${uploadAttempt} tentativas`
      );
      return new Response(
        JSON.stringify({
          error: 'Falha ao fazer upload após múltiplas tentativas',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Obter URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('imagens')
      .getPublicUrl(uploadData.path);

    if (!urlData?.publicUrl) {
      console.error(`[UPLOAD ${requestId}] ❌ URL pública não gerada`);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar URL pública' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const publicUrl = urlData.publicUrl;
    const duration = Date.now() - startTime;

    console.log(`[UPLOAD ${requestId}] ✅ SUCESSO`);
    console.log(`[UPLOAD ${requestId}] 🔗 URL: ${publicUrl}`);
    console.log(`[UPLOAD ${requestId}] ⏱️  Duração: ${duration}ms`);
    console.log('='.repeat(80) + '\n');

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        path: uploadData.path,
        uploadId,
        counter: uploadCounter,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error(`[UPLOAD ${requestId}] ❌ ERRO FATAL:`, error);
    console.error(`[UPLOAD ${requestId}] Stack:`, error.stack);

    return new Response(
      JSON.stringify({
        error: 'Erro interno no servidor',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const authToken = cookies.get('sb-access-token')?.value;
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const path = url.searchParams.get('path');

    if (!path) {
      return new Response(JSON.stringify({ error: 'Path não fornecido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabaseAdmin.storage
      .from('imagens')
      .remove([path]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
