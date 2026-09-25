/**
 * Errores al cargar partes de la app (chunks de JavaScript).
 *
 * Caso típico: se publica una versión nueva mientras alguien tiene la web abierta.
 * Su pestaña conoce los archivos viejos (p. ej. SaasAdminView-DulZI3Lp.js) que ya no existen
 * en el servidor, y al abrir el panel falla con "Failed to fetch dynamically imported module".
 * La solución es recargar la página una vez para obtener la versión nueva.
 */
import { lazy, ComponentType } from 'react';

const RELOAD_KEY = 'jw_chunk_reload_at';

export function isChunkLoadError(error: unknown): boolean {
  const msg = String((error as any)?.message || error || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|ChunkLoadError|Unable to preload CSS/i.test(msg);
}

/** Recarga la página una sola vez cada 30 s (evita bucles si el servidor está caído). */
export function reloadOnceForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* sin sessionStorage: recargar igual */
  }
  window.location.reload();
  return true;
}

/**
 * Igual que React.lazy, pero si la carga falla:
 * 1) reintenta una vez (fallo pasajero de red);
 * 2) si sigue fallando por archivo inexistente (versión nueva publicada), recarga la página.
 */
export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      await new Promise(r => setTimeout(r, 800));
      try {
        return await factory();
      } catch (error) {
        if (isChunkLoadError(error) && navigator.onLine && reloadOnceForNewVersion()) {
          // La página se está recargando: no mostrar el error mientras tanto
          return new Promise<{ default: T }>(() => {});
        }
        throw error;
      }
    }
  });
}
