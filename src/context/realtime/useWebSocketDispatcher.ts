import { useCallback, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { fireConfetti as confetti } from '../../utils/confetti';
import {
  StoreConfig,
  Product,
  Order,
  UserAccount,
  PromotionalBanner,
  YapePaymentConfig,
  AppNotification,
  LiveNotification
} from '../../types';
import {
  mapProductFromBackend,
  mapBannerFromBackend,
  mapStoreFromBackend,
  mapOrderFromBackend,
  mergeUserFromBackend,
  mapNotificationFromBackend
} from '../../services/api';
import { WebSocketMessage } from '../../hooks/useRealtimeWebSocket';
import { audioNotification } from '../../utils/audioNotification';

interface UseWebSocketDispatcherParams {
  currentUserRef: RefObject<UserAccount | null>;
  canSeeStore: (store: StoreConfig) => boolean;
  refreshMyStores: () => Promise<void>;
  logout: () => void;
  addLiveNotification: (notification: Omit<LiveNotification, 'id' | 'timestamp'>) => void;
  openNotification: (n: AppNotification) => void;
  setProducts: Dispatch<SetStateAction<Product[]>>;
  setBanners: Dispatch<SetStateAction<PromotionalBanner[]>>;
  setOrders: Dispatch<SetStateAction<Order[]>>;
  setUsers: Dispatch<SetStateAction<UserAccount[]>>;
  setStores: Dispatch<SetStateAction<StoreConfig[]>>;
  setMyStores: Dispatch<SetStateAction<StoreConfig[]>>;
  setYapeConfig: Dispatch<SetStateAction<YapePaymentConfig>>;
  setNotifications: Dispatch<SetStateAction<AppNotification[]>>;
  setUnreadNotifications: Dispatch<SetStateAction<number>>;
  setPendingApprovalModalOpen: (open: boolean) => void;
  setPlanPurchaseModalOpen: (open: boolean) => void;
  setMustChangePinModalOpen: (open: boolean) => void;
}

/**
 * Traduce cada evento del WebSocket en tiempo real a una actualización de estado.
 * Extraído de AppContext.tsx: es un despachador puro (un switch grande) que no necesita
 * conocer nada del resto del contexto salvo los setters/acciones que recibe por parámetro.
 */
export function useWebSocketDispatcher({
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
}: UseWebSocketDispatcherParams) {
  return useCallback((msg: WebSocketMessage) => {
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
  }, [
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
  ]);
}
