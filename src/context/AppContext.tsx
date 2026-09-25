import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fireConfetti as confetti } from '../utils/confetti';
import {
  StoreConfig,
  Product,
  Order,
  CartItem,
  UserAccount,
  PlanTier,
  OrderStatus,
  Subscription,
  ActiveView,
  PromotionalBanner,
  UserProfileUpdateData,
  YapeVerifyResult,
  YapePaymentConfig,
  LoginResult,
  LiveNotification,
  UserAdminUpdateData,
  AppNotification
} from '../types';
import { SAAS_PLANS } from '../data/initialData';
import {
  generateWhatsAppOrderMessage,
  buildWhatsAppLink,
  getProductEffectivePrice
} from '../utils/whatsapp';
import { compressImageFile } from '../utils/imageCompressor';
import { api, mapProductFromBackend, mapBannerFromBackend, mapStoreFromBackend, mapOrderFromBackend, mergeUserFromBackend, notificationsApi, mapNotificationFromBackend } from '../services/api';
import { useRealtimeWebSocket, WebSocketMessage } from '../hooks/useRealtimeWebSocket';
import { audioNotification } from '../utils/audioNotification';
import { readPublicCache, writePublicCache } from '../utils/publicCache';

const DEFAULT_YAPE_CONFIG: YapePaymentConfig = {
  phone: '925763903',
  phoneFormatted: '+51 925 763 903',
  holder: 'JamuyWasi',
  qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/51925763903?text=Pago%20Yape%20JamuyWasi',
  instructions: 'Abona el monto exacto por Yape o Plin. Luego ingresa el código de aprobación de 3 dígitos para verificación y activación inmediata de tu tienda.'
};

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

const DEFAULT_FALLBACK_USER: UserAccount = {
  id: 'usr_guest',
  name: 'Invitado',
  email: 'invitado@jamuywasi.com',
  role: 'merchant',
  storeId: '',
  subscription: {
    planId: 'pro',
    status: 'active',
    billingCycle: 'monthly',
    startDate: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    renewsAutomatically: true
  },
  createdAt: new Date().toISOString()
};

import {
  AppContext,
  useApp,
  AppContextType,
  CustomerCheckoutData
} from './AppContextCore';

export { useApp, AppContext };
export type { AppContextType, CustomerCheckoutData };

