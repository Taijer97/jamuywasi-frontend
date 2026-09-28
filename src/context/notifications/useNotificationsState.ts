import { useCallback, useEffect, useState } from 'react';
import { AppNotification, LiveNotification, ActiveView } from '../../types';
import { notificationsApi } from '../../services/api';

type MerchantTab = 'overview' | 'profile' | 'products' | 'orders' | 'reports' | 'settings' | 'subscription';
type AdminTab = 'users' | 'plans' | 'banners' | 'promos' | 'yape_config';

interface UseNotificationsStateParams {
  currentUserId: string;
  setActiveView: (view: ActiveView) => void;
  setCurrentStoreId: (storeId: string) => void;
  setMerchantTab: (tab: MerchantTab) => void;
  setAdminTab: (tab: AdminTab) => void;
}

/**
 * Slice de notificaciones: la campanita (persistidas en backend, con contador de no leídas)
 * y los toasts efímeros en pantalla (liveNotifications). Extraído de AppContext.tsx para
 * que ambos mundos (persistente / efímero) vivan en un solo archivo cohesivo.
 */
export function useNotificationsState({
  currentUserId,
  setActiveView,
  setCurrentStoreId,
  setMerchantTab,
  setAdminTab
}: UseNotificationsStateParams) {
  // ===================== Notificaciones persistentes (campanita) =====================
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
      if (link.tab) setMerchantTab(link.tab as MerchantTab);
    } else if (link.view === 'superadmin') {
      setActiveView('superadmin');
      if (link.adminTab) setAdminTab(link.adminTab as AdminTab);
    }
    if (link.targetId) setPendingHighlight(link.targetId);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActiveView, setAdminTab, setCurrentStoreId, setMerchantTab]);

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

  // ===================== Toasts efímeros (liveNotifications) =====================
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

  return {
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
  };
}
