import { useCallback, useState } from 'react';
import { StoreConfig, Product, PromotionalBanner, YapePaymentConfig } from '../../types';
import { api } from '../../services/api';
import { readPublicCache } from '../../utils/publicCache';
import { STORAGE_KEY_PREFIX } from '../storageKeys';

const DEFAULT_YAPE_CONFIG: YapePaymentConfig = {
  phone: '925763903',
  phoneFormatted: '+51 925 763 903',
  holder: 'JamuyWasi',
  qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/51925763903?text=Pago%20Yape%20JamuyWasi',
  instructions: 'Abona el monto exacto por Yape o Plin. Luego ingresa el código de aprobación de 3 dígitos para verificación y activación inmediata de tu tienda.'
};

interface UseCatalogStateParams {
  /** Tienda que trae la URL de entrada (slug/id en el path o en ?store=), si hay alguna. */
  initialStoreId: string;
}

/**
 * Slice de datos públicos del catálogo: tiendas, productos, banners y la config de pagos Yape.
 * Extraído de AppContext.tsx: solo el CRUD "puro" que no necesita leer `currentStore` (derivado
 * combinando este slice con el de auth) vive aquí. `addProduct`, `deleteProduct`, `createNewStore`,
 * `deleteStore` y `upgradeSubscription` se quedaron en AppContext.tsx porque cruzan con auth/carrito
 * (currentStore, setUsers, setCart) y moverlos aquí crearía una dependencia circular entre slices.
 */
export function useCatalogState({ initialStoreId }: UseCatalogStateParams) {
  const [stores, setStores] = useState<StoreConfig[]>(() => readPublicCache()?.stores || []);
  const [currentStoreId, setCurrentStoreId] = useState<string>(() => {
    return initialStoreId || localStorage.getItem(STORAGE_KEY_PREFIX + 'currentStoreId') || '';
  });
  const [products, setProducts] = useState<Product[]>(() => readPublicCache()?.products || []);
  const [banners, setBanners] = useState<PromotionalBanner[]>(() => readPublicCache()?.banners || []);
  const [yapeConfig, setYapeConfig] = useState<YapePaymentConfig>(() => readPublicCache()?.yapeConfig || DEFAULT_YAPE_CONFIG);

  const refreshStores = async () => {
    try {
      const all = await api.getStores(true);
      if (all && all.length > 0) {
        setStores(all);
      }
    } catch (err) {
      console.error('Error al refrescar catálogo de tiendas:', err);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    const saved = await api.updateProduct(updatedProduct);
    setProducts(prev => prev.map(p => p.id === saved.id ? saved : p));
  };

  const toggleProductStock = async (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const updated = { ...prod, inStock: !prod.inStock };
    setProducts(prev => prev.map(p => p.id === productId ? updated : p));
    try {
      await api.updateProduct(updated);
    } catch (err) {
      console.error('Error al cambiar stock en backend:', err);
    }
  };

  const updateStoreConfig = async (config: StoreConfig) => {
    setStores(prev => prev.map(s => s.id === config.id ? config : s));
    try {
      const saved = await api.updateStore(config.id, config);
      setStores(prev => prev.map(s => s.id === saved.id ? saved : s));
    } catch (err) {
      console.error('Error al actualizar tienda en backend:', err);
    }
  };

  const trackProductVisit = useCallback((productId: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return { ...p, viewsCount: (p.viewsCount || 0) + 1 };
        }
        return p;
      })
    );
    api.trackProductVisit(productId);
  }, []);

  // SuperAdmin Promotional Banner Methods with Backend Integration
  const addBanner = async (bannerData: Omit<PromotionalBanner, 'id' | 'createdAt'>) => {
    try {
      const created = await api.createBanner(bannerData);
      setBanners(prev => {
        if (prev.some(b => b.id === created.id)) {
          return prev.map(b => b.id === created.id ? created : b);
        }
        return [...prev, created];
      });
    } catch (err: any) {
      console.error('Error al agregar banner en backend:', err);
      // Fallback optimista local
      const newBanner: PromotionalBanner = {
        ...bannerData,
        id: `ban_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setBanners(prev => (prev.some(b => b.id === newBanner.id) ? prev : [...prev, newBanner]));
      throw err;
    }
  };

  const updateBanner = async (updatedBanner: PromotionalBanner) => {
    // Optimistic update
    setBanners(prev => prev.map(b => (b.id === updatedBanner.id ? updatedBanner : b)));
    try {
      const saved = await api.updateBanner(updatedBanner.id, updatedBanner);
      setBanners(prev => prev.map(b => (b.id === saved.id ? saved : b)));
    } catch (err) {
      console.error('Error al actualizar banner en backend:', err);
    }
  };

  const deleteBanner = async (bannerId: string) => {
    const previousBanners = banners;
    setBanners(prev => prev.filter(b => b.id !== bannerId));
    try {
      await api.deleteBanner(bannerId);
    } catch (err) {
      console.error('Error al eliminar banner en backend:', err);
      setBanners(previousBanners);
    }
  };

  const toggleBannerActive = async (bannerId: string) => {
    const target = banners.find(b => b.id === bannerId);
    if (!target) return;
    const newStatus = !target.isActive;
    setBanners(prev =>
      prev.map(b => (b.id === bannerId ? { ...b, isActive: newStatus } : b))
    );
    try {
      await api.updateBanner(bannerId, { isActive: newStatus });
    } catch (err) {
      console.error('Error al alternar estado de banner en backend:', err);
      // Revertir
      setBanners(prev =>
        prev.map(b => (b.id === bannerId ? { ...b, isActive: target.isActive } : b))
      );
    }
  };

  const refreshYapeConfig = useCallback(async () => {
    try {
      const cfg = await api.getYapeConfig();
      if (cfg && cfg.phone) {
        setYapeConfig(cfg);
      }
    } catch (err) {
      console.warn('No se pudo cargar la configuración de Yape:', err);
    }
  }, []);

  const updateYapeConfig = async (config: Partial<YapePaymentConfig>): Promise<boolean> => {
    try {
      const updated = await api.updateYapeConfig(config);
      setYapeConfig(updated);
      return true;
    } catch (err: any) {
      console.error('Error al actualizar configuración de Yape:', err);
      throw err;
    }
  };

  return {
    stores,
    setStores,
    currentStoreId,
    setCurrentStoreId,
    products,
    setProducts,
    banners,
    setBanners,
    yapeConfig,
    setYapeConfig,
    refreshStores,
    updateProduct,
    toggleProductStock,
    updateStoreConfig,
    trackProductVisit,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    refreshYapeConfig,
    updateYapeConfig
  };
}
