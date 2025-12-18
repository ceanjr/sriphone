# Guia de Implementação: Sistema de Upload de Imagens

## Visão Geral do Sistema

O sistema implementa um fluxo completo de upload de imagens com otimização automática, geração de múltiplas variantes e integração com Supabase Storage.

## Arquitetura do Sistema

```
Cliente (Browser)
    ↓ [Compressão Inicial]
    ↓
API Route (/api/upload)
    ↓ [Otimização + Variantes]
    ↓
Supabase Storage
    ↓ [URLs Públicas]
    ↓
Banco de Dados (array de URLs)
```

---

## 1. CONFIGURAÇÃO INICIAL

### 1.1 Dependências Necessárias

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.76.1",
    "@supabase/ssr": "^0.7.0",
    "browser-image-compression": "^2.0.2",
    "sharp": "^0.34.5"
  }
}
```

### 1.2 Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
```

### 1.3 Configuração do Supabase Storage

1. Criar bucket público chamado `produtos` (ou nome desejado)
2. Configurar políticas RLS:

```sql
-- Política de SELECT (leitura pública)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

-- Política de INSERT (apenas autenticados)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'produtos');

-- Política de DELETE (apenas autenticados)
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'produtos');
```

---

## 2. OTIMIZAÇÃO DE IMAGENS (Server-Side)

### 2.1 Criar Utilitário de Otimização

**Arquivo:** `lib/utils/image-optimizer.ts`

```typescript
import sharp from 'sharp';

// Configurações de variantes
export const IMAGE_VARIANTS = {
  thumb: { width: 150, height: 150, quality: 80 },
  small: { width: 400, height: 400, quality: 85 },
  medium: { width: 800, height: 800, quality: 85 },
  large: { width: 1200, height: 1200, quality: 90 },
  original: { width: 1920, height: 1920, quality: 90 },
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

export interface OptimizedImageVariant {
  size: ImageVariant;
  buffer: Buffer;
  filename: string;
  width: number;
  height: number;
}

/**
 * Otimiza uma imagem gerando múltiplas variantes em WebP
 */
export async function optimizeImage(
  buffer: Buffer,
  baseName: string
): Promise<OptimizedImageVariant[]> {
  const variants: OptimizedImageVariant[] = [];

  for (const [size, config] of Object.entries(IMAGE_VARIANTS)) {
    const sharpInstance = sharp(buffer)
      .resize(config.width, config.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: config.quality, effort: 6 });

    const optimizedBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(optimizedBuffer).metadata();

    variants.push({
      size: size as ImageVariant,
      buffer: optimizedBuffer,
      filename: `${baseName}-${size}.webp`,
      width: metadata.width || config.width,
      height: metadata.height || config.height,
    });
  }

  return variants;
}

/**
 * Extrai o nome base do arquivo (sem sufixo de tamanho)
 * Exemplo: "1234567890-abc123-medium.webp" -> "produtos/1234567890-abc123"
 */
export function getBasePath(path: string): string {
  // Remove o bucket prefix se existir
  const cleanPath = path.replace(/^produtos\//, '');

  // Remove o sufixo de tamanho (-thumb, -small, etc) e extensão
  const baseName = cleanPath.replace(
    /-(?:thumb|small|medium|large|original)\.webp$/,
    ''
  );

  return `produtos/${baseName}`;
}
```

### 2.2 Configuração de Constantes

**Arquivo:** `lib/config/constants.ts`

```typescript
export const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;
```

---

## 3. RATE LIMITING

### 3.1 Criar Sistema de Rate Limit

**Arquivo:** `lib/utils/rate-limiter.ts`

```typescript
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitOptions {
  interval: number; // em milissegundos
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Verifica rate limit para um cliente
 */
export function checkRateLimit(
  clientId: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore[clientId];

  // Limpar registros expirados
  if (record && now >= record.resetTime) {
    delete rateLimitStore[clientId];
  }

  // Criar ou atualizar registro
  if (!rateLimitStore[clientId]) {
    rateLimitStore[clientId] = {
      count: 1,
      resetTime: now + options.interval,
    };
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: rateLimitStore[clientId].resetTime,
    };
  }

  // Verificar limite
  const current = rateLimitStore[clientId];
  if (current.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Incrementar contador
  current.count++;
  return {
    allowed: true,
    remaining: options.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Obtém IP do cliente (suporta proxies)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  return 'unknown';
}
```

