export type PlanTier = 'starter' | 'pro' | 'business';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  maxStores: number;
  features: string[];
  recommended?: boolean;
}

export interface Subscription {
  planId: PlanTier;
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'pending_approval';
  billingCycle: 'monthly' | 'annual';
  startDate: string;
  currentPeriodEnd: string;
  renewsAutomatically: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
    expiry: string;
  };
  pendingPlanId?: PlanTier;
  pendingBillingCycle?: 'monthly' | 'annual';
  pendingAmount?: number;
  promoCodeApplied?: string;
  discountApplied?: number;
  proofSubmittedAt?: string;
  proofReference?: string;
  proofReceiptUrl?: string;
  proofNote?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface StoreConfig {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string;
  banner: string;
  countryCode: string;
  phone: string; // WhatsApp number
  currency: string;
  currencySymbol: string;
  address: string;
  schedule: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  allowDelivery?: boolean;
  allowPickup: boolean;
  pickupAddress?: string;
  preferredPaymentMethod?: string;
  paymentInstructions: string;
  whatsappMessageTemplate: string;
  themeColor: string;
  ruc?: string;
  storeType?: 'fisica' | 'virtual';
  storeEmail?: string;
  category?: string;
  isActive?: boolean;
  ownerId?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
}

export interface VariantOption {
  name: string; // e.g. "Negro", "L"
  imageUrl?: string; // opcional: imagen de la variante
  price?: number; // opcional: si esta variante modifica el precio principal
}

export interface ProductVariant {
  name: string; // Título e.g. "Tallas", "Colores", "Opciones"
  options: (string | VariantOption)[]; // Permite strings u objetos con imagen y precio
}

export type ActiveView = 'home' | 'marketplace' | 'catalog' | 'merchant' | 'superadmin';

export interface ProductCombination {
  id: string;
  options: Record<string, string>; // ej: { "Capacidad": "256GB / 8GB RAM", "Color": "Negro" }
  price?: number;                  // Precio específico para esta combinación
  imageUrl?: string;               // Foto específica de esta combinación
  sku?: string;                    // SKU opcional de esta combinación
  inStock: boolean;                // true = disponible / existe, false = no disponible / agotado
  stockCount?: number;             // Stock específico (opcional)
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  imageUrl: string;
  additionalImages?: string[];
  sku?: string;
  inStock: boolean;
  stockCount?: number;
  isFeatured?: boolean;
  viewsCount?: number;
  variants: ProductVariant[];
  combinations?: ProductCombination[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariants: Record<string, string>;
  unitPrice?: number; // Precio unitario efectivo si la variante modifica el precio base
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  selectedVariants: Record<string, string>;
  subtotal: number;
  imageUrl?: string;
}

export type OrderStatus = 'pending_whatsapp' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  customerName: string;
  /** DNI (8 dígitos) o carné de extranjería (9) */
  customerDni?: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  whatsappMessageSent: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  dni?: string;
  password?: string;
  role: 'merchant' | 'superadmin';
  storeId: string;
  phone?: string;
  personalAddress?: string;
  status?: 'active' | 'suspended' | 'pending_approval';
  subscription: Subscription;
  failedLoginAttempts?: number;
  pinResetRequested?: boolean;
  pinResetRequestedAt?: string;
  mustChangePin?: boolean;
  createdAt: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  pendingApproval?: boolean;
  mustChangePin?: boolean;
  remainingAttempts?: number;
  locked?: boolean;
  identifier?: string;
}

export interface UserProfileUpdateData {
  name?: string;
  email?: string;
  dni?: string;
  phone?: string;
  personal_address?: string;
  current_pin?: string;
  new_pin?: string;
}

export interface UserAdminUpdateData {
  name?: string;
  email?: string;
  dni?: string;
  phone?: string;
  personal_address?: string;
  role?: 'merchant' | 'superadmin';
  store_id?: string;
  status?: 'active' | 'suspended' | 'pending_approval';
  subscription_plan?: PlanTier;
  subscription_status?: string;
  subscription_period_end?: string;
  new_pin?: string;
}

export type BannerGradientTheme = 'emerald' | 'amber' | 'indigo' | 'rose' | 'purple' | 'dark';

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  productId?: string;
  storeId?: string;
  buttonText: string;
  gradientTheme: BannerGradientTheme;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  validUntil?: string | null;
  applicablePlan?: 'all' | 'starter' | 'pro' | 'business' | string;
  createdAt: string;
}

export interface PromoCodeValidationResult {
  valid: boolean;
  message: string;
  code?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount: number;
  finalAmount: number;
  applicablePlan?: string;
}

export interface YapeVerifyResult {
  success: boolean;
  message: string;
  attemptsRemaining: number;
  mustSendWhatsapp: boolean;
  userStatus?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionPeriodEnd?: string;
  storeActive?: boolean;
}

export interface YapePaymentConfig {
  phone: string;
  phoneFormatted: string;
  holder: string;
  qrUrl?: string;
  instructions?: string;
  updatedAt?: string;
}

export interface SubscriptionInvoice {
  id: string;
  invoice_number: string;
  user_id: string;
  store_id?: string | null;
  plan_id: string;
  plan_name: string;
  billing_cycle: 'monthly' | 'annual' | string;
  amount: number;
  currency: string;
  payment_method: string;
  reference?: string | null;
  status: 'paid' | 'pending' | 'refunded' | string;
  period_start: string;
  period_end: string;
  created_at: string;
  store_name?: string;
  customer_name?: string;
  customer_dni?: string;
}

export interface LiveNotification {
  id: string;
  type: 'order' | 'approval' | 'pin_reset' | 'pin' | 'user' | 'payment' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  actionLabel?: string;
  onAction?: () => void;
}



/** Notificación de la campanita (comerciantes y superadmin) */
export type AppNotificationType =
  | 'ORDER_NEW' | 'PLAN_EXPIRING' | 'PLAN_EXPIRED' | 'PLAN_ACTIVATED' | 'ACCOUNT_APPROVED' | 'ACCOUNT_SUSPENDED'
  | 'APPROVAL_PENDING' | 'PIN_RESET_REQUESTED' | 'PAYMENT_RECEIVED' | 'PAYMENT_MANUAL_REVIEW' | 'MERCHANT_PLAN_EXPIRED'
  | string;

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  /** A dónde lleva al hacer clic: { view, tab?, adminTab?, targetId? } */
  link: { view?: 'merchant' | 'superadmin' | string; tab?: string; adminTab?: string; targetId?: string };
  storeId?: string | null;
  isRead: boolean;
  createdAt: string;
}
