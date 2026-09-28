import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { fireConfetti as confetti } from '../../utils/confetti';
import {
  StoreConfig,
  Product,
  UserAccount,
  PlanTier,
  Subscription,
  ActiveView,
  UserProfileUpdateData,
  YapeVerifyResult,
  LoginResult,
  UserAdminUpdateData
} from '../../types';
import { api } from '../../services/api';
import { STORAGE_KEY_PREFIX } from '../storageKeys';

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

interface UseAuthStateParams {
  setStores: Dispatch<SetStateAction<StoreConfig[]>>;
  setProducts: Dispatch<SetStateAction<Product[]>>;
  setCurrentStoreId: Dispatch<SetStateAction<string>>;
  setActiveView: (view: ActiveView) => void;
  /** Vuelve a pedir el catálogo completo de tiendas (lo usa deleteUser tras borrar un usuario) */
  refreshStores: () => Promise<void>;
}

/**
 * Slice de identidad y cuenta: quién está logueado (RBAC), el CRUD de usuarios/comerciantes,
 * login/registro, PIN y los modales de autenticación (login/registro, aprobación pendiente,
 * compra de plan, perfil). Extraído de AppContext.tsx.
 *
 * No conoce `currentStore` (se calcula en AppContext combinando este slice con el de catálogo),
 * así que las pocas funciones que antes leían `currentStore` (p. ej. `upgradeSubscription`,
 * `handleSubscriptionActivated`) se quedaron en AppContext.tsx para evitar una dependencia circular.
 */
export function useAuthState({ setStores, setProducts, setCurrentStoreId, setActiveView, refreshStores }: UseAuthStateParams) {
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'currentUserId') || '';
  });
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [myStores, setMyStores] = useState<StoreConfig[]>([]);

  const currentUser = useMemo(() => {
    return currentUserId ? (users.find(u => u.id === currentUserId) || null) : null;
  }, [currentUserId, users]);
  const isAuthenticated = currentUser !== null;
  const isSuperAdmin = currentUser !== null && currentUser.role === 'superadmin';
  const isMerchant = currentUser !== null && currentUser.role === 'merchant';
  const effectiveUser = currentUser || DEFAULT_FALLBACK_USER;

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

  const refreshMyStores = async () => {
    try {
      const ms = await api.getMyStores();
      setMyStores(ms);
    } catch (err) {
      console.error('Error al refrescar tiendas propias:', err);
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

  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
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
  }, [setStores]);

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
          planId: (u.subscription_plan as PlanTier) || 'starter',
          status: (u.subscription_status as any) || (u.status === 'pending_approval' ? 'pending_approval' : 'active'),
          billingCycle: 'monthly',
          startDate: u.created_at || new Date().toISOString(),
          currentPeriodEnd: u.subscription_period_end || '',
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
          currentPeriodEnd: '',
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

  return {
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
    openPendingApprovalModal,
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
  };
}