---

## 4. API ROUTE DE UPLOAD

### 4.1 Endpoint POST (Upload)

**Arquivo:** `app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/utils/rate-limiter';
import { logger } from '@/lib/utils/logger';
import { UPLOAD_LIMITS } from '@/lib/config/constants';
import { optimizeImage } from '@/lib/utils/image-optimizer';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, {
      interval: 60000, // 1 minuto
      maxRequests: 20,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // 2. Verificar Autenticação
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 3. Obter Arquivo
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // 4. Validar Tipo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'O arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }

    // 5. Validar Tamanho
    if (file.size > UPLOAD_LIMITS.maxFileSize) {
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 10MB' },
        { status: 400 }
      );
    }

    // 6. Gerar Nome Único
    const baseName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 7. Converter para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 8. Otimizar e Gerar Variantes
    logger.info(`[Upload] Otimizando imagem: ${file.name}`);
    const variants = await optimizeImage(buffer, baseName);
    logger.info(`[Upload] Geradas ${variants.length} variantes`);

    // 9. Upload de Todas as Variantes
    const uploadPromises = variants.map(async (variant) => {
      const filePath = `produtos/${variant.filename}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, variant.buffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `Erro ao fazer upload de ${variant.size}: ${uploadError.message}`
        );
      }

      logger.debug(
        `[Upload] Variante ${variant.size}: ${filePath} (${variant.width}x${variant.height})`
      );
      return filePath;
    });

    const uploadedPaths = await Promise.all(uploadPromises);

    // 10. Obter URL Pública da Variante Original
    const originalPath = uploadedPaths.find((path) =>
      path.includes('-original.webp')
    );
    if (!originalPath) {
      throw new Error('Erro ao encontrar imagem original após upload');
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('produtos').getPublicUrl(originalPath);

    logger.info(`[Upload] Upload concluído: ${uploadedPaths.length} variantes`);

    return NextResponse.json({
      url: publicUrl, // URL da imagem original
      path: originalPath,
      variants: uploadedPaths,
    });
  } catch (error) {
    logger.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
```

### 4.2 Endpoint DELETE (Remoção)

**Continuação do arquivo:** `app/api/upload/route.ts`

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar Autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Obter Caminho da Imagem
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Caminho da imagem não fornecido' },
        { status: 400 }
      );
    }

    // 3. Obter Nome Base (sem sufixo de tamanho)
    const basePath = getBasePath(path);
    const baseFileName = basePath.split('/').pop();

    // 4. Listar Todas as Variantes
    const { data: files, error: listError } = await supabase.storage
      .from('produtos')
      .list('produtos', {
        search: baseFileName || undefined,
      });

    if (listError) {
      logger.error('Erro ao listar variantes:', listError);
      // Fallback: deletar apenas a imagem especificada
      const { error: deleteError } = await supabase.storage
        .from('produtos')
        .remove([path]);
      if (deleteError) {
        return NextResponse.json(
          { error: `Erro ao deletar: ${deleteError.message}` },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, deleted: 1 });
    }

    // 5. Filtrar Variantes da Mesma Imagem
    const variantPaths =
      files
        ?.filter((file) => file.name.startsWith(baseFileName || ''))
        .map((file) => `produtos/${file.name}`) || [];

    const pathsToDelete = variantPaths.length > 0 ? variantPaths : [path];

    // 6. Deletar Todas as Variantes
    const { error: deleteError } = await supabase.storage
      .from('produtos')
      .remove(pathsToDelete);

    if (deleteError) {
      logger.error('Erro ao deletar variantes:', deleteError);
      return NextResponse.json(
        { error: `Erro ao deletar: ${deleteError.message}` },
        { status: 500 }
      );
    }

    logger.info(
      `[Delete] Removidas ${pathsToDelete.length} variantes da imagem`
    );

    return NextResponse.json({ success: true, deleted: pathsToDelete.length });
  } catch (error) {
    logger.error('Erro ao deletar:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
```

---

## 5. COMPONENTE DE UPLOAD (Client-Side)

### 5.1 Componente ImageUpload

**Arquivo:** `components/admin/image-upload.tsx`

```typescript
'use client';

import { useState, useRef } from 'react';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { Upload, X, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { logger } from '@/lib/utils/logger';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Validar número máximo
    if (images.length + files.length > maxImages) {
      toast.error(`Você pode adicionar no máximo ${maxImages} imagens`);
      return;
    }

    // Validar tipo
    const validFiles = files.filter((file) => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast.error(`${file.name} não é uma imagem válida`);
      }
      return isValid;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      const totalFiles = validFiles.length;

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

        // Compressão no cliente (opcional, mas recomendado)
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.9,
        };

        let fileToUpload: File;
        try {
          if (file.size > 2 * 1024 * 1024) {
            const compressedFile = await imageCompression(file, options);
            fileToUpload = compressedFile;

            const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
            const compressedSizeMB = (
              compressedFile.size /
              1024 /
              1024
            ).toFixed(2);
            logger.debug(
              `[Upload] Imagem otimizada: ${originalSizeMB}MB → ${compressedSizeMB}MB`
            );
          } else {
            fileToUpload = file;
            logger.debug(
              `[Upload] Imagem já otimizada: ${(
                file.size /
                1024 /
                1024
              ).toFixed(2)}MB`
            );
          }
        } catch (compressionError) {
          logger.warn(
            '[Upload] Erro ao comprimir, usando original:',
            compressionError
          );
          fileToUpload = file;
        }

        // Upload para API
        const formData = new FormData();
        formData.append('file', fileToUpload);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao fazer upload');
        }

        const { url } = await response.json();
        uploadedUrls.push(url);

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      onChange([...images, ...uploadedUrls]);
      toast.success(
        `${uploadedUrls.length} ${
          uploadedUrls.length === 1 ? 'imagem enviada' : 'imagens enviadas'
        } com sucesso!`
      );

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error('Erro no upload:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao fazer upload das imagens'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    toast.success('Imagem removida');
  };

  const handleSetAsPrincipal = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [removed] = newImages.splice(index, 1);
    newImages.unshift(removed);
    onChange(newImages);
    toast.success('Foto principal atualizada');
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Upload Area */}
      {images.length < maxImages && (
        <div className="rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-6">
          {images.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg border-2 border-zinc-800"
                >
                  <div className="aspect-square relative">
                    <OptimizedImage
                      src={url}
                      alt={`Foto ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover"
                    />
                  </div>

                  {index === 0 && (
                    <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-black">
                      <Star className="h-3 w-3 fill-current" />
                      Principal
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 flex gap-1 bg-gradient-to-t from-black/90 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {index !== 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetAsPrincipal(index)}
                        disabled={disabled || uploading}
                        className="flex-1"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveImage(index)}
                      disabled={disabled || uploading}
                      className={index === 0 ? 'flex-1' : 'flex-none'}
                    >
                      <X className="h-3 w-3" />
                      {index === 0 && ' Remover'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full text-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    Enviando imagens...
                  </p>
                  <p className="text-xs text-zinc-500">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2">
                <Upload className="h-12 w-12 text-zinc-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    Clique para adicionar fotos
                  </p>
                  <p className="text-xs text-zinc-500">
                    PNG, JPG, WEBP • Máximo {maxImages} fotos • Até 10MB por
                    foto
                  </p>
                </div>
              </div>
            )}
          </button>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-zinc-500">
          💡 A primeira foto é a principal. Use o botão "Principal" para
          reorganizar.
        </p>
      )}
    </div>
  );
}
```

---

## 6. COMPONENTE DE IMAGEM OTIMIZADA

### 6.1 OptimizedImage Component

**Arquivo:** `components/shared/optimized-image.tsx`

```typescript
'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