const STORAGE_KEY_PREFIX = 'catalog_saas_v4_';

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

  // Live State from Backend
  // Datos públicos: arrancan con la caché local (se ven al instante) y luego se reemplazan con los del servidor
  const [stores, setStores] = useState<StoreConfig[]>(() => readPublicCache()?.stores || []);
  const [currentStoreId, setCurrentStoreId] = useState<string>(() => {
    return initialUrlState.store || localStorage.getItem(STORAGE_KEY_PREFIX + 'currentStoreId') || '';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'currentUserId') || '';
  });
  const [products, setProducts] = useState<Product[]>(() => readPublicCache()?.products || []);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [banners, setBanners] = useState<PromotionalBanner[]>(() => readPublicCache()?.banners || []);
  const [myStores, setMyStores] = useState<StoreConfig[]>([]);
  const [yapeConfig, setYapeConfig] = useState<YapePaymentConfig>(() => readPublicCache()?.yapeConfig || DEFAULT_YAPE_CONFIG);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // User Authentication & RBAC (memoized to prevent Temporal Dead Zone issues)
  const currentUser = useMemo(() => {
    return currentUserId ? (users.find(u => u.id === currentUserId) || null) : null;
  }, [currentUserId, users]);
  const isAuthenticated = currentUser !== null;
  const isSuperAdmin = currentUser !== null && currentUser.role === 'superadmin';
  const isMerchant = currentUser !== null && currentUser.role === 'merchant';

  // UI State inicializado con la URL
  const [activeView, setActiveView] = useState<ActiveView>(initialUrlState.view);
  const [viewingStoreCatalog, setViewingStoreCatalog] = useState<boolean>(initialUrlState.viewingStore);
  const [marketplaceCategoryFilter, setMarketplaceCategoryFilter] = useState<string>(initialUrlState.category);
  const [marketplaceStoreFilter, setMarketplaceStoreFilter] = useState<string[]>(initialUrlState.filterStores);
  const [merchantTab, setMerchantTab] = useState<'overview' | 'profile' | 'products' | 'orders' | 'reports' | 'settings' | 'subscription'>(initialUrlState.tab);
  const [adminTab, setAdminTab] = useState<'users' | 'plans' | 'banners' | 'promos' | 'yape_config'>(initialUrlState.adminTab as any);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);

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

  const currentStoreOrders = useMemo(() => {
    return orders.filter(o => o.storeId === currentStore.id || (currentStore.slug && o.storeId === currentStore.slug));
  }, [orders, currentStore.id, currentStore.slug]);

  const effectiveUser = currentUser || DEFAULT_FALLBACK_USER;

  // Ref para evitar bucle entre popstate y pushState
  const isPopStateNavigating = React.useRef(false);
  // Cuando es true, el próximo cambio de URL usa replaceState (no ensucia el historial).
  // Empieza en true: la primera normalización de la URL de entrada (p. ej. ?view=superadmin -> /superadmin)
  // reemplaza en vez de agregar, así el botón Atrás no vuelve a una dirección que redirige.
  const replaceNextUrl = React.useRef(true);

  // Auth & Registration modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [pendingApprovalModalOpen, setPendingApprovalModalOpen] = useState(false);
  const [pendingApprovalMerchantData, setPendingApprovalMerchantData] = useState<{
    storeName: string;
    merchantName: string;
    email: string;
    phone: string;
    plan: string;
  } | null>(null);

  const openPendingApprovalModal = (data?: any) => {
    if (data) {
      setPendingApprovalMerchantData(data);
    }
    setPendingApprovalModalOpen(true);
  };

  // Plan Purchase Modal State
  const [planPurchaseModalOpen, setPlanPurchaseModalOpen] = useState(false);
  const [planPurchaseInitialPlan, setPlanPurchaseInitialPlan] = useState<PlanTier | undefined>('starter');

  const openPlanPurchaseModal = (planId?: PlanTier) => {
    if (planId) setPlanPurchaseInitialPlan(planId);
    setPlanPurchaseModalOpen(true);
  };

  const closePlanPurchaseModal = () => {
    setPlanPurchaseModalOpen(false);
  };

  const refreshMyStores = async () => {
    try {
      const ms = await api.getMyStores();
      setMyStores(ms);
    } catch (err) {
      console.error('Error al refrescar tiendas:', err);
    }
  };

  const createAdditionalStore = async (data: Partial<StoreConfig>) => {
    try {
      const newStore = await api.createStore(data);
      setMyStores(prev => [...prev.filter(s => s.id !== newStore.id), newStore]);
      setStores(prev => [...prev.filter(s => s.id !== newStore.id), newStore]);
      setCurrentStoreId(newStore.id);
      return { success: true, store: newStore };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al crear la tienda' };
    }
  };

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

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  // User Profile Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  // Forced Change PIN Modal state
  const [mustChangePinModalOpen, setMustChangePinModalOpen] = useState(false);

  // Live Notifications state
  const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([]);

  const addLiveNotification = useCallback((notification: Omit<LiveNotification, 'id' | 'timestamp'>) => {
    const id = 'notif_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const newNotification: LiveNotification = {
      ...notification,
      id,
      timestamp: Date.now()
    };
    setLiveNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
  }, []);

  const dismissLiveNotification = useCallback((id: string) => {
    setLiveNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ===================== Notificaciones (campanita) =====================
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  // Elemento a resaltar tras abrir una notificación (pedido, usuario...)
  const [pendingHighlight, setPendingHighlight] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    const data = await notificationsApi.list(30);
    if (data) {
      setNotifications(data.items);
      setUnreadNotifications(data.unread);
    }
  }, []);

  // Abrir una notificación: marcarla como leída y llevar al lugar exacto
  const openNotification = useCallback((n: AppNotification) => {
    if (!n.isRead) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnreadNotifications(c => Math.max(0, c - 1));
      notificationsApi.markRead(n.id);
    }
    const link = n.link || {};
    if (link.view === 'merchant') {
      if (n.storeId) setCurrentStoreId(n.storeId);
      setActiveView('merchant');
      if (link.tab) setMerchantTab(link.tab as any);
    } else if (link.view === 'superadmin') {
      setActiveView('superadmin');
      if (link.adminTab) setAdminTab(link.adminTab as any);
    }
    if (link.targetId) setPendingHighlight(link.targetId);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(x => ({ ...x, isRead: true })));
    setUnreadNotifications(0);
    notificationsApi.markAllRead();
  }, []);

  // Cargar notificaciones al iniciar sesión (y limpiar al salir)
  useEffect(() => {
    if (currentUserId) refreshNotifications();
    else { setNotifications([]); setUnreadNotifications(0); }
  }, [currentUserId, refreshNotifications]);

  // Resaltar (y centrar) la fila del pedido / usuario cuando termina de dibujarse la pestaña
  useEffect(() => {
    if (!pendingHighlight) return;
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.querySelector(`[data-notif-target="${CSS.escape(pendingHighlight)}"]`) as HTMLElement | null;
      if (el || ++tries > 40) {
        clearInterval(timer);
        setPendingHighlight(null);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('notif-highlight');
          setTimeout(() => el.classList.remove('notif-highlight'), 3500);
        }
      }
    }, 150);
    return () => clearInterval(timer);
  }, [pendingHighlight]);

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
  }, []);

  const currentUserRef = useRef<UserAccount | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // ¿Este visitante puede ver la tienda? (las inactivas solo las ve su dueño o el superadmin)
  const canSeeStore = (store: StoreConfig) => {
    if (store.isActive !== false) return true;
    const cur = currentUserRef.current;
    if (!cur) return false;
    return cur.role === 'superadmin' || cur.id === store.ownerId || cur.storeId === store.id;
  };

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
  }, []);

  // Real-time WebSocket Event Dispatcher
  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    switch (msg.type) {
      // --- PRODUCT EVENTS ---
      case 'PRODUCT_CREATED': {
        if (!msg.data) return;
        const newProd = mapProductFromBackend(msg.data);
        setProducts(prev => {
          if (prev.some(p => p.id === newProd.id)) {
            return prev.map(p => p.id === newProd.id ? newProd : p);
          }
          return [newProd, ...prev];
        });
        break;
      }
      case 'PRODUCT_UPDATED': {
        if (!msg.data) return;
        const updatedProd = mapProductFromBackend(msg.data);
        setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
        break;
      }
      case 'PRODUCT_DELETED': {
        if (!msg.data?.id) return;
        const deletedId = msg.data.id;
        setProducts(prev => prev.filter(p => p.id !== deletedId));
        break;
      }

      // --- BANNER EVENTS ---
      case 'BANNER_CREATED': {
        if (!msg.data) return;
        const newBanner = mapBannerFromBackend(msg.data);
        setBanners(prev => {
          if (prev.some(b => b.id === newBanner.id)) {
            return prev.map(b => b.id === newBanner.id ? newBanner : b);
          }
          return [...prev, newBanner];
        });
        break;
      }
      case 'BANNER_UPDATED': {
        if (!msg.data) return;
        const updatedBanner = mapBannerFromBackend(msg.data);
        setBanners(prev => prev.map(b => b.id === updatedBanner.id ? updatedBanner : b));
        break;
      }
      case 'BANNER_DELETED': {
        if (!msg.data?.id) return;
        const deletedId = msg.data.id;
        setBanners(prev => prev.filter(b => b.id !== deletedId));
        break;
      }

      // --- ORDER EVENTS ---
      case 'ORDER_CREATED': {
        if (!msg.data) return;
        const newOrder = mapOrderFromBackend(msg.data);
        setOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) {
            return prev.map(o => o.id === newOrder.id ? newOrder : o);
          }
          return [newOrder, ...prev];
        });
        // El aviso (sonido + ventana + campanita) llega como NOTIFICATION_NEW
        break;
      }
      case 'ORDER_UPDATED': {
        if (!msg.data?.id) return;
        const { id, status } = msg.data;
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        break;
      }

      // --- USER & AUTH REAL-TIME EVENTS ---
      case 'USER_REGISTERED': {
        const regRaw = msg.data?.user || msg.data;
        if (!regRaw?.id) return;
        const regUser = mergeUserFromBackend(undefined, regRaw);
        setUsers(prev => {
          const existing = prev.find(u => u.id === regRaw.id);
          if (existing) return prev.map(u => u.id === regRaw.id ? mergeUserFromBackend(u, regRaw) : u);
          return [regUser, ...prev];
        });
        // El aviso al superadmin llega como NOTIFICATION_NEW (APPROVAL_PENDING)
        break;
      }
      case 'USER_UPDATED': {
        const upUser = msg.data?.user || msg.data;
        if (!upUser?.id) return;
        setUsers(prev => prev.map(u => u.id === upUser.id ? mergeUserFromBackend(u, upUser) : u));

        const curUser = currentUserRef.current;
        if (curUser?.id === upUser.id) {
          if (curUser.status === 'pending_approval' && upUser.status === 'active') {
            setPendingApprovalModalOpen(false);
            setPlanPurchaseModalOpen(false);
            try { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }); } catch {}
            // El aviso "¡Tu tienda fue aprobada!" llega como NOTIFICATION_NEW
          }
        }
        break;
      }
      case 'USER_DELETED': {
        if (!msg.data?.id) return;
        const delUserId = msg.data.id;
        setUsers(prev => prev.filter(u => u.id !== delUserId));
        if (currentUserRef.current?.id === delUserId) {
          logout();
          addLiveNotification({
            title: 'Sesión Cerrada',
            message: 'Tu usuario ha sido eliminado por el administrador.',
            type: 'user'
          });
        }
        break;
      }
      case 'PIN_RESET_REQUESTED': {
        if (msg.data?.user) {
          const uData = msg.data.user;
          setUsers(prev => prev.map(u => u.id === uData.id ? mergeUserFromBackend(u, uData) : u));
        }
        // El aviso al superadmin llega como NOTIFICATION_NEW (PIN_RESET_REQUESTED)
        break;
      }
      case 'PIN_RESET_COMPLETED': {
        if (msg.data?.user) {
          const uData = msg.data.user;
          setUsers(prev => prev.map(u => u.id === uData.id ? mergeUserFromBackend(u, uData) : u));
          if (currentUserRef.current?.id === uData.id) {
            setMustChangePinModalOpen(true);
          }
        }
        break;
      }

      // --- STORE REAL-TIME EVENTS ---
      case 'STORE_CREATED': {
        const rawStore = msg.data?.store || (msg.data?.id ? msg.data : null);
        if (!rawStore) return;
        const newStore = mapStoreFromBackend(rawStore);
        if (!canSeeStore(newStore)) {
          setStores(prev => prev.filter(s => s.id !== newStore.id));
          break;
        }
        setStores(prev => {
          if (prev.some(s => s.id === newStore.id)) {
            return prev.map(s => s.id === newStore.id ? newStore : s);
          }
          return [...prev, newStore];
        });
        if (currentUserRef.current) refreshMyStores();
        break;
      }
      case 'STORE_UPDATED': {
        const rawStore = msg.data?.store || (msg.data?.id ? msg.data : null);
        if (!rawStore) return;
        const upStore = mapStoreFromBackend(rawStore);
        if (!canSeeStore(upStore)) {
          // Tienda desactivada: retirarla del catálogo público de este visitante
          setStores(prev => prev.filter(s => s.id !== upStore.id));
        } else {
          setStores(prev => prev.some(s => s.id === upStore.id)
            ? prev.map(s => s.id === upStore.id ? upStore : s)
            : [...prev, upStore]);
        }
        setMyStores(prev => prev.map(s => s.id === upStore.id ? upStore : s));
        break;
      }
      case 'STORE_DELETED': {
        if (!msg.data?.id) return;
        const delStoreId = msg.data.id;
        setStores(prev => prev.filter(s => s.id !== delStoreId));
        setMyStores(prev => prev.filter(s => s.id !== delStoreId));
        break;
      }

      // --- PAYMENT & SUBSCRIPTION REAL-TIME EVENTS ---
      case 'PAYMENT_CONFIG_UPDATED': {
        const cfg = msg.data?.config || msg.data;
        if (cfg && cfg.phone) {
          setYapeConfig(prev => ({ ...prev, ...cfg }));
        }
        break;
      }
      case 'PAYMENT_VERIFIED': {
        if (!msg.data?.user_id) return;
        const { user_id, store_id, subscription_period_end } = msg.data;
        const plan = msg.data.plan_id || msg.data.plan;
        setUsers(prev => prev.map(u => {
          if (u.id === user_id) {
            return {
              ...u,
              status: 'active',
              subscription: {
                ...u.subscription,
                status: 'active',
                planId: plan || u.subscription.planId,
                currentPeriodEnd: subscription_period_end || u.subscription.currentPeriodEnd
              }
            };
          }
          return u;
        }));
        if (store_id) {
          setStores(prev => prev.map(s => (s.id === store_id || s.ownerId === user_id) ? { ...s, isActive: true } : s));
          setMyStores(prev => prev.map(s => (s.id === store_id || s.ownerId === user_id) ? { ...s, isActive: true } : s));
        }
        if (currentUserRef.current?.id === user_id) {
          setPendingApprovalModalOpen(false);
          setPlanPurchaseModalOpen(false);
          try { confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } }); } catch {}
          // El aviso "Plan activo" llega como NOTIFICATION_NEW (PLAN_ACTIVATED)
        }
        break;
      }

      // --- NOTIFICACIONES (campanita) ---
      case 'NOTIFICATION_NEW': {
        if (!msg.data?.id) return;
        const n = mapNotificationFromBackend(msg.data);
        let isNew = true;
        setNotifications(prev => {
          if (prev.some(x => x.id === n.id)) { isNew = false; return prev; }
          return [n, ...prev].slice(0, 50);
        });
        if (!isNew) break;
        setUnreadNotifications(c => c + 1);

        // Sonido según el tipo
        if (n.type === 'ORDER_NEW') audioNotification.playOrderChime();
        else if (n.type === 'PLAN_ACTIVATED' || n.type === 'ACCOUNT_APPROVED' || n.type === 'PAYMENT_RECEIVED') audioNotification.playPaymentSuccess();
        else audioNotification.playNotificationAlert();

        // Ventana emergente dentro de la app
        const toastType: LiveNotification['type'] =
          n.type === 'ORDER_NEW' ? 'order'
          : n.type === 'PIN_RESET_REQUESTED' ? 'pin'
          : n.type === 'APPROVAL_PENDING' ? 'user'
          : (n.type === 'PLAN_EXPIRING' || n.type === 'PLAN_EXPIRED' || n.type === 'MERCHANT_PLAN_EXPIRED' || n.type === 'PAYMENT_MANUAL_REVIEW' || n.type === 'ACCOUNT_SUSPENDED') ? 'warning'
          : 'payment';
        addLiveNotification({ title: n.title, message: n.message, type: toastType, actionLabel: 'Ver', onAction: () => openNotification(n) });

        // Notificación del sistema si la pestaña está en segundo plano (y el usuario dio permiso)
        try {
          if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            const sys = new Notification(n.title, { body: n.message, icon: '/brand/icon-192.png', tag: n.id });
            sys.onclick = () => { window.focus(); openNotification(n); sys.close(); };
          }
        } catch { /* algunos navegadores móviles no permiten crear notificaciones así */ }
        break;
      }

      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLiveNotification, logout]);

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
  }, []);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'cart', JSON.stringify(cart));
    } catch { /* almacenamiento lleno o no disponible */ }
  }, [cart]);

  useEffect(() => {
    try {
      if (currentUserId) {
        // Comerciante / admin: sus pedidos (con datos de clientes) viven solo en el servidor
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'orders');
      } else {
        // Visitante: solo guarda sus propios últimos pedidos
        localStorage.setItem(STORAGE_KEY_PREFIX + 'orders', JSON.stringify(orders.slice(0, 20)));
      }
    } catch { /* almacenamiento no disponible */ }
  }, [orders, currentUserId]);

  // Refrescar el carrito guardado con los datos actuales de los productos (precio, stock, fotos)
  useEffect(() => {
    if (products.length === 0) return;
    setCart(prev => {
      let changed = false;
      const next = prev.map(item => {
        const fresh = products.find(p => p.id === item.product.id);
        if (!fresh || fresh === item.product) return item;
        changed = true;
        return { ...item, product: fresh, unitPrice: getProductEffectivePrice(fresh, item.selectedVariants) };
      });
      return changed ? next : prev;
    });
  }, [products]);

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

  // Cart operations
  // Un pedido por WhatsApp va a UN solo negocio: el carrito solo admite productos de una tienda.
  const [pendingCartItem, setPendingCartItem] = useState<{
    product: Product; quantity: number; selectedVariants: Record<string, string>; notes?: string; unitPrice?: number;
  } | null>(null);

  const addToCart = (
    product: Product,
    quantity: number,
    selectedVariants: Record<string, string> = {},
    notes?: string,
    unitPrice?: number
  ) => {
    const cartStoreIdNow = cart[0]?.product.storeId;
    if (cartStoreIdNow && cartStoreIdNow !== product.storeId) {
      // Producto de otra tienda: preguntar antes de mezclar (no se agrega todavía)
      setPendingCartItem({ product, quantity, selectedVariants, notes, unitPrice });
      return;
    }
    addItemToCart(product, quantity, selectedVariants, notes, unitPrice);
  };

  const addItemToCart = (
    product: Product,
    quantity: number,
    selectedVariants: Record<string, string> = {},
    notes?: string,
    unitPrice?: number,
    replaceCart = false
  ) => {
    const effectivePrice = (typeof unitPrice === 'number' && unitPrice > 0)
      ? unitPrice
      : getProductEffectivePrice(product, selectedVariants);

    setCart(prevCart => {
      // Seguridad extra: nunca mezclar tiendas aunque el estado haya cambiado entre renders
      const prev = replaceCart || (prevCart[0] && prevCart[0].product.storeId !== product.storeId) ? [] : prevCart;
      const variantKey = JSON.stringify(selectedVariants);
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && JSON.stringify(item.selectedVariants) === variantKey
      );

      if (existingIdx > -1) {
        // Copia inmutable (antes se modificaba el objeto del estado anterior)
        return prev.map((item, i) => i !== existingIdx ? item : {
          ...item,
          quantity: item.quantity + quantity,
          unitPrice: effectivePrice,
          notes: notes || item.notes,
        });
      }

      return [
        ...prev,
        {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product,
          quantity,
          selectedVariants,
          unitPrice: effectivePrice,
          notes
        }
      ];
    });

    setCartDrawerOpen(true);
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const confirmCartSwitch = () => {
    if (!pendingCartItem) return;
    const { product, quantity, selectedVariants, notes, unitPrice } = pendingCartItem;
    setPendingCartItem(null);
    addItemToCart(product, quantity, selectedVariants, notes, unitPrice, true);
  };

  const cancelCartSwitch = () => setPendingCartItem(null);

  // Tienda del carrito: la del primer producto (no la tienda que se esté mirando en pantalla)
  const cartStoreId = cart[0]?.product.storeId || '';
  const cartStoreFound = useMemo(
    () => (cartStoreId ? (stores.find(s => s.id === cartStoreId) || myStores.find(s => s.id === cartStoreId)) : undefined),
    [cartStoreId, stores, myStores]
  );
  const cartStore: StoreConfig = cartStoreFound || currentStore;
  const cartStoreAvailable = !cartStoreId || Boolean(cartStoreFound);
  const pendingCartSwitch = pendingCartItem ? {
    fromStoreName: cartStore.name,
    toStoreName: stores.find(s => s.id === pendingCartItem.product.storeId)?.name || 'otra tienda',
    productName: pendingCartItem.product.name,
  } : null;

  const trackProductVisit = (productId: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return { ...p, viewsCount: (p.viewsCount || 0) + 1 };
        }
        return p;
      })
    );
    api.trackProductVisit(productId);
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

  // Pedido: primero se registra en el servidor (valida DNI, nombre, teléfono, stock y precios);
  // solo si se guardó se muestra el modal de éxito con el botón para avisar a la tienda por WhatsApp.
  const submitOrderToWhatsApp = async (customerData: CustomerCheckoutData): Promise<
    { ok: true; order: Order; whatsappUrl: string } | { ok: false; error: string }
  > => {
    // El pedido se envía a la tienda de los productos del carrito, no a la que se esté viendo
    const orderStore = cartStore;
    const cartSnapshot = [...cart];
    const getItemUnitPrice = (item: CartItem) =>
      (typeof item.unitPrice === 'number' && item.unitPrice > 0)
        ? item.unitPrice
        : getProductEffectivePrice(item.product, item.selectedVariants);

    const subtotal = cartSnapshot.reduce((acc, item) => acc + getItemUnitPrice(item) * item.quantity, 0);
    const isFreeDelivery = customerData.deliveryType === 'pickup' || subtotal >= orderStore.freeDeliveryThreshold;
    const deliveryFee = isFreeDelivery ? 0 : orderStore.deliveryFee;
    const total = subtotal + deliveryFee;

    // 6 caracteres aleatorios: evita números repetidos (el backend confirma que sea único)
    const randomSuffix = Array.from(crypto.getRandomValues(new Uint8Array(3)))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const orderNumber = `PED-${randomSuffix}`;

    const items = cartSnapshot.map(item => {
      const unitPrice = getItemUnitPrice(item);
      return {
        productId: item.product.id,
        productName: item.product.name,
        price: unitPrice,
        quantity: item.quantity,
        selectedVariants: item.selectedVariants,
        subtotal: unitPrice * item.quantity,
        imageUrl: item.product.imageUrl
      };
    });
    const address = customerData.deliveryType === 'pickup' ? customerData.address || 'Recojo en tienda' : customerData.address;
    const draftMessage = generateWhatsAppOrderMessage(orderStore, orderNumber, customerData, cartSnapshot, subtotal, deliveryFee, total);

    let persisted: Order;
    try {
      persisted = await api.createOrder({
        storeId: orderStore.id,
        orderNumber,
        customerName: customerData.name,
        customerDni: customerData.dni,
        customerPhone: customerData.phone,
        customerAddress: address,
        notes: customerData.notes,
        deliveryType: customerData.deliveryType,
        paymentMethod: customerData.paymentMethod,
        items,
        subtotal,
        deliveryFee,
        total,
        whatsappMessageSent: draftMessage
      });
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : 'No se pudo registrar tu pedido.';
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      return { ok: false, error: offline ? 'No tienes conexión a internet. Revisa tu conexión e inténtalo de nuevo.' : msg };
    }

    // El mensaje final usa el número y los montos que confirmó el servidor
    const message = (persisted.orderNumber === orderNumber && Math.abs(persisted.total - total) < 0.01)
      ? draftMessage
      : generateWhatsAppOrderMessage(orderStore, persisted.orderNumber, customerData, cartSnapshot,
          persisted.subtotal, persisted.deliveryFee, persisted.total);
    const whatsappUrl = buildWhatsAppLink(orderStore.countryCode, orderStore.phone, message);
    const finalOrder: Order = { ...persisted, whatsappMessageSent: message };

    setOrders(prev => [finalOrder, ...prev.filter(o => o.id !== finalOrder.id)]);
    setLastCompletedOrder(finalOrder);
    setCart([]);
    setCartDrawerOpen(false);
    setOrderSuccessModalOpen(true);

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // silent fallback
    }

    return { ok: true, order: finalOrder, whatsappUrl };
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      await api.updateOrderStatus(orderId, status);
    } catch (err) {
      console.warn('Could not update order status in backend:', err);
    }
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

  const updateProduct = async (updatedProduct: Product) => {
    const saved = await api.updateProduct(updatedProduct);
    setProducts(prev => prev.map(p => p.id === saved.id ? saved : p));
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

  const upgradeSubscription = (planId: PlanTier, billingCycle: 'monthly' | 'annual' = 'monthly') => {
    let newPeriodEndStr = '';
    const additionalDays = billingCycle === 'annual' ? 365 : 30;

    setUsers(prev => prev.map(u => {
      if (u.storeId === currentStore.id || u.id === currentUserId) {
        const currentEndMs = u.subscription?.currentPeriodEnd ? new Date(u.subscription.currentPeriodEnd).getTime() : 0;
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

  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateCurrentUserProfile = async (data: UserProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = await api.updateProfile(data);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      return { success: true };
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      return { success: false, error: err.message || 'Error al actualizar el perfil.' };
    }
  };

  const updateUser = async (updatedUser: UserAccount, newPin?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const saved = await api.updateUser(updatedUser.id, {
        name: updatedUser.name,
        email: updatedUser.email,
        dni: updatedUser.dni,
        phone: updatedUser.phone,
        personal_address: updatedUser.personalAddress,
        role: updatedUser.role,
        store_id: updatedUser.storeId,
        status: updatedUser.status,
        subscription_plan: updatedUser.subscription.planId,
        subscription_status: updatedUser.subscription.status,
        subscription_period_end: updatedUser.subscription.currentPeriodEnd,
        new_pin: newPin
      });
      setUsers(prev => prev.map(u => u.id === saved.id ? saved : u));
      if (saved.storeId) {
        setStores(prev => prev.map(s => s.id === saved.storeId ? { ...s, isActive: saved.status === 'active' } : s));
      }
      return { success: true };
    } catch (err: any) {
      console.error('Error al actualizar usuario en backend:', err);
      // Fallback local update
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      return { success: false, error: err.message || 'Error al actualizar usuario' };
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const res = await api.deleteUser(userId);
    if (res.success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      await refreshStores();
      await refreshMyStores();
      if (currentUserId === userId) {
        setCurrentUserId('');
      }
      return { success: true };
    }
    return { success: false, error: res.error || 'No se pudo eliminar el usuario.' };
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

  const updateUserSubscription = async (userId: string, updates: Partial<Subscription>) => {
    // 1. Inmediato en estado local de React
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          subscription: {
            ...u.subscription,
            ...updates
          }
        };
      }
      return u;
    }));

    // 2. Persistencia en Base de Datos vía API
    try {
      const payload: UserAdminUpdateData = {};
      if (updates.planId) payload.subscription_plan = updates.planId;
      if (updates.currentPeriodEnd) payload.subscription_period_end = updates.currentPeriodEnd;
      if (updates.status) payload.subscription_status = updates.status;
      if (updates.status === 'active' || updates.status === 'pending_approval' || (updates.status as string) === 'suspended') {
        payload.status = updates.status as any;
      }
      if (Object.keys(payload).length > 0) {
        await api.updateUser(userId, payload);
      }
    } catch (err) {
      console.error('Error al persistir suscripción y vigencia:', err);
    }
  };

  const switchUserRole = async (userId: string, role: 'merchant' | 'superadmin') => {
    await api.updateUserRole(userId, role).catch(() => {});
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role,
          storeId: role === 'superadmin' && (!u.storeId || u.storeId === '') ? 'all' : u.storeId
        };
      }
      return u;
    }));
  };

  // Auth Operations
  const approveUserAccount = async (userId: string) => {
    await api.updateUserStatus(userId, 'active').catch(() => {});
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'active',
          subscription: {
            ...u.subscription,
            status: 'active'
          }
        };
      }
      return u;
    }));
    const user = users.find(u => u.id === userId);
    if (user?.storeId) {
      setStores(prev => prev.map(s => s.id === user.storeId ? { ...s, isActive: true } : s));
    }
  };

  const suspendUserAccount = async (userId: string) => {
    await api.updateUserStatus(userId, 'suspended').catch(() => {});
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'suspended',
          subscription: {
            ...u.subscription,
            status: 'past_due'
          }
        };
      }
      return u;
    }));
    const user = users.find(u => u.id === userId);
    if (user?.storeId) {
      setStores(prev => prev.map(s => s.id === user.storeId ? { ...s, isActive: false } : s));
    }
  };

  const refreshUsers = useCallback(async () => {
    const [allUsers, allStores] = await Promise.all([
      api.getUsers().catch(() => []),
      api.getStores(true).catch(() => [])
    ]);
    if (allUsers && allUsers.length > 0) {
      setUsers(allUsers);
    }
    if (allStores && allStores.length > 0) {
      setStores(allStores);
    }
  }, []);

  const login = async (identifier: string, password?: string): Promise<LoginResult> => {
    try {
      const res = await api.login(identifier, password);
      const u = res.user;
      const userObj: UserAccount = {
        id: u.id,
        name: u.name,
        email: u.email,
        dni: u.dni,
        role: u.role,
        storeId: u.store_id || '',
        phone: u.phone,
        personalAddress: u.personal_address,
        status: (u.status as any) || 'active',
        subscription: {
          planId: (u.subscription_plan as PlanTier) || 'pro',
          status: u.status === 'pending_approval' ? 'pending_approval' : 'active',
          billingCycle: 'monthly',
          startDate: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          renewsAutomatically: true
        },
        failedLoginAttempts: u.failed_login_attempts || 0,
        pinResetRequested: !!u.pin_reset_requested,
        pinResetRequestedAt: u.pin_reset_requested_at,
        mustChangePin: !!u.must_change_pin,
        createdAt: new Date().toISOString()
      };

      setUsers(prev => {
        const exists = prev.some(existing => existing.id === userObj.id);
        return exists ? prev.map(existing => existing.id === userObj.id ? userObj : existing) : [...prev, userObj];
      });
      setCurrentUserId(userObj.id);

      // Si tiene bandera de cambio obligatorio de PIN (ej. reseteado por el admin a 000000)
      if (u.must_change_pin) {
        setMustChangePinModalOpen(true);
      }

      // Si el comerciante está pendiente de adquisición de plan o aprobación
      if (userObj.role === 'merchant' && (userObj.status === 'pending_approval' || userObj.subscription.status === 'pending_approval')) {
        openPlanPurchaseModal(userObj.subscription.planId || 'starter');
        setActiveView('merchant');
        return { success: true, pendingApproval: true, mustChangePin: !!u.must_change_pin };
      }

      if (userObj.role === 'merchant') {
        const [ms, mp] = await Promise.all([
          api.getMyStores().catch(() => []),
          api.getMyProducts().catch(() => [])
        ]);
        if (ms && ms.length > 0) {
          setMyStores(ms);
          setStores(prev => {
            const map = new Map(prev.map(s => [s.id, s]));
            ms.forEach(s => map.set(s.id, s));
            return Array.from(map.values());
          });
          setCurrentStoreId(userObj.storeId || ms[0].id);
        } else if (userObj.storeId && userObj.storeId !== 'all') {
          setCurrentStoreId(userObj.storeId);
        }
        if (mp && mp.length > 0) {
          setProducts(prev => {
            const map = new Map(prev.map(p => [p.id, p]));
            mp.forEach(p => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
        setActiveView('merchant');
      } else if (userObj.role === 'superadmin') {
        const [allUsers, allStores] = await Promise.all([
          api.getUsers().catch(() => []),
          api.getStores(true).catch(() => [])
        ]);
        if (allUsers && allUsers.length > 0) {
          setUsers(allUsers);
        }
        if (allStores && allStores.length > 0) {
          setStores(allStores);
        }
        setActiveView('superadmin');
      }
      return { success: true, mustChangePin: !!u.must_change_pin };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al iniciar sesión',
        remainingAttempts: err.remainingAttempts,
        locked: err.locked,
        identifier: err.identifier
      };
    }
  };

  const adminResetPinDefault = async (userId: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const res = await api.adminResetPinDefault(userId);
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        failedLoginAttempts: 0,
        pinResetRequested: false,
        mustChangePin: true
      } : u));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al resetear PIN a 000000' };
    }
  };

  const changePin = async (newPin: string, confirmPin: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const res = await api.changePin(newPin, confirmPin);
      if (currentUser) {
        setUsers(prev => prev.map(u => u.id === currentUser.id ? {
          ...u,
          mustChangePin: false,
          failedLoginAttempts: 0,
          pinResetRequested: false
        } : u));
      }
      setMustChangePinModalOpen(false);
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {
        // silent
      }
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al actualizar el PIN' };
    }
  };

  const requestForgotPin = async (identifier: string): Promise<{ success: boolean; error?: string; whatsappUrl?: string; message?: string }> => {
    try {
      const res = await api.requestForgotPin(identifier);
      return {
        success: true,
        message: res.message,
        whatsappUrl: res.whatsappUrl
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al enviar solicitud de PIN' };
    }
  };

  const registerMerchantStore = async (data: {
    dni: string;
    merchantName: string;
    phone: string;
    email: string;
    personalAddress: string;
    storeName: string;
    ruc?: string;
    category: string;
    storeType: 'fisica' | 'virtual';
    storeAddress?: string;
    storePhone: string;
    storeEmail?: string;
    about?: string;
    pin: string;
    plan: PlanTier;
    password?: string;
  }): Promise<{ success: boolean; storeId: string; userId: string; error?: string; pendingApproval?: boolean }> => {
    try {
      const res = await api.register({
        dni: data.dni,
        name: data.merchantName,
        email: data.email,
        phone: data.phone,
        personalAddress: data.personalAddress,
        storeName: data.storeName,
        ruc: data.ruc,
        category: data.category,
        storeType: data.storeType,
        storeAddress: data.storeAddress,
        storePhone: data.storePhone,
        storeEmail: data.storeEmail,
        about: data.about,
        pin: data.pin,
        password: data.pin || data.password || '123456',
        plan: data.plan
      });

      // Reload fresh stores and products from backend
      const [fetchedStores, fetchedProducts] = await Promise.all([
        api.getStores(),
        api.getProducts()
      ]);
      setStores(fetchedStores);
      setProducts(fetchedProducts);

      const u = res.user;
      const userObj: UserAccount = {
        id: u.id,
        name: u.name,
        email: u.email,
        dni: u.dni,
        role: u.role,
        storeId: u.store_id || '',
        phone: u.phone,
        personalAddress: u.personal_address,
        status: 'pending_approval',
        subscription: {
          planId: (u.subscription_plan as PlanTier) || data.plan,
          status: 'pending_approval',
          billingCycle: 'monthly',
          startDate: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          renewsAutomatically: true
        },
        createdAt: new Date().toISOString()
      };

      setUsers(prev => [...prev.filter(x => x.id !== userObj.id), userObj]);
      if (userObj.storeId) {
        setCurrentStoreId(userObj.storeId);
      }
      setCurrentUserId(userObj.id);

      if (userObj.role === 'merchant') {
        const ms = await api.getMyStores().catch(() => []);
        if (ms && ms.length > 0) {
          setMyStores(ms);
          setStores(prev => {
            const map = new Map(prev.map(s => [s.id, s]));
            ms.forEach(s => map.set(s.id, s));
            return Array.from(map.values());
          });
        }
      }

      // Todo negocio nuevo queda en pending_approval y abre modal de selección de plan y pago Yape
      openPlanPurchaseModal(data.plan);

      return { success: true, storeId: userObj.storeId, userId: userObj.id, pendingApproval: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar comerciante', storeId: '', userId: '' };
    }
  };


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

  const handleUpdateYapeConfig = async (config: Partial<YapePaymentConfig>): Promise<boolean> => {
    try {
      const updated = await api.updateYapeConfig(config);
      setYapeConfig(updated);
      return true;
    } catch (err: any) {
      console.error('Error al actualizar configuración de Yape:', err);
      throw err;
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
        updateYapeConfig: handleUpdateYapeConfig,
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
