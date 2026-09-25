import { createContext, useContext } from 'react';
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
  AppNotification
} from '../types';

export interface CustomerCheckoutData {
  name: string;
  dni: string;
  phone: string;
  deliveryType: 'delivery' | 'pickup';
  address: string;
  paymentMethod: string;
  notes?: string;
}

export interface AppContextType {
  stores: StoreConfig[];
  currentStoreId: string;
  currentStore: StoreConfig;
  products: Product[];
  currentStoreProducts: Product[];
  orders: Order[];
  currentStoreOrders: Order[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  effectiveUser: UserAccount;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isMerchant: boolean;
  activeView: ActiveView;
  merchantTab: 'overview' | 'profile' | 'products' | 'orders' | 'reports' | 'settings' | 'subscription';
  adminTab: 'users' | 'plans' | 'banners' | 'promos' | 'yape_config';
  setAdminTab: (tab: 'users' | 'plans' | 'banners' | 'promos' | 'yape_config') => void;
  yapeConfig: YapePaymentConfig;
  updateYapeConfig: (config: Partial<YapePaymentConfig>) => Promise<boolean>;
  refreshYapeConfig: () => Promise<void>;
  cart: CartItem[];
  cartDrawerOpen: boolean;
  selectedProductForModal: Product | null;
  lastCompletedOrder: Order | null;
  orderSuccessModalOpen: boolean;
  isLoadingData: boolean;
  // Notificaciones (campanita)
  notifications: AppNotification[];
  unreadNotifications: number;
  openNotification: (n: AppNotification) => void;
  markAllNotificationsRead: () => void;
  /** Ir al inicio reemplazando la URL actual (sin dejarla en el historial) */
  redirectToHome: () => void;

  // File Upload to MinIO
  uploadImage: (file: File, folder?: 'logos' | 'products' | 'banners') => Promise<{ url: string; filename: string }>;

  // Auth & Modal State
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  setAuthModalOpen: (open: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;
  pendingApprovalModalOpen: boolean;
  setPendingApprovalModalOpen: (open: boolean) => void;
  pendingApprovalMerchantData: {
    storeName: string;
    merchantName: string;
    email: string;
    phone: string;
    plan: string;
  } | null;
  setPendingApprovalMerchantData: (data: any) => void;
  openPendingApprovalModal: (data?: any) => void;

  // Plan Purchase Modal State
  planPurchaseModalOpen: boolean;
  planPurchaseInitialPlan?: PlanTier;
  openPlanPurchaseModal: (planId?: PlanTier) => void;
  closePlanPurchaseModal: () => void;

  // Multi-Store Management
  myStores: StoreConfig[];
  refreshMyStores: () => Promise<void>;
  createAdditionalStore: (data: Partial<StoreConfig>) => Promise<{ success: boolean; error?: string; store?: StoreConfig }>;

  // User Profile Modal & Data Actions
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  updateCurrentUserProfile: (data: UserProfileUpdateData) => Promise<{ success: boolean; error?: string }>;

  approveUserAccount: (userId: string) => Promise<void>;
  suspendUserAccount: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  login: (identifier: string, password?: string) => Promise<LoginResult>;
  mustChangePinModalOpen: boolean;
  setMustChangePinModalOpen: (open: boolean) => void;
  adminResetPinDefault: (userId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  changePin: (newPin: string, confirmPin: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  requestForgotPin: (identifier: string) => Promise<{ success: boolean; error?: string; whatsappUrl?: string; message?: string }>;
  logout: () => void;
  registerMerchantStore: (data: {
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
  }) => Promise<{ success: boolean; storeId: string; userId: string; error?: string; pendingApproval?: boolean }>;
  
  // Navigation & View Actions
  setActiveView: (view: ActiveView) => void;
  setMerchantTab: (tab: 'overview' | 'profile' | 'products' | 'orders' | 'reports' | 'settings' | 'subscription') => void;
  setCurrentStoreId: (storeId: string) => void;
  viewingStoreCatalog: boolean;
  setViewingStoreCatalog: (viewing: boolean) => void;
  openStoreCatalog: (storeId: string) => void;
  returnToStoresDirectory: () => void;
  trackProductVisit: (productId: string) => void;
  navigateToStoreProduct: (storeId: string, product: Product) => void;
  marketplaceCategoryFilter: string;
  setMarketplaceCategoryFilter: (category: string) => void;
  navigateToMarketplaceWithCategory: (category: string) => void;
  navigateToMarketplaceWithStore: (storeId: string) => void;
  marketplaceStoreFilter: string[];
  setMarketplaceStoreFilter: (storeIds: string[]) => void;
  
  // Cart Actions
  addToCart: (product: Product, quantity: number, selectedVariants?: Record<string, string>, notes?: string, unitPrice?: number) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  /** Tienda a la que pertenece el carrito (un pedido de WhatsApp = una sola tienda) */
  cartStore: StoreConfig;
  /** false si la tienda del carrito ya no está publicada */
  cartStoreAvailable: boolean;
  /** Pregunta pendiente al agregar un producto de OTRA tienda */
  pendingCartSwitch: { fromStoreName: string; toStoreName: string; productName: string } | null;
  confirmCartSwitch: () => void;
  cancelCartSwitch: () => void;
  setCartDrawerOpen: (open: boolean) => void;
  setSelectedProductForModal: (product: Product | null) => void;
  setOrderSuccessModalOpen: (open: boolean) => void;
  
  // Order checkout via WhatsApp & Backend persistence
  /** Registra el pedido en el servidor. Devuelve el error a mostrar si no se pudo. */
  submitOrderToWhatsApp: (customerData: CustomerCheckoutData) => Promise<{ ok: true; order: Order; whatsappUrl: string } | { ok: false; error: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  
  // Merchant CRUD Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'storeId'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleProductStock: (productId: string) => Promise<void>;
  updateStoreConfig: (config: StoreConfig) => Promise<void>;
  upgradeSubscription: (planId: PlanTier, billingCycle?: 'monthly' | 'annual') => void;
  
  // Superadmin Store & User Management Actions
  createNewStore: (storeData: Partial<StoreConfig>, merchantName: string, merchantEmail: string, plan: PlanTier) => void;
  addUser: (userData: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  updateUser: (user: UserAccount, newPin?: string) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserSubscription: (userId: string, updates: Partial<Subscription>) => void;
  switchUserRole: (userId: string, role: 'merchant' | 'superadmin') => void;
  currentUserId: string;
  setCurrentUserId: (id: string) => void;

  // SuperAdmin Promotional Banners
  banners: PromotionalBanner[];
  addBanner: (banner: Omit<PromotionalBanner, 'id' | 'createdAt'>) => Promise<void>;
  updateBanner: (banner: PromotionalBanner) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
  toggleBannerActive: (bannerId: string) => Promise<void>;
  handleSubscriptionActivated: (result: YapeVerifyResult) => void;
  // Real-time WebSocket connection state
  isRealtimeConnected: boolean;
  liveNotifications: LiveNotification[];
  addLiveNotification: (notification: Omit<LiveNotification, 'id' | 'timestamp'>) => void;
  dismissLiveNotification: (id: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
