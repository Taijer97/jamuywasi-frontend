import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fireConfetti as confetti } from '../utils/confetti';
import {
  StoreConfig,
  Product,
  Order,
  UserAccount,
  PlanTier,
  ActiveView,
  PromotionalBanner,
  YapeVerifyResult,
  YapePaymentConfig
} from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import { api } from '../services/api';
import { useRealtimeWebSocket } from '../hooks/useRealtimeWebSocket';
import { readPublicCache, writePublicCache } from '../utils/publicCache';
import { useAuthState } from './auth/useAuthState';
import { useCatalogState } from './catalog/useCatalogState';
import { useNotificationsState } from './notifications/useNotificationsState';
import { useCartState } from './cart/useCartState';
import { useWebSocketDispatcher } from './realtime/useWebSocketDispatcher';
import { STORAGE_KEY_PREFIX } from './storageKeys';

const DEFAULT_FALLBACK_STORE: StoreConfig = {
  id: '',
  name: 'JamuyWasi',
  slug: 'jamuywasi',
  tagline: 'Catálogo de productos exclusivo por WhatsApp',
  description: 'Consulta nuestros productos y haz tu pedido en WhatsApp.',
  logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80',
  countryCode: '51',
  phone: '987654321',
  currency: 'PEN',
  currencySymbol: 'S/',
  address: 'Lima, Perú',
  schedule: 'Lunes a Sábado: 9:00 AM - 8:00 PM',
  deliveryFee: 10,
  freeDeliveryThreshold: 150,
  allowPickup: true,
  paymentInstructions: 'Aceptamos Yape, Plin y transferencias bancarias.',
  whatsappMessageTemplate: '',
  themeColor: 'emerald'
};

import {
  AppContext,
  useApp,
  AppContextType,
  CustomerCheckoutData
} from './AppContextCore';

