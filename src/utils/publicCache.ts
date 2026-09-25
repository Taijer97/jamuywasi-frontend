/**
 * Caché local de los datos PÚBLICOS del catálogo (tiendas, productos, anuncios y datos de cobro).
 *
 * Estrategia "stale-while-revalidate": al abrir la app se muestra al instante lo último que se vio
 * y, en paralelo, se piden los datos frescos al servidor, que reemplazan a los guardados.
 * Así, al recargar o volver a la web, no hay pantalla de carga y funciona aunque la red esté lenta.
 *
 * Nunca se guardan datos privados (pedidos, usuarios, datos del panel).
 * Si cambia la forma de los datos, subir CACHE_KEY de versión (v1 -> v2).
 */
import type { StoreConfig, Product, PromotionalBanner, YapePaymentConfig } from '../types';

const CACHE_KEY = 'jw_public_cache_v2';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export interface PublicCache {
  savedAt: number;
  stores: StoreConfig[];
  products: Product[];
  banners: PromotionalBanner[];
  yapeConfig?: YapePaymentConfig | null;
}

let memo: PublicCache | null | undefined;

export function readPublicCache(): PublicCache | null {
  if (memo !== undefined) return memo;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return (memo = null);
    const data = JSON.parse(raw) as PublicCache;
    if (!data || typeof data.savedAt !== 'number' || Date.now() - data.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY);
      return (memo = null);
    }
    return (memo = data);
  } catch {
    return (memo = null);
  }
}

export function writePublicCache(data: Omit<PublicCache, 'savedAt'>): void {
  const value: PublicCache = { ...data, savedAt: Date.now() };
  memo = value;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): la app sigue funcionando sin caché
  }
}
