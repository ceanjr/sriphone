// src/lib/catalog/ui/events.ts
// Sistema de eventos customizados

export const catalogEvents = {
  PRODUTOS_UPDATED: 'catalog:produtos-updated',
  FILTROS_CHANGED: 'catalog:filtros-changed',
  CATEGORIA_CHANGED: 'catalog:categoria-changed',
  VIEW_MODE_CHANGED: 'catalog:view-mode-changed',
  LOAD_MORE: 'catalog:load-more',
};

export function emitEvent(eventName: string, detail?: any): void {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function onEvent(eventName: string, handler: (e: CustomEvent) => void): () => void {
  const listener = (e: Event) => handler(e as CustomEvent);
  window.addEventListener(eventName, listener);
  
  return () => window.removeEventListener(eventName, listener);
}