export { useApp, AppContext };
export type { AppContextType, CustomerCheckoutData };

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper para leer parámetros iniciales de la URL del navegador
  const getInitialUrlParams = () => {
    if (typeof window === 'undefined') {
      return {
        view: 'home' as ActiveView,
        store: '',
        tab: 'overview' as 'overview' | 'profile' | 'products' | 'orders' | 'reports' | 'settings' | 'subscription',
        adminTab: 'users' as 'users' | 'plans' | 'banners' | 'promos' | 'yape_config',
        category: 'all',
        filterStores: [] as string[],
        productId: '',
        viewingStore: false
      };
    }

    const pathname = window.location.pathname;
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
    const firstSegment = cleanPath.split('/')[0] || '';

    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const storeParam = params.get('store') || '';
    const tabParam = params.get('tab');
    const adminTabParam = params.get('adminTab');
    const categoryParam = params.get('category') || 'all';
    const filterStoresParam = params.get('filterStore');
    const productParam = params.get('product') || '';

    let view: ActiveView = 'home';
    let viewingStore = false;
    let effectiveStore = storeParam;

    const reservedPaths = ['marketplace', 'merchant', 'superadmin', 'home', 'catalogo', 'catalog', 'admin', 'index.html'];

    if (firstSegment && !reservedPaths.includes(firstSegment.toLowerCase())) {
      // ¡Es el slug de una tienda directo después del dominio! (Ej: midominio.pe/verdevivo-botanica)
      view = 'catalog';
      viewingStore = true;
      effectiveStore = firstSegment;
    } else if (firstSegment === 'marketplace' || viewParam === 'marketplace') {
      view = 'marketplace';
    } else if (firstSegment === 'merchant' || viewParam === 'merchant') {
      view = 'merchant';
    } else if (firstSegment === 'superadmin' || viewParam === 'superadmin') {
      view = 'superadmin';
    } else if (viewParam === 'catalog') {
      view = 'catalog';
      if (storeParam) {
        viewingStore = true;
      }
    } else if (storeParam) {
      // Si la URL viene como ?store=slug, abrimos catálogo de la tienda
      view = 'catalog';
      viewingStore = true;
    }

    const validMerchantTabs = ['overview', 'profile', 'products', 'orders', 'reports', 'settings', 'subscription'];
    const tab = (tabParam && validMerchantTabs.includes(tabParam))
      ? (tabParam as 'overview' | 'profile' | 'products' | 'orders' | 'reports' | 'settings' | 'subscription')
      : 'overview';

    const validAdminTabs = ['users', 'plans', 'banners', 'promos', 'yape_config'];
    const adminTab = (adminTabParam && validAdminTabs.includes(adminTabParam))
      ? (adminTabParam as 'users' | 'plans' | 'banners' | 'promos' | 'yape_config')
      : 'users';

    const filterStores = filterStoresParam ? filterStoresParam.split(',').filter(Boolean) : [];

    return {
      view,
      store: effectiveStore,
      tab,
      adminTab,
      category: categoryParam,
      filterStores,
      productId: productParam,
      viewingStore
    };
  };

  const initialUrlState = getInitialUrlParams();

  // ===================== Slice: Catálogo (tiendas, productos, banners, Yape) =====================
  const {
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
  } = useCatalogState({ initialStoreId: initialUrlState.store });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // UI State inicializado con la URL
  const [activeView, setActiveView] = useState<ActiveView>(initialUrlState.view);
  const [viewingStoreCatalog, setViewingStoreCatalog] = useState<boolean>(initialUrlState.viewingStore);
  const [marketplaceCategoryFilter, setMarketplaceCategoryFilter] = useState<string>(initialUrlState.category);
  const [marketplaceStoreFilter, setMarketplaceStoreFilter] = useState<string[]>(initialUrlState.filterStores);
  const [merchantTab, setMerchantTab] = useState<'overview' | 'profile' | 'products' | 'orders' | 'reports' | 'settings' | 'subscription'>(initialUrlState.tab);
  const [adminTab, setAdminTab] = useState<'users' | 'plans' | 'banners' | 'promos' | 'yape_config'>(initialUrlState.adminTab as any);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // ===================== Slice: Identidad / Cuenta =====================
  const {
    currentUserId,
    setCurrentUserId,
    users,
    setUsers,
    myStores,
    setMyStores,
    currentUser,
    effectiveUser,
    isAuthenticated,
    isSuperAdmin,
    isMerchant,
    authModalOpen,
    authModalMode,
    setAuthModalOpen,
    setAuthModalMode,
    openLoginModal,
    openRegisterModal,
    pendingApprovalModalOpen,
    setPendingApprovalModalOpen,
    pendingApprovalMerchantData,
    setPendingApprovalMerchantData,
    planPurchaseModalOpen,
    setPlanPurchaseModalOpen,
    planPurchaseInitialPlan,
    openPlanPurchaseModal,
    closePlanPurchaseModal,
    refreshMyStores,
    createAdditionalStore,
    isProfileModalOpen,
    setIsProfileModalOpen,
    openProfileModal,
    closeProfileModal,
    updateCurrentUserProfile,
    approveUserAccount,
    suspendUserAccount,
    refreshUsers,
    login,
    mustChangePinModalOpen,
    setMustChangePinModalOpen,
    adminResetPinDefault,
    changePin,
    requestForgotPin,
    registerMerchantStore,
    addUser,
    updateUser,
    deleteUser,
    updateUserSubscription,
    switchUserRole
  } = useAuthState({ setStores, setProducts, setCurrentStoreId, setActiveView, refreshStores });

  // Derived state: Si estamos en el panel de comerciante ('merchant'), la tienda activa se fija estrictamente a la propia tienda del usuario.
  const currentStore = useMemo(() => {
    if (activeView === 'merchant' && isMerchant) {
      if (myStores.length > 0) {
        const matchedSelected = myStores.find(s => s.id === currentStoreId);
        if (matchedSelected) return matchedSelected;
        const matchedPrimary = myStores.find(s => s.id === currentUser?.storeId);
        if (matchedPrimary) return matchedPrimary;
        return myStores[0];
      }

      if (currentUser?.storeId) {
        const matchedInStores = stores.find(s => s.id === currentUser.storeId);
        if (matchedInStores) return matchedInStores;
      }
      const matchedByOwner = stores.find(s => (s as any).ownerId === currentUser?.id);
      if (matchedByOwner) return matchedByOwner;

      return {
        ...DEFAULT_FALLBACK_STORE,
        id: currentUser?.storeId || `store_${currentUser?.id || 'pending'}`,
        name: currentUser?.name ? `Tienda de ${currentUser.name}` : 'Mi Tienda',
        phone: currentUser?.phone || '',
        ownerId: currentUser?.id
      };
    }

    if (currentStoreId) {
      const matched = stores.find(s => s.id === currentStoreId || s.slug === currentStoreId);
      if (matched) return matched;
    }

    return stores[0] || DEFAULT_FALLBACK_STORE;
  }, [activeView, isMerchant, currentStoreId, currentUser, myStores, stores]);

  const currentStoreProducts = useMemo(() => {
    return products.filter(p => p.storeId === currentStore.id);
  }, [products, currentStore.id]);

  // Ref para evitar bucle entre popstate y pushState
  const isPopStateNavigating = React.useRef(false);
  // Cuando es true, el próximo cambio de URL usa replaceState (no ensucia el historial).
  // Empieza en true: la primera normalización de la URL de entrada (p. ej. ?view=superadmin -> /superadmin)
  // reemplaza en vez de agregar, así el botón Atrás no vuelve a una dirección que redirige.
  const replaceNextUrl = React.useRef(true);

  const handleSubscriptionActivated = (result: YapeVerifyResult) => {
    if (!result.success) return;

    const targetUserId = currentUserId || currentUser?.id;
    if (targetUserId) {
      setUsers(prev => prev.map(u => {
        if (u.id === targetUserId) {
          return {
            ...u,
            status: (result.userStatus as any) || 'active',
            subscription: {
              ...u.subscription,
              status: (result.subscriptionStatus as any) || 'active',
              planId: (result.subscriptionPlan as any) || u.subscription.planId,
              currentPeriodEnd: result.subscriptionPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          };
        }
        return u;
      }));
    }

    const storeIdToActivate = currentStore?.id || currentUser?.storeId;
    if (storeIdToActivate) {
      setStores(prev => prev.map(s => (s.id === storeIdToActivate || s.ownerId === targetUserId) ? { ...s, isActive: true } : s));
    }

    refreshMyStores();
    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // ===================== Slice: Carrito + Pedidos =====================
  const {
    cart,
    setCart,
    cartDrawerOpen,
    setCartDrawerOpen,
    orders,
    setOrders,
    lastCompletedOrder,
    orderSuccessModalOpen,
    setOrderSuccessModalOpen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartStore,
    cartStoreAvailable,
    pendingCartSwitch,
    confirmCartSwitch,
    cancelCartSwitch,
    submitOrderToWhatsApp,
    updateOrderStatus
  } = useCartState({ products, stores, myStores, currentStore, currentUserId });

  const currentStoreOrders = useMemo(() => {
    return orders.filter(o => o.storeId === currentStore.id || (currentStore.slug && o.storeId === currentStore.slug));
  }, [orders, currentStore.id, currentStore.slug]);

  // ===================== Slice: Notificaciones =====================
  const {
    notifications,
    setNotifications,
    unreadNotifications,
    setUnreadNotifications,
    refreshNotifications,
    openNotification,
    markAllNotificationsRead,
    liveNotifications,
    addLiveNotification,
    dismissLiveNotification
  } = useNotificationsState({ currentUserId, setActiveView, setCurrentStoreId, setMerchantTab, setAdminTab });

  const logout = useCallback(() => {
    api.logout();
    setCurrentUserId('');
    setMyStores([]);
    // Borrar de memoria y del navegador los datos privados de la sesión
    // (pedidos con datos de clientes, lista de usuarios del admin)
    setOrders([]);
    setUsers([]);
    setNotifications([]);
    setUnreadNotifications(0);
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'currentUserId');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'currentStoreId');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'orders');
    } catch { /* almacenamiento no disponible */ }
    api.getStores(false).then(publicStores => {
      if (publicStores && publicStores.length > 0) {
        setStores(publicStores);
        setCurrentStoreId(publicStores[0].id);
      }
    }).catch(() => {});
    setActiveView('home');
  }, [setCurrentUserId, setMyStores, setOrders, setUsers, setNotifications, setUnreadNotifications, setStores, setCurrentStoreId]);

  const currentUserRef = useRef<UserAccount | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // ¿Este visitante puede ver la tienda? (las inactivas solo las ve su dueño o el superadmin)
  const canSeeStore = useCallback((store: StoreConfig) => {
    if (store.isActive !== false) return true;
    const cur = currentUserRef.current;
    if (!cur) return false;
    return cur.role === 'superadmin' || cur.id === store.ownerId || cur.storeId === store.id;
  }, []);

  // Resincronizar después de una reconexión del WebSocket o de un cambio de sesión:
  // los eventos emitidos mientras estábamos desconectados se pierden, así que pedimos el estado actual.
  const resyncAfterReconnect = useCallback(async () => {
    const cur = currentUserRef.current;
    if (cur) refreshNotifications();  // notificaciones que llegaron mientras no había conexión
    const isAdmin = cur?.role === 'superadmin';
    const upsert = <T extends { id: string }>(prev: T[], fresh: T[]) => {
      const map = new Map(prev.map(x => [x.id, x] as [string, T]));
      fresh.forEach(x => map.set(x.id, x));
      return Array.from(map.values());
    };
    try {
      const [freshProducts, freshStores, freshBanners] = await Promise.all([
        api.getProducts().catch(() => null),
        api.getStores(isAdmin).catch(() => null),
        api.getBanners(isAdmin).catch(() => null),
      ]);
      if (freshProducts) setProducts(prev => upsert(prev, freshProducts));
      if (freshStores) setStores(prev => upsert(prev, freshStores));
      if (freshBanners) setBanners(freshBanners);
      // Actualizar la caché pública (solo con respuestas públicas, nunca con las del admin)
      if (!isAdmin && freshProducts && freshStores && freshBanners) {
        writePublicCache({ stores: freshStores, products: freshProducts, banners: freshBanners, yapeConfig: readPublicCache()?.yapeConfig || null });
      }
      if (cur) {
        const freshOrders = await api.getAllOrders().catch(() => null);
        // Reemplazar (no mezclar) para no arrastrar pedidos de otra sesión
        if (freshOrders) {
          setOrders([...freshOrders].sort(
            (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        }
      }
    } catch (err) {
      console.warn('No se pudo resincronizar tras reconectar:', err);
    }
  }, [refreshNotifications, setOrders, setProducts, setStores, setBanners]);

  // Real-time WebSocket Event Dispatcher
  const handleWebSocketMessage = useWebSocketDispatcher({
    currentUserRef,
    canSeeStore,
    refreshMyStores,
    logout,
    addLiveNotification,
    openNotification,
    setProducts,
    setBanners,
    setOrders,
    setUsers,
    setStores,
    setMyStores,
    setYapeConfig,
    setNotifications,
    setUnreadNotifications,
    setPendingApprovalModalOpen,
    setPlanPurchaseModalOpen,
    setMustChangePinModalOpen
  });

  const { isConnected: isRealtimeConnected } = useRealtimeWebSocket(handleWebSocketMessage, currentUserId, resyncAfterReconnect);

  // Initial Data Fetch from FastAPI Backend
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // null = falló la petición (sin red / servidor caído): se conserva lo que había (caché)
      const [fetchedStores, fetchedProducts, fetchedBanners, meUser, fetchedYapeConfig] = await Promise.all([
        api.getStores().catch(() => null),
        api.getProducts().catch(() => null),
        api.getBanners().catch(() => null),
        api.getCurrentUser().catch(() => null),
        api.getYapeConfig().catch(() => null)
      ]);

      // Guardar SOLO las respuestas públicas (antes de mezclar datos del panel) para el próximo arranque
      if (fetchedStores && fetchedProducts && fetchedBanners) {
        writePublicCache({
          stores: fetchedStores,
          products: fetchedProducts,
          banners: fetchedBanners,
          yapeConfig: fetchedYapeConfig && fetchedYapeConfig.phone ? fetchedYapeConfig : null,
        });
      }

      if (fetchedYapeConfig && fetchedYapeConfig.phone) {
        setYapeConfig(fetchedYapeConfig);
      }

      if (fetchedStores) {
        // Reemplaza la caché aunque venga vacía (p. ej. se despublicaron todas las tiendas)
        setStores(fetchedStores);
      }
      if (fetchedStores && fetchedStores.length > 0) {
        setCurrentStoreId(prevId => {
          // Si la URL inicial traía una tienda (por slug o id), buscar coincidencia
          const initialUrlStore = initialUrlState.store;
          if (initialUrlStore) {
            const matched = fetchedStores.find(
              s => s.slug === initialUrlStore || s.id === initialUrlStore
            );
            if (matched) return matched.id;
          }
          if (prevId) {
            return prevId;
          }
          return fetchedStores[0].id;
        });
      }

      if (fetchedProducts) {
        const uniqueProducts: Product[] = Array.from(new Map<string, Product>(fetchedProducts.map(p => [p.id, p] as [string, Product])).values());
        setProducts(uniqueProducts);

        // Si la URL inicial traía un producto específico (?product=prod_xxx o slug)
        if (initialUrlState.productId) {
          const matchedProd = uniqueProducts.find(
            p => p.id === initialUrlState.productId || p.slug === initialUrlState.productId
          );
          if (matchedProd) {
            setSelectedProductForModal(matchedProd);
          }
        }
      }

      if (fetchedBanners) {
        const uniqueBanners: PromotionalBanner[] = Array.from(new Map<string, PromotionalBanner>(fetchedBanners.map(b => [b.id, b] as [string, PromotionalBanner])).values());
        setBanners(uniqueBanners);
      }

      if (meUser) {
        setCurrentUserId(meUser.id);
        if (meUser.storeId && meUser.storeId !== 'all') {
          // Solo sobrescribir si no venía ya un store en la URL
          if (!initialUrlState.store) {
            setCurrentStoreId(meUser.storeId);
          }
        }

        // Si es SuperAdmin, cargamos todos los usuarios y todas las tiendas (incluyendo pendientes) y todos los banners
        if (meUser.role === 'superadmin') {
          const [allUsers, allStores, allBanners] = await Promise.all([
            api.getUsers().catch(() => []),
            api.getStores(true).catch(() => []),
            api.getBanners(true).catch(() => [])
          ]);
          if (allUsers && allUsers.length > 0) {
            setUsers(allUsers);
          } else {
            setUsers([meUser]);
          }
          if (allStores && allStores.length > 0) {
            setStores(allStores);
          }
          if (allBanners && allBanners.length > 0) {
            setBanners(allBanners);
          }
        } else {
          setUsers([meUser]);
          if (meUser.role === 'merchant') {
            const [ms, mp] = await Promise.all([
              api.getMyStores().catch(() => []),
              api.getMyProducts().catch(() => [])
            ]);
            if (ms && ms.length > 0) {
              setMyStores(ms);
              // Integrar tiendas del comerciante en la lista global de tiendas
              setStores(prev => {
                const map = new Map(prev.map(s => [s.id, s]));
                ms.forEach(s => map.set(s.id, s));
                return Array.from(map.values());
              });
              // Si no hay store en URL o el actual no le pertenece al comerciante, fijar su tienda
              if (!initialUrlState.store || !ms.some(s => s.id === initialUrlState.store || s.slug === initialUrlState.store)) {
                setCurrentStoreId(prevId => {
                  if (ms.some(s => s.id === prevId)) return prevId;
                  return meUser.storeId || ms[0].id;
                });
              }
            }
            if (mp && mp.length > 0) {
              setProducts(prev => {
                const map = new Map(prev.map(p => [p.id, p]));
                mp.forEach(p => map.set(p.id, p));
                return Array.from(map.values());
              });
            }
            if (meUser.status === 'pending_approval' || meUser.subscription_status === 'pending_approval') {
              openPlanPurchaseModal((meUser.subscription_plan as PlanTier) || 'starter');
            }
          }
        }

        // Cargar pedidos reales desde el backend para el comerciante / administrador
        try {
          const backendOrders = await api.getAllOrders().catch(() => []);
          // Los pedidos del backend son la fuente de verdad: reemplazan lo guardado en el navegador
          setOrders([...(backendOrders || [])].sort(
            (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        } catch (e) {
          console.warn('No se pudieron cargar pedidos del backend:', e);
        }
      }
    } catch (err) {
      console.error('Error al inicializar datos con el backend:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [setOrders, setStores, setProducts, setBanners, setYapeConfig, setCurrentStoreId, setUsers, setMyStores]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync state to localStorage for session persistence
  useEffect(() => {
    if (currentStoreId) {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'currentStoreId', currentStoreId);
    }
  }, [currentStoreId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'currentUserId', currentUserId);
    } catch { /* almacenamiento no disponible */ }
  }, [currentUserId]);

  const redirectToHome = useCallback(() => {
    replaceNextUrl.current = true;
    setViewingStoreCatalog(false);
    setSelectedProductForModal(null);
    setActiveView('home');
    // Si ya estábamos en 'home' el efecto de URL no se dispara: limpiar la URL directamente
    if (typeof window !== 'undefined' && (window.location.pathname !== '/' || window.location.search)) {
      window.history.replaceState({ path: '/' }, '', '/');
    }
  }, []);

  // Sincronizar URL cada vez que cambie el estado de navegación
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Si este cambio fue provocado por el botón Atrás/Adelante del navegador, no hacer pushState
    if (isPopStateNavigating.current) {
      isPopStateNavigating.current = false;
      return;
    }

    const currentStoreObj = stores.find(s => s.id === currentStoreId);
    const storeIdentifier = currentStoreObj?.slug || currentStoreId;

    let targetPath = '/';
    const params = new URLSearchParams();

    if (activeView === 'home') {
      targetPath = '/';
    } else if (activeView === 'marketplace') {
      targetPath = '/marketplace';
      if (marketplaceCategoryFilter && marketplaceCategoryFilter !== 'all') {
        params.set('category', marketplaceCategoryFilter);
      }
      if (marketplaceStoreFilter && marketplaceStoreFilter.length > 0) {
        params.set('filterStore', marketplaceStoreFilter.join(','));
      }
    } else if (activeView === 'catalog') {
      if (viewingStoreCatalog && storeIdentifier) {
        // Enlace / Slug directo después del dominio (ej: dominio.pe/slug-tienda)
        targetPath = `/${storeIdentifier}`;
      } else {
        targetPath = '/marketplace';
      }
      if (selectedProductForModal) {
        params.set('product', selectedProductForModal.slug || selectedProductForModal.id);
      }
    } else if (activeView === 'merchant') {
      targetPath = '/merchant';
      if (merchantTab && merchantTab !== 'overview') {
        params.set('tab', merchantTab);
      }
    } else if (activeView === 'superadmin') {
      targetPath = '/superadmin';
      if (adminTab && adminTab !== 'users') {
        params.set('adminTab', adminTab);
      }
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${targetPath}?${queryString}` : targetPath;
    const currentFullUrl = `${window.location.pathname}${window.location.search}`;

    if (replaceNextUrl.current) {
      replaceNextUrl.current = false;
      if (newUrl !== currentFullUrl) window.history.replaceState({ path: newUrl }, '', newUrl);
    } else if (newUrl !== currentFullUrl) {
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  }, [
    activeView,
    viewingStoreCatalog,
    currentStoreId,
    selectedProductForModal,
    merchantTab,
    adminTab,
    marketplaceCategoryFilter,
    marketplaceStoreFilter,
    stores
  ]);

  // Escuchar navegación Atrás / Adelante (popstate)
  useEffect(() => {
    const handlePopState = () => {
      isPopStateNavigating.current = true;
      const urlState = getInitialUrlParams();

      setActiveView(urlState.view);
      setViewingStoreCatalog(urlState.viewingStore);
      setMarketplaceCategoryFilter(urlState.category);
      setMarketplaceStoreFilter(urlState.filterStores);
      setMerchantTab(urlState.tab);
      setAdminTab(urlState.adminTab);

      if (urlState.store) {
        const foundStore = stores.find(
          s => s.slug === urlState.store || s.id === urlState.store
        );
        if (foundStore) {
          setCurrentStoreId(foundStore.id);
        }
      }

      if (urlState.productId) {
        const foundProd = products.find(
          p => p.id === urlState.productId || p.slug === urlState.productId
        );
        setSelectedProductForModal(foundProd || null);
      } else {
        setSelectedProductForModal(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [stores, products]);

  // Sincronizar currentStoreId cuando se ingresa al panel de comerciante para asegurar coherencia
  useEffect(() => {
    if (activeView === 'merchant' && isMerchant && currentStore?.id && currentStoreId !== currentStore.id) {
      setCurrentStoreId(currentStore.id);
    }
  }, [activeView, isMerchant, currentStore?.id, currentStoreId]);

  // MinIO Image Upload con compresión inteligente en cliente
  const uploadImage = async (file: File, folder: 'logos' | 'products' | 'banners' = 'products') => {
    // Configurar resolución máxima según el destino:
    // - logos: 400x400
    // - products: 1000x1000
    // - banners: 1400x1400
    const maxDimension = folder === 'logos' ? 400 : folder === 'products' ? 1000 : 1400;
    const compressed = await compressImageFile(file, {
      maxWidth: maxDimension,
      maxHeight: maxDimension,
      quality: 0.84,
      format: 'image/webp'
    });
    // Miniatura de 400 px para las tarjetas del catálogo (se genera en el navegador, no en el servidor)
    let thumb: File | null = null;
    if (folder === 'products' && compressed.type === 'image/webp') {
      try {
        thumb = await compressImageFile(file, { maxWidth: 400, maxHeight: 400, quality: 0.8, format: 'image/webp' });
        if (thumb.type !== 'image/webp') thumb = null;
      } catch { thumb = null; }
    }
    return await api.uploadImage(compressed, folder, thumb);
  };

  const openStoreCatalog = (storeId: string) => {
    setCurrentStoreId(storeId);
    setViewingStoreCatalog(true);
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnToStoresDirectory = () => {
    setViewingStoreCatalog(false);
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStoreProduct = (storeId: string, product: Product) => {
    trackProductVisit(product.id);
    setCurrentStoreId(storeId);
    setViewingStoreCatalog(true);
    setSelectedProductForModal(product);
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToMarketplaceWithCategory = (category: string) => {
    setMarketplaceCategoryFilter(category);
    setMarketplaceStoreFilter([]);
    setActiveView('marketplace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToMarketplaceWithStore = (storeId: string) => {
    setMarketplaceStoreFilter([storeId]);
    setMarketplaceCategoryFilter('all');
    setActiveView('marketplace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Merchant CRUD Actions with Backend Connection
  // Si el servidor no guarda el producto (límite del plan, sin conexión…) se lanza el error
  // para que el formulario lo muestre. Antes se creaba una copia "local" que parecía guardada y no lo estaba.
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'storeId'>) => {
    const created = await api.createProduct({
      ...productData,
      storeId: currentStore.id
    });
    setProducts(prev => {
      if (prev.some(p => p.id === created.id)) {
        return prev.map(p => p.id === created.id ? created : p);
      }
      return [created, ...prev];
    });
  };

  const deleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
    } catch (err) {
      console.error('Error al eliminar producto en backend:', err);
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const upgradeSubscription = (planId: PlanTier, billingCycle: 'monthly' | 'annual' = 'monthly') => {
    let newPeriodEndStr = '';
    const additionalDays = billingCycle === 'annual' ? 365 : 30;

    setUsers(prev => prev.map(u => {
      if (u.storeId === currentStore.id || u.id === currentUserId) {
        const isPreviouslyActive = u.status === 'active' && u.subscription?.status === 'active';
        const currentEndMs = (isPreviouslyActive && u.subscription?.currentPeriodEnd) ? new Date(u.subscription.currentPeriodEnd).getTime() : 0;
        const baseTime = currentEndMs > Date.now() ? currentEndMs : Date.now();
        const newEnd = new Date(baseTime + additionalDays * 24 * 60 * 60 * 1000).toISOString();
        newPeriodEndStr = newEnd;

        return {
          ...u,
          status: 'active',
          subscription: {
            ...u.subscription,
            planId,
            status: 'active',
            billingCycle,
            currentPeriodEnd: newEnd
          }
        };
      }
      return u;
    }));

    // Persistir en backend
    const targetUser = users.find(u => u.storeId === currentStore.id || u.id === currentUserId);
    if (targetUser && newPeriodEndStr) {
      api.updateUser(targetUser.id, {
        subscription_plan: planId,
        subscription_status: 'active',
        subscription_period_end: newPeriodEndStr,
        status: 'active'
      }).catch(err => console.error('Error al actualizar vigencia en backend:', err));
    }

    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 }
      });
    } catch {
      // silent
    }
  };

  const createNewStore = (
    storeData: Partial<StoreConfig>,
    merchantName: string,
    merchantEmail: string,
    plan: PlanTier
  ) => {
    const newStoreId = `store_${Date.now()}`;
    const newStore: StoreConfig = {
      id: newStoreId,
      name: storeData.name || 'Mi Nueva Tienda',
      slug: (storeData.name || 'tienda').toLowerCase().replace(/\s+/g, '-'),
      tagline: storeData.tagline || 'Catálogo de productos exclusivo por WhatsApp',
      description: storeData.description || 'Consulta nuestros productos y haz tu pedido en WhatsApp.',
      logo: storeData.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80',
      banner: storeData.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80',
      countryCode: storeData.countryCode || '51',
      phone: storeData.phone || '987654321',
      currency: storeData.currency || 'PEN',
      currencySymbol: storeData.currencySymbol || 'S/',
      address: storeData.address || 'Lima, Perú',
      schedule: storeData.schedule || 'Lunes a Sábado: 9:00 AM - 7:00 PM',
      deliveryFee: storeData.deliveryFee ?? 10,
      freeDeliveryThreshold: storeData.freeDeliveryThreshold ?? 150,
      allowPickup: storeData.allowPickup ?? true,
      paymentInstructions: storeData.paymentInstructions || 'Aceptamos Yape, Plin, transferencias bancarias y efectivo.',
      whatsappMessageTemplate: '',
      themeColor: 'emerald'
    };

    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      name: merchantName,
      email: merchantEmail,
      role: 'merchant',
      storeId: newStoreId,
      subscription: {
        planId: plan,
        status: 'active',
        billingCycle: 'monthly',
        startDate: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        renewsAutomatically: true
      },
      createdAt: new Date().toISOString()
    };

    setStores(prev => [...prev, newStore]);
    setUsers(prev => [...prev, newUser]);
    setCurrentStoreId(newStoreId);
  };

  const deleteStore = async (storeId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.deleteStore(storeId);
      setStores(prev => prev.filter(s => s.id !== storeId));
      setProducts(prev => prev.filter(p => p.storeId !== storeId));
      if (currentStoreId === storeId) {
        const remaining = stores.filter(s => s.id !== storeId);
        setCurrentStoreId(remaining[0]?.id || '');
      }
      await refreshStores();
      await refreshMyStores();
      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      console.error('Error al eliminar tienda:', err);
      return { success: false, error: err.message || 'Error al eliminar la tienda' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        stores,
        currentStoreId,
        currentStore,
        products,
        currentStoreProducts,
        orders,
        currentStoreOrders,
        users,
        currentUser,
        effectiveUser,
        isAuthenticated,
        isSuperAdmin,
        isMerchant,
        currentUserId,
        setCurrentUserId,
        banners,
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerActive,
        yapeConfig,
        updateYapeConfig,
        refreshYapeConfig,
        isRealtimeConnected,
        activeView,
        merchantTab,
        adminTab,
        setAdminTab,
        cart,
        cartDrawerOpen,
        selectedProductForModal,
        lastCompletedOrder,
        orderSuccessModalOpen,
        isLoadingData,
        redirectToHome,
        uploadImage,
        authModalOpen,
        authModalMode,
        setAuthModalOpen,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
        pendingApprovalModalOpen,
        setPendingApprovalModalOpen,
        pendingApprovalMerchantData,
        setPendingApprovalMerchantData,
        planPurchaseModalOpen,
        planPurchaseInitialPlan,
        openPlanPurchaseModal,
        closePlanPurchaseModal,
        myStores,
        refreshMyStores,
        createAdditionalStore,
        isProfileModalOpen,
        setIsProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        updateCurrentUserProfile,
        approveUserAccount,
        suspendUserAccount,
        refreshUsers,
        login,
        mustChangePinModalOpen,
        setMustChangePinModalOpen,
        adminResetPinDefault,
        changePin,
        requestForgotPin,
        logout,
        registerMerchantStore,
        setActiveView,
        setMerchantTab,
        setCurrentStoreId,
        viewingStoreCatalog,
        setViewingStoreCatalog,
        openStoreCatalog,
        returnToStoresDirectory,
        trackProductVisit,
        navigateToStoreProduct,
        marketplaceCategoryFilter,
        setMarketplaceCategoryFilter,
        navigateToMarketplaceWithCategory,
        navigateToMarketplaceWithStore,
        marketplaceStoreFilter,
        setMarketplaceStoreFilter,
        addToCart,
        cartStore,
        cartStoreAvailable,
        notifications,
        unreadNotifications,
        openNotification,
        markAllNotificationsRead,
        pendingCartSwitch,
        confirmCartSwitch,
        cancelCartSwitch,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        setCartDrawerOpen,
        setSelectedProductForModal,
        setOrderSuccessModalOpen,
        submitOrderToWhatsApp,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        updateStoreConfig,
        deleteStore,
        upgradeSubscription,
        createNewStore,
        addUser,
        updateUser,
        deleteUser,
        updateUserSubscription,
        switchUserRole,
        handleSubscriptionActivated,
        liveNotifications,
        addLiveNotification,
        dismissLiveNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
