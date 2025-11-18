// src/lib/logger.ts
// Sistema de logging para ações administrativas

import { supabaseAdmin } from './supabaseAdmin';

export type LogAction =
  | 'upload_image'
  | 'remove_image'
  | 'add_product'
  | 'update_product'
  | 'delete_product'
  | 'add_category'
  | 'update_category'
  | 'delete_category';

export type LogStatus = 'success' | 'error';

export type LogEntityType = 'product' | 'category' | 'image';

export interface LogDetails {
  // Para imagens
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  imageUrl?: string;

  // Para produtos/categorias
  productName?: string;
  categoryName?: string;

  // Para erros
  errorDetails?: any;
  stackTrace?: string;

  // Outros
  [key: string]: any;
}

export interface CreateLogParams {
  action: LogAction;
  entityType: LogEntityType;
  entityId?: string;
  userEmail?: string;
  details?: LogDetails;
  status?: LogStatus;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra uma ação administrativa no sistema de logs
 */
export async function createAdminLog(params: CreateLogParams) {
  try {
    const {
      action,
      entityType,
      entityId,
      userEmail,
      details,
      status = 'success',
      errorMessage,
      ipAddress,
      userAgent,
    } = params;

    const { error } = await supabaseAdmin.from('admin_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      user_email: userEmail,
      details: details || {},
      status,
      error_message: errorMessage,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error('Erro ao criar log administrativo:', error);
      // Não lançar erro para não quebrar a operação principal
    }
  } catch (error) {
    console.error('Erro ao criar log administrativo:', error);
    // Não lançar erro para não quebrar a operação principal
  }
}

/**
 * Busca os últimos N logs
 */
export async function getRecentLogs(limit = 60) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar logs:', error);
      return { data: [], error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return { data: [], error };
  }
}

/**
 * Deleta logs com mais de 48 horas
 */
export async function cleanOldLogs() {
  try {
    const { error } = await supabaseAdmin.rpc('delete_old_admin_logs');

    if (error) {
      console.error('Erro ao limpar logs antigos:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao limpar logs antigos:', error);
    return { success: false, error };
  }
}

/**
 * Helper para logar upload de imagem
 */
export async function logImageUpload(params: {
  fileName: string;
  fileSize: number;
  mimeType: string;
  imageUrl: string;
  entityId?: string;
  userEmail?: string;
  status?: LogStatus;
  errorMessage?: string;
  errorDetails?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  await createAdminLog({
    action: 'upload_image',
    entityType: 'image',
    entityId: params.entityId,
    userEmail: params.userEmail,
    details: {
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      imageUrl: params.imageUrl,
      errorDetails: params.errorDetails,
    },
    status: params.status || 'success',
    errorMessage: params.errorMessage,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Helper para logar remoção de imagem
 */
export async function logImageRemove(params: {
  fileName: string;
  imageUrl: string;
  entityId?: string;
  userEmail?: string;
  status?: LogStatus;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await createAdminLog({
    action: 'remove_image',
    entityType: 'image',
    entityId: params.entityId,
    userEmail: params.userEmail,
    details: {
      fileName: params.fileName,
      imageUrl: params.imageUrl,
    },
    status: params.status || 'success',
    errorMessage: params.errorMessage,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Helper para logar operações de produto
 */
export async function logProductAction(params: {
  action: 'add_product' | 'update_product' | 'delete_product';
  productId: string;
  productName: string;
  userEmail?: string;
  details?: LogDetails;
  status?: LogStatus;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await createAdminLog({
    action: params.action,
    entityType: 'product',
    entityId: params.productId,
    userEmail: params.userEmail,
    details: {
      productName: params.productName,
      ...params.details,
    },
    status: params.status || 'success',
    errorMessage: params.errorMessage,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Helper para logar operações de categoria
 */
export async function logCategoryAction(params: {
  action: 'add_category' | 'update_category' | 'delete_category';
  categoryId: string;
  categoryName: string;
  userEmail?: string;
  details?: LogDetails;
  status?: LogStatus;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await createAdminLog({
    action: params.action,
    entityType: 'category',
    entityId: params.categoryId,
    userEmail: params.userEmail,
    details: {
      categoryName: params.categoryName,
      ...params.details,
    },
    status: params.status || 'success',
    errorMessage: params.errorMessage,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}