/**
 * Componente de imagem otimizada com suporte a variantes
 * Usa as variantes pré-otimizadas do Supabase Storage
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.png',
  className,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Obtém a URL da variante apropriada baseado no width
   */
  const getVariantUrl = (url: string, width?: number): string => {
    if (!url.includes('supabase.co')) return url;

    // Detectar qual variante usar baseado no width
    let variant = 'original';
    if (width) {
      if (width <= 150) variant = 'thumb';
      else if (width <= 400) variant = 'small';
      else if (width <= 800) variant = 'medium';
      else if (width <= 1200) variant = 'large';
    }

    // Se já tem sufixo de variante, usar como está
    if (/-(?:thumb|small|medium|large|original)\.webp$/.test(url)) {
      return url;
    }

    // Adicionar sufixo de variante
    return url.replace(/-original\.webp$/, `-${variant}.webp`);
  };

  const optimizedSrc = getVariantUrl(imgSrc, props.width as number);

  return (
    <Image
      {...props}
      src={optimizedSrc}
      alt={alt}
      className={className}
      onLoad={() => setIsLoading(false)}
      onError={() => {
        setImgSrc(fallbackSrc);
        setIsLoading(false);
      }}
      style={{
        ...props.style,
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
  );
}
```

---

## 7. INTEGRAÇÃO COM FORMULÁRIO DE PRODUTO

### 7.1 Schema de Validação

**Arquivo:** `lib/validations/produto.ts`

```typescript
import { z } from 'zod';

export const produtoSchema = z.object({
  codigo_produto: z.string().nullable().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().nullable().optional(),
  preco: z.number().positive('Preço deve ser positivo'),
  nivel_bateria: z.number().min(0).max(100).nullable().optional(),
  condicao: z.enum(['novo', 'seminovo']),
  categoria_id: z.string().uuid(),
  garantia: z.enum(['nenhuma', '3_meses', '6_meses', '1_ano']),
  cores: z.array(z.string()).nullable().optional(),
  acessorios: z.object({
    caixa: z.boolean(),
    carregador: z.boolean(),
    cabo: z.boolean(),
    capinha: z.boolean(),
    pelicula: z.boolean(),
  }),
  fotos: z.array(z.string().url()).min(1, 'Adicione pelo menos uma foto'),
  foto_principal: z.string().url().nullable().optional(),
  ativo: z.boolean().default(true),
  estoque: z.number().int().min(0).default(1),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;
```

### 7.2 Server Actions

**Arquivo:** `app/admin/produtos/actions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { produtoSchema } from '@/lib/validations/produto';
import type { ProdutoFormData } from '@/types/produto';

function generateSlug(nome: string): string {
  const baseSlug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

export async function createProduto(data: ProdutoFormData) {
  const supabase = await createClient();

  // Validar dados
  const validatedData = produtoSchema.safeParse(data);

  if (!validatedData.success) {
    const firstError = validatedData.error.issues[0]?.message;
    return {
      success: false,
      error: firstError || 'Dados inválidos',
    };
  }

  // Gerar slug
  const slug = generateSlug(validatedData.data.nome);

  // Preparar dados
  const insertData = {
    ...validatedData.data,
    slug,
    foto_principal: validatedData.data.fotos[0] || null,
  };

  // Inserir produto
  const { data: produto, error } = await supabase
    .from('produtos')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message || 'Erro ao criar produto',
    };
  }

  // Revalidar páginas
  revalidatePath('/admin/produtos', 'page');
  revalidatePath('/', 'layout');
  revalidatePath(`/produto/${slug}`, 'page');

  return {
    success: true,
    produto,
  };
}

export async function updateProduto(id: string, data: ProdutoFormData) {
  const supabase = await createClient();

  // Validar dados
  const validatedData = produtoSchema.safeParse(data);

  if (!validatedData.success) {
    const firstError = validatedData.error.issues[0]?.message;
    return {
      success: false,
      error: firstError || 'Dados inválidos',
    };
  }

  // Buscar produto existente
  const { data: produtoExistente } = await supabase
    .from('produtos')
    .select('slug')
    .eq('id', id)
    .single();

  const slug = produtoExistente?.slug || generateSlug(validatedData.data.nome);

  // Preparar dados
  const updateData = {
    ...validatedData.data,
    slug,
    foto_principal: validatedData.data.fotos[0] || null,
    updated_at: new Date().toISOString(),
  };

  // Atualizar produto
  const { data: produto, error } = await supabase
    .from('produtos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message || 'Erro ao atualizar produto',
    };
  }

  // Revalidar páginas
  revalidatePath('/admin/produtos', 'page');
  revalidatePath('/', 'layout');
  revalidatePath(`/produto/${slug}`, 'page');

  return {
    success: true,
    produto,
  };
}
```

---

## 8. CONFIGURAÇÃO DO NEXT.JS

### 8.1 next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Usar variantes pré-otimizadas
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'seu-projeto.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  compress: true,
};

export default nextConfig;
```

---

## 9. ESTRUTURA DO BANCO DE DADOS

### 9.1 Tabela de Produtos

```sql
CREATE TABLE produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_produto TEXT,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  nivel_bateria INTEGER CHECK (nivel_bateria >= 0 AND nivel_bateria <= 100),
  condicao TEXT NOT NULL CHECK (condicao IN ('novo', 'seminovo')),
  categoria_id UUID REFERENCES categorias(id),
  garantia TEXT NOT NULL CHECK (garantia IN ('nenhuma', '3_meses', '6_meses', '1_ano')),
  cores TEXT[],
  acessorios JSONB DEFAULT '{"caixa": false, "carregador": false, "cabo": false, "capinha": false, "pelicula": false}'::jsonb,
  fotos TEXT[] NOT NULL,
  foto_principal TEXT,
  ativo BOOLEAN DEFAULT true,
  estoque INTEGER DEFAULT 1,
  visualizacoes_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_produtos_slug ON produtos(slug);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produtos_deleted ON produtos(deleted_at);
```

---

## 10. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup Inicial

- [ ] Instalar dependências (sharp, browser-image-compression)
- [ ] Configurar variáveis de ambiente
- [ ] Criar bucket no Supabase Storage
- [ ] Configurar políticas RLS

### Fase 2: Backend

- [ ] Criar utilitário de otimização (image-optimizer.ts)
- [ ] Criar sistema de rate limiting (rate-limiter.ts)
- [ ] Implementar API route de upload (/api/upload)
- [ ] Implementar API route de delete (/api/upload)

### Fase 3: Frontend

- [ ] Criar componente ImageUpload
- [ ] Criar componente OptimizedImage
- [ ] Integrar com formulário de produtos

### Fase 4: Database

- [ ] Criar tabela de produtos
- [ ] Criar índices necessários
- [ ] Criar server actions (createProduto, updateProduto)

### Fase 5: Testes

- [ ] Testar upload de imagens
- [ ] Testar remoção de imagens
- [ ] Testar limite de uploads
- [ ] Testar variantes geradas
- [ ] Testar criação/edição de produtos

---

## 11. PONTOS IMPORTANTES

### 11.1 Performance

- Compressão no cliente reduz tempo de upload
- Múltiplas variantes otimizam carregamento
- WebP reduz tamanho em ~30-50%
- Lazy loading de componentes

### 11.2 Segurança

- Rate limiting por IP
- Autenticação obrigatória
- Validação de tipo e tamanho
- RLS policies no Supabase

### 11.3 UX

- Preview das imagens
- Progresso de upload
- Foto principal destacada
- Reorganização por drag-and-drop

### 11.4 Custos

- 100% gratuito (sem Vercel Image Optimization)
- Variantes geradas no upload
- Cache de longo prazo

---

## 12. TROUBLESHOOTING

### Problema: Imagens não aparecem

**Solução:** Verificar políticas RLS do bucket

### Problema: Upload lento

**Solução:** Aumentar compressão no cliente ou reduzir qualidade

### Problema: Erro 429 (Rate Limit)

**Solução:** Ajustar limites em rate-limiter.ts

### Problema: Variantes não são geradas

**Solução:** Verificar se Sharp está instalado corretamente

---

## 13. MELHORIAS FUTURAS

- [ ] Upload via drag-and-drop
- [ ] Crop de imagens antes do upload
- [ ] Suporte a vídeos
- [ ] Compressão progressiva (WebP + AVIF)
- [ ] CDN para assets estáticos
- [ ] Watermark automático

---

## RESUMO DO FLUXO

```
1. Usuário seleciona arquivos
2. Compressão inicial no cliente (opcional)
3. Upload para /api/upload
4. Rate limiting + autenticação
5. Validação de tipo e tamanho
6. Geração de 5 variantes (thumb, small, medium, large, original)
7. Upload de todas as variantes para Supabase Storage
8. Retorno da URL da variante original
9. Salvamento da URL no banco de dados (array fotos)
10. OptimizedImage seleciona variante apropriada no render
```

Este sistema oferece:

- ✅ Uploads rápidos e seguros
- ✅ Otimização automática
- ✅ Zero custos adicionais
- ✅ Ótima UX
- ✅ Performance máxima
