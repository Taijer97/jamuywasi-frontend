import { StoreConfig, Product, PromotionalBanner, Order, OrderStatus, UserAccount, UserProfileUpdateData, UserAdminUpdateData, PromoCode, PromoCodeValidationResult, YapeVerifyResult, YapePaymentConfig, SubscriptionInvoice, AppNotification } from '../types';

const API_BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('catalog_saas_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Convierte URLs inseguras de MinIO (http://100.75.189.26:9000/atalaya-store/...)
 * a URLs relativas HTTPS seguras (/api/uploads/media/...) servidas por la API.
 * Esto evita el error de navegador 'Mixed Content' cuando se navega con HTTPS / Ngrok.
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  
  // Si ya es relativa o data URL o placeholder externo (unsplash, etc.)
  if (url.startsWith('/api/uploads/media/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Si apunta directamente a MinIO por IP http://100.75.189.26:9000/atalaya-store/carpeta/archivo.ext
  const minioMatch = url.match(/\/atalaya-store\/(logos|products|banners|uploads)\/([^\/?#]+)/i);
  if (minioMatch) {
    const folder = minioMatch[1];
    const filename = minioMatch[2];
    return `/api/uploads/media/${folder}/${filename}`;
  }

  return url;
}

// Helper to convert backend snake_case store to frontend camelCase StoreConfig
/**
 * Aplica los datos de un usuario que llegan del backend (snake_case, completos o parciales)
 * sobre el usuario que ya tenemos en memoria (camelCase). Solo cambia los campos presentes.
 */
export function mergeUserFromBackend(base: UserAccount | undefined, raw: any): UserAccount {
  const has = (k: string) => raw != null && Object.prototype.hasOwnProperty.call(raw, k);
  const b: any = base || {};
  const now = new Date().toISOString();
  const sub = b.subscription || {
    planId: 'starter',
    status: 'active',
    billingCycle: 'monthly',
    startDate: raw?.created_at || now,
    currentPeriodEnd: raw?.subscription_period_end || now,
    renewsAutomatically: true,
  };
  const merged: any = { ...b, id: raw?.id ?? b.id };
  if (has('name')) merged.name = raw.name;
  if (has('email')) merged.email = raw.email;
  if (has('dni')) merged.dni = raw.dni || '';
  if (has('role')) merged.role = raw.role;
  if (has('store_id')) merged.storeId = raw.store_id || '';
  if (has('phone')) merged.phone = raw.phone || '';
  if (has('personal_address')) merged.personalAddress = raw.personal_address || '';
  if (has('status')) merged.status = raw.status || 'active';
  if (has('failed_login_attempts')) merged.failedLoginAttempts = raw.failed_login_attempts ?? 0;
  if (has('pin_reset_requested')) merged.pinResetRequested = !!raw.pin_reset_requested;
  if (has('pin_reset_requested_at')) merged.pinResetRequestedAt = raw.pin_reset_requested_at || undefined;
  if (has('must_change_pin')) merged.mustChangePin = !!raw.must_change_pin;
  if (has('created_at') && raw.created_at) merged.createdAt = raw.created_at;
  if (!merged.createdAt) merged.createdAt = now;
  merged.subscription = {
    ...sub,
    ...(has('subscription_plan') && raw.subscription_plan ? { planId: raw.subscription_plan } : {}),
    ...(has('subscription_status') && raw.subscription_status ? { status: raw.subscription_status } : {}),
    ...(has('subscription_period_end') && raw.subscription_period_end ? { currentPeriodEnd: raw.subscription_period_end } : {}),
  };
  return merged as UserAccount;
}

export function mapStoreFromBackend(raw: any): StoreConfig {
  return {
    id: raw.id,
    ownerId: raw.owner_id || raw.ownerId || '',
    name: raw.name,
    ruc: raw.ruc || '',
    storeType: raw.store_type || raw.storeType || 'virtual',
    category: raw.category || 'General',
    slug: raw.slug,
    tagline: raw.tagline || '',
    description: raw.description || '',
    logo: normalizeImageUrl(raw.logo),
    banner: normalizeImageUrl(raw.banner),
    countryCode: raw.country_code || raw.countryCode || '51',
    phone: raw.phone || '',
    storeEmail: raw.store_email || raw.storeEmail || '',
    currency: raw.currency || 'PEN',
    currencySymbol: raw.currency_symbol || raw.currencySymbol || 'S/',
    address: raw.address || '',
    schedule: raw.schedule || '',
    deliveryFee: Number(raw.delivery_fee ?? raw.deliveryFee ?? 10),
    freeDeliveryThreshold: Number(raw.free_delivery_threshold ?? raw.freeDeliveryThreshold ?? 150),
    allowDelivery: Boolean(raw.allow_delivery ?? raw.allowDelivery ?? true),
    allowPickup: Boolean(raw.allow_pickup ?? raw.allowPickup ?? true),
    pickupAddress: raw.pickup_address || raw.pickupAddress || '',
    preferredPaymentMethod: raw.preferred_payment_method || raw.preferredPaymentMethod || 'Transferencia Bancaria',
    paymentInstructions: raw.payment_instructions || raw.paymentInstructions || '',
    whatsappMessageTemplate: raw.whatsapp_message_template || raw.whatsappMessageTemplate || '',
    themeColor: raw.theme_color || raw.themeColor || 'emerald',
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
    socials: raw.socials || {}
  };
}

// Helper to convert frontend StoreConfig to backend snake_case
function mapStoreToBackend(store: Partial<StoreConfig>): any {
  const mapped: any = {};
  if (store.ownerId !== undefined) mapped.owner_id = store.ownerId;
  if ((store as any).owner_id !== undefined) mapped.owner_id = (store as any).owner_id;
  if (store.name !== undefined) mapped.name = store.name;
  if (store.ruc !== undefined) mapped.ruc = store.ruc;
  if (store.storeType !== undefined) mapped.store_type = store.storeType;
  if (store.category !== undefined) mapped.category = store.category;
  if (store.slug !== undefined) mapped.slug = store.slug;
  if (store.tagline !== undefined) mapped.tagline = store.tagline;
  if (store.description !== undefined) mapped.description = store.description;
  if (store.logo !== undefined) mapped.logo = store.logo;
  if (store.banner !== undefined) mapped.banner = store.banner;
  if (store.countryCode !== undefined) mapped.country_code = store.countryCode;
  if (store.phone !== undefined) mapped.phone = store.phone;
  if (store.storeEmail !== undefined) mapped.store_email = store.storeEmail;
  if (store.currency !== undefined) mapped.currency = store.currency;
  if (store.currencySymbol !== undefined) mapped.currency_symbol = store.currencySymbol;
  if (store.address !== undefined) mapped.address = store.address;
  if (store.schedule !== undefined) mapped.schedule = store.schedule;
  if (store.deliveryFee !== undefined) mapped.delivery_fee = store.deliveryFee;
  if (store.freeDeliveryThreshold !== undefined) mapped.free_delivery_threshold = store.freeDeliveryThreshold;
  if (store.allowDelivery !== undefined) mapped.allow_delivery = store.allowDelivery;
  if (store.allowPickup !== undefined) mapped.allow_pickup = store.allowPickup;
  if (store.pickupAddress !== undefined) mapped.pickup_address = store.pickupAddress;
  if (store.preferredPaymentMethod !== undefined) mapped.preferred_payment_method = store.preferredPaymentMethod;
  if (store.paymentInstructions !== undefined) mapped.payment_instructions = store.paymentInstructions;
  if (store.whatsappMessageTemplate !== undefined) mapped.whatsapp_message_template = store.whatsappMessageTemplate;
  if (store.themeColor !== undefined) mapped.theme_color = store.themeColor;
  if (store.isActive !== undefined) mapped.is_active = store.isActive;
  if (store.socials !== undefined) mapped.socials = store.socials;
  return mapped;
}

// Helper to convert backend snake_case product to frontend camelCase Product
export function mapProductFromBackend(raw: any): Product {
  return {
    id: raw.id,
    storeId: raw.store_id,
    name: raw.name,
    slug: raw.slug || raw.name.toLowerCase().replace(/\s+/g, '-'),
    description: raw.description || '',
    price: Number(raw.price),
    compareAtPrice: raw.compare_at_price != null ? Number(raw.compare_at_price) : undefined,
    category: raw.category || 'General',
    imageUrl: normalizeImageUrl(raw.image_url),
    additionalImages: Array.isArray(raw.additional_images)
      ? raw.additional_images.map((img: string) => normalizeImageUrl(img))
      : [],
    sku: raw.sku || undefined,
    inStock: Boolean(raw.in_stock ?? true),
    stockCount: raw.stock_count ?? 10,
    isFeatured: Boolean(raw.is_featured ?? false),
    viewsCount: raw.views_count || 0,
    variants: Array.isArray(raw.variants)
      ? raw.variants.map((v: any) => ({
          name: v.name || '',
          options: Array.isArray(v.options)
            ? v.options.map((opt: any) => {
                if (typeof opt === 'string') return opt;
                if (!opt) return '';
                const img = opt.imageUrl || opt.image_url;
                const optPrice = (opt.price !== undefined && opt.price !== null && !isNaN(Number(opt.price)) && Number(opt.price) > 0)
                  ? Number(opt.price)
                  : undefined;
                return {
                  name: opt.name || '',
                  imageUrl: img ? normalizeImageUrl(img) : undefined,
                  price: optPrice
                };
              })
            : []
        }))
      : [],
    combinations: Array.isArray(raw.combinations)
      ? raw.combinations.map((c: any) => ({
          id: c.id || `comb_${Math.random().toString(36).slice(2, 7)}`,
          options: c.options || {},
          price: (c.price !== undefined && c.price !== null && !isNaN(Number(c.price)) && Number(c.price) > 0)
            ? Number(c.price)
            : undefined,
          imageUrl: c.imageUrl ? normalizeImageUrl(c.imageUrl) : (c.image_url ? normalizeImageUrl(c.image_url) : undefined),
          sku: c.sku || undefined,
          inStock: Boolean(c.inStock ?? c.in_stock ?? true),
          stockCount: c.stockCount ?? c.stock_count ?? 10
        }))
      : [],
    createdAt: raw.created_at || new Date().toISOString()
  };
}

// Helper to convert frontend Product to backend snake_case
function mapProductToBackend(product: Partial<Product>): any {
  const mapped: any = {};
  if (product.storeId !== undefined) mapped.store_id = product.storeId;
  if (product.name !== undefined) mapped.name = product.name;
  if (product.slug !== undefined) mapped.slug = product.slug;
  if (product.description !== undefined) mapped.description = product.description;
  if (product.price !== undefined) mapped.price = product.price;
  if (product.compareAtPrice !== undefined) mapped.compare_at_price = product.compareAtPrice;
  if (product.category !== undefined) mapped.category = product.category;
  if (product.imageUrl !== undefined) mapped.image_url = product.imageUrl;
  if (product.additionalImages !== undefined) mapped.additional_images = product.additionalImages;
  if (product.sku !== undefined) mapped.sku = product.sku;
  if (product.inStock !== undefined) mapped.in_stock = product.inStock;
  if (product.stockCount !== undefined) mapped.stock_count = product.stockCount;
  if (product.isFeatured !== undefined) mapped.is_featured = product.isFeatured;
  if (product.variants !== undefined) mapped.variants = product.variants;
  if (product.combinations !== undefined) mapped.combinations = product.combinations;
  return mapped;
}

// Helper for banners
export function mapBannerFromBackend(raw: any): PromotionalBanner {
  return {
    id: raw.id,
    title: raw.title || '',
    subtitle: raw.subtitle || '',
    badge: raw.badge || '',
    imageUrl: normalizeImageUrl(raw.image_url),
    productId: raw.product_id || undefined,
    storeId: raw.store_id || undefined,
    buttonText: raw.button_text || 'Ver Producto',
    gradientTheme: raw.gradient_theme || 'emerald',
    isActive: Boolean(raw.is_active ?? true),
    order: raw.order || 0,
    createdAt: raw.created_at || new Date().toISOString()
  };
}

function mapBannerToBackend(banner: Partial<PromotionalBanner>): any {
  const mapped: any = {};
  if (banner.title !== undefined) mapped.title = banner.title;
  if (banner.subtitle !== undefined) mapped.subtitle = banner.subtitle;
  if (banner.badge !== undefined) mapped.badge = banner.badge;
  if (banner.imageUrl !== undefined) mapped.image_url = banner.imageUrl;
  if (banner.productId !== undefined) mapped.product_id = banner.productId || null;
  if (banner.storeId !== undefined) mapped.store_id = banner.storeId || null;
  if (banner.buttonText !== undefined) mapped.button_text = banner.buttonText;
  if (banner.gradientTheme !== undefined) mapped.gradient_theme = banner.gradientTheme;
  if (banner.isActive !== undefined) mapped.is_active = banner.isActive;
  if (banner.order !== undefined) mapped.order = banner.order;
  return mapped;
}

// Helper to convert backend snake_case order to frontend camelCase Order
export function mapOrderFromBackend(raw: any): Order {
  return {
    id: raw.id,
    orderNumber: raw.order_number || raw.orderNumber || (raw.id ? `PED-${raw.id.slice(-4)}` : 'PED-0000'),
    storeId: raw.store_id || raw.storeId || '',
    customerName: raw.customer_name || raw.customerName || 'Cliente',
    customerDni: raw.customer_dni || raw.customerDni || undefined,
    customerPhone: raw.customer_phone || raw.customerPhone || '',
    customerAddress: raw.customer_address || raw.customerAddress || '',
    notes: raw.notes || undefined,
    deliveryType: (raw.delivery_type || raw.deliveryType || 'delivery') as 'delivery' | 'pickup',
    paymentMethod: raw.payment_method || raw.paymentMethod || 'Yape/Plin',
    items: Array.isArray(raw.items) ? raw.items : [],
    subtotal: Number(raw.subtotal ?? 0),
    deliveryFee: Number(raw.delivery_fee ?? raw.deliveryFee ?? 0),
    total: Number(raw.total ?? 0),
    status: (raw.status || 'pending_whatsapp') as OrderStatus,
    whatsappMessageSent: raw.whatsapp_message_sent || raw.whatsappMessageSent || undefined,
    createdAt: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()
  };
}

/** Debe coincidir con MAX_UPLOAD_MB del backend */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const api = {
  // --- Stores ---
  async getStores(includeAll: boolean = false): Promise<StoreConfig[]> {
    const url = includeAll ? `${API_BASE_URL}/stores?include_all=true` : `${API_BASE_URL}/stores`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Error al obtener tiendas');
    const data = await res.json();
    return data.map(mapStoreFromBackend);
  },

  async getStore(idOrSlug: string): Promise<StoreConfig> {
    const res = await fetch(`${API_BASE_URL}/stores/${idOrSlug}`);
    if (!res.ok) throw new Error('Tienda no encontrada');
    const data = await res.json();
    return mapStoreFromBackend(data);
  },

  async updateStore(storeId: string, storeData: Partial<StoreConfig>): Promise<StoreConfig> {
    const backendData = mapStoreToBackend(storeData);
    const res = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(backendData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar tienda');
    }
    const data = await res.json();
    return mapStoreFromBackend(data);
  },

  // --- Products ---
  async getProducts(params?: {
    search?: string;
    store_ids?: string[];
    category?: string;
    min_price?: number;
    max_price?: number;
    only_in_stock?: boolean;
    only_on_sale?: boolean;
    sort_by?: string;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.store_ids && params.store_ids.length > 0) {
      params.store_ids.forEach(id => query.append('store_ids', id));
    }
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.min_price != null) query.set('min_price', params.min_price.toString());
    if (params?.max_price != null) query.set('max_price', params.max_price.toString());
    if (params?.only_in_stock) query.set('only_in_stock', 'true');
    if (params?.only_on_sale) query.set('only_on_sale', 'true');
    if (params?.sort_by) query.set('sort_by', params.sort_by);

    const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Error al obtener productos');
    const data = await res.json();
    return data.map(mapProductFromBackend);
  },

  async getMyProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE_URL}/products/my-products`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Error al obtener productos del comerciante');
    const data = await res.json();
    return data.map(mapProductFromBackend);
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const backendData = mapProductToBackend(product);
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(backendData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear producto');
    }
    const data = await res.json();
    return mapProductFromBackend(data);
  },

  async updateProduct(product: Product): Promise<Product> {
    const backendData = mapProductToBackend(product);
    const res = await fetch(`${API_BASE_URL}/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(backendData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar producto');
    }
    const data = await res.json();
    return mapProductFromBackend(data);
  },

  async deleteProduct(productId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Error al eliminar producto');
  },

  async trackProductVisit(productId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/products/${productId}/visit`, { method: 'POST' });
    } catch {
      // silent
    }
  },

  // --- Banners ---
  async getBanners(includeAll: boolean = false): Promise<PromotionalBanner[]> {
    const url = includeAll ? `${API_BASE_URL}/banners/all` : `${API_BASE_URL}/banners`;
    const res = await fetch(url, {
      headers: includeAll ? { ...getAuthHeader() } : undefined
    });
    if (!res.ok) throw new Error('Error al obtener banners');
    const data = await res.json();
    return data.map(mapBannerFromBackend);
  },

  async createBanner(banner: Omit<PromotionalBanner, 'id' | 'createdAt'>): Promise<PromotionalBanner> {
    const backendData = mapBannerToBackend(banner);
    const res = await fetch(`${API_BASE_URL}/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(backendData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear banner publicitario');
    }
    const data = await res.json();
    return mapBannerFromBackend(data);
  },

  async updateBanner(bannerId: string, banner: Partial<PromotionalBanner>): Promise<PromotionalBanner> {
    const backendData = mapBannerToBackend(banner);
    const res = await fetch(`${API_BASE_URL}/banners/${bannerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(backendData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar banner');
    }
    const data = await res.json();
    return mapBannerFromBackend(data);
  },

  async deleteBanner(bannerId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/banners/${bannerId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Error al eliminar banner');
  },

  // --- Orders ---
  async createOrder(orderData: {
    storeId: string;
    orderNumber?: string;
    customerName: string;
    customerDni: string;
    customerPhone: string;
    customerAddress: string;
    notes?: string;
    deliveryType: string;
    paymentMethod: string;
    items: any[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    whatsappMessageSent?: string;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: orderData.storeId,
        order_number: orderData.orderNumber,
        customer_name: orderData.customerName,
        customer_dni: orderData.customerDni,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        notes: orderData.notes,
        delivery_type: orderData.deliveryType,
        payment_method: orderData.paymentMethod,
        items: orderData.items,
        subtotal: orderData.subtotal,
        delivery_fee: orderData.deliveryFee,
        total: orderData.total,
        whatsapp_message_sent: orderData.whatsappMessageSent
      })
    });
    if (!res.ok) {
      // Mensaje claro del servidor (validación de DNI/nombre/teléfono, stock, tienda cerrada…)
      let message = 'No se pudo registrar tu pedido. Inténtalo de nuevo.';
      try {
        const err = await res.json();
        const d = err?.detail;
        if (typeof d === 'string') message = d;
        else if (Array.isArray(d) && d[0]?.msg) message = String(d[0].msg).replace(/^Value error,\s*/i, '');
        else if (d?.message) message = d.message;
      } catch { /* respuesta sin JSON */ }
      if (res.status === 429) message = 'Hiciste varios pedidos seguidos. Espera unos minutos e inténtalo de nuevo.';
      throw new Error(message);
    }
    const data = await res.json();
    return mapOrderFromBackend(data);
  },

  async getAllOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      headers: getAuthHeader()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapOrderFromBackend) : [];
  },

  async getStoreOrders(storeId: string): Promise<Order[]> {
    const res = await fetch(`${API_BASE_URL}/orders/store/${storeId}`, {
      headers: getAuthHeader()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapOrderFromBackend) : [];
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status?status=${status}`, {
      method: 'PATCH',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Error al actualizar estado de pedido');
  },

  // --- MinIO Upload ---
  /**
   * Sube una imagen. Si el servidor lo permite, el navegador la envía DIRECTO a MinIO
   * (formulario firmado por el backend: nombre, tipo y tamaño fijos); si no, va por la API.
   * `thumb` (opcional): versión de 400 px para las tarjetas del catálogo.
   */
  async uploadImage(
    file: File,
    folder: 'logos' | 'products' | 'banners' = 'products',
    thumb?: File | null
  ): Promise<{ url: string; filename: string; thumbUrl?: string | null }> {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('La imagen pesa más de 5 MB. Elige una foto más liviana o toma una captura de pantalla de ella.');
    }
    const friendly = async (res: Response, fallback: string) => {
      const err = await res.json().catch(() => ({}));
      if (res.status === 413) return new Error('La imagen pesa más de 5 MB. Elige una foto más liviana.');
      if (res.status === 429) return new Error(err.detail || 'Subiste muchas imágenes seguidas. Espera unos minutos e inténtalo de nuevo.');
      return new Error(err.detail || fallback);
    };

    // 1) Pedir permiso de subida directa
    let presign: any = null;
    try {
      const pr = await fetch(`${API_BASE_URL}/uploads/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          folder,
          content_type: file.type || 'image/jpeg',
          size: file.size,
          thumb_size: thumb && thumb.type === 'image/webp' ? thumb.size : null,
        }),
      });
      if (pr.status === 404) presign = { direct: false };      // backend antiguo
      else if (!pr.ok) throw await friendly(pr, 'No se pudo preparar la subida.');
      else presign = await pr.json();
    } catch (e) {
      if (e instanceof Error && e.message && !/fetch|network/i.test(e.message)) throw e;
      presign = { direct: false };
    }

    if (presign?.direct) {
      const postForm = async (fields: Record<string, string>, blob: File) => {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
        fd.append('file', blob);   // el archivo SIEMPRE al final del formulario
        const up = await fetch(presign.upload_url, { method: 'POST', body: fd });
        if (up.status === 400 || up.status === 403) {
          throw Object.assign(new Error('La imagen no cumple los requisitos (tipo o tamaño).'), { rejected: true });
        }
        if (!up.ok) throw new Error(`almacenamiento ${up.status}`);
      };
      try {
        await postForm(presign.fields, file);
        let thumbUrl: string | null = null;
        if (thumb && presign.thumb_fields) {
          try { await postForm(presign.thumb_fields, thumb); thumbUrl = presign.thumb_url; } catch { /* sin miniatura: la tarjeta usa la imagen normal */ }
        }
        return { url: presign.url, filename: file.name, thumbUrl };
      } catch (e: any) {
        if (e?.rejected) throw e;
        // El almacenamiento no respondió por la vía directa: se intenta por la API (abajo)
        console.warn('Subida directa no disponible, usando la API:', e);
      }
    }

    // 2) Modo clásico: la imagen pasa por la API
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/uploads/image?folder=${folder}`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    if (!res.ok) throw await friendly(res, 'No se pudo subir la imagen. Inténtalo de nuevo.');
    return res.json();
  },

  // --- Auth ---
  async login(identifier: string, password?: string): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        email: identifier.trim(), // retrocompatibilidad
        password: (password || '').trim()
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const detail = errData.detail;
      const error: any = new Error(
        typeof detail === 'object' && detail !== null
          ? detail.message
          : (typeof detail === 'string' ? detail : 'DNI/Correo o PIN incorrectos')
      );
      if (typeof detail === 'object' && detail !== null) {
        error.remainingAttempts = detail.remaining_attempts;
        error.locked = detail.locked;
        error.code = detail.code;
        error.userName = detail.user_name;
        error.identifier = detail.identifier;
      }
      throw error;
    }
    const data = await res.json();
    localStorage.setItem('catalog_saas_jwt_token', data.access_token);
    return { token: data.access_token, user: data.user };
  },

  async requestForgotPin(identifier: string): Promise<{
    success: boolean;
    message: string;
    userName: string;
    userDni?: string;
    storeName?: string;
    adminPhone: string;
    whatsappUrl: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'No se pudo registrar la solicitud de restablecimiento.');
    }
    const data = await res.json();
    return {
      success: data.success,
      message: data.message,
      userName: data.user_name,
      userDni: data.user_dni,
      storeName: data.store_name,
      adminPhone: data.admin_phone,
      whatsappUrl: data.whatsapp_url
    };
  },

  async adminResetPinDefault(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/admin/reset-pin-default`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ user_id: userId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al resetear el PIN por defecto');
    }
    return res.json();
  },

  async changePin(newPin: string, confirmPin: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/change-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ new_pin: newPin, confirm_pin: confirmPin })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar el PIN');
    }
    return res.json();
  },

  async register(data: {
    // Titular
    dni?: string;
    name: string;
    phone?: string;
    email: string;
    personalAddress?: string;
    // Tienda
    storeName?: string;
    ruc?: string;
    category?: string;
    storeType?: 'fisica' | 'virtual';
    storeAddress?: string;
    storePhone?: string;
    storeEmail?: string;
    about?: string;
    // Seguridad & Plan
    password?: string;
    pin?: string;
    plan?: string;
  }): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dni: data.dni,
        name: data.name,
        email: data.email,
        phone: data.phone,
        personal_address: data.personalAddress,
        store_name: data.storeName,
        ruc: data.ruc,
        category: data.category || 'General',
        store_type: data.storeType || 'virtual',
        store_address: data.storeAddress,
        store_phone: data.storePhone,
        store_email: data.storeEmail,
        about: data.about,
        password: data.pin || data.password || '123456',
        pin: data.pin,
        role: 'merchant',
        plan: data.plan || 'starter'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al registrar comerciante');
    }
    const resData = await res.json();
    localStorage.setItem('catalog_saas_jwt_token', resData.access_token);
    return { token: resData.access_token, user: resData.user };
  },

  async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const token = localStorage.getItem('catalog_saas_jwt_token');
      if (!token) return null;
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeader()
      });
      if (!res.ok) {
        localStorage.removeItem('catalog_saas_jwt_token');
        return null;
      }
      const data = await res.json();
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        storeId: data.store_id || '',
        phone: data.phone || '',
        status: data.status || 'active',
        failedLoginAttempts: data.failed_login_attempts ?? 0,
        pinResetRequested: !!data.pin_reset_requested,
        pinResetRequestedAt: data.pin_reset_requested_at || undefined,
        mustChangePin: !!data.must_change_pin,
        subscription: {
          planId: data.subscription_plan || 'pro',
          status: data.subscription_status || (data.status === 'pending_approval' ? 'pending_approval' : (data.status === 'suspended' ? 'past_due' : 'active')),
          billingCycle: 'monthly',
          startDate: new Date().toISOString(),
          currentPeriodEnd: data.subscription_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          renewsAutomatically: true
        },
        createdAt: data.created_at || new Date().toISOString()
      };
    } catch {
      return null;
    }
  },

  async getUsers(): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: getAuthHeader()
      });
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return data.map((u: any): UserAccount => ({
        id: u.id,
        name: u.name,
        email: u.email,
        dni: u.dni || '',
        role: u.role,
        storeId: u.store_id || '',
        phone: u.phone || '',
        personalAddress: u.personal_address || '',
        status: u.status || 'active',
        failedLoginAttempts: u.failed_login_attempts ?? 0,
        pinResetRequested: !!u.pin_reset_requested,
        pinResetRequestedAt: u.pin_reset_requested_at || undefined,
        mustChangePin: !!u.must_change_pin,
        subscription: {
          planId: (u.subscription_plan as any) || 'starter',
          status: (u.subscription_status as any) || (u.status === 'pending_approval' ? 'pending_approval' : (u.status === 'suspended' ? 'past_due' : 'active')),
          billingCycle: 'monthly',
          startDate: u.created_at || new Date().toISOString(),
          currentPeriodEnd: u.subscription_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          renewsAutomatically: true
        },
        createdAt: u.created_at || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  },

  async updateUserStatus(userId: string, status: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateUserRole(userId: string, role: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ role })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.detail || 'Error al eliminar usuario' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión' };
    }
  },

  async updateProfile(data: UserProfileUpdateData): Promise<UserAccount> {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar el perfil.');
    }
    const u = await res.json();
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      dni: u.dni || '',
      role: u.role,
      storeId: u.store_id || '',
      phone: u.phone || '',
      personalAddress: u.personal_address || '',
      status: u.status || 'active',
      subscription: {
        planId: (u.subscription_plan as any) || 'starter',
        status: (u.subscription_status as any) || (u.status === 'pending_approval' ? 'pending_approval' : (u.status === 'suspended' ? 'past_due' : 'active')),
        billingCycle: 'monthly',
        startDate: u.created_at || new Date().toISOString(),
        currentPeriodEnd: u.subscription_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        renewsAutomatically: true
      },
      createdAt: u.created_at || new Date().toISOString()
    };
  },

  async updateUser(userId: string, data: UserAdminUpdateData): Promise<UserAccount> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar el usuario.');
    }
    const u = await res.json();
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      dni: u.dni || '',
      role: u.role,
      storeId: u.store_id || '',
      phone: u.phone || '',
      personalAddress: u.personal_address || '',
      status: u.status || 'active',
      subscription: {
        planId: (u.subscription_plan as any) || 'starter',
        status: (u.subscription_status as any) || (u.status === 'pending_approval' ? 'pending_approval' : (u.status === 'suspended' ? 'past_due' : 'active')),
        billingCycle: 'monthly',
        startDate: u.created_at || new Date().toISOString(),
        currentPeriodEnd: u.subscription_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        renewsAutomatically: true
      },
      createdAt: u.created_at || new Date().toISOString()
    };
  },

  // --- Promo Codes ---
  async getPromoCodes(): Promise<PromoCode[]> {
    const res = await fetch(`${API_BASE_URL}/promo-codes`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Error al obtener códigos promocionales');
    const data = await res.json();
    return data.map((p: any) => ({
      id: p.id,
      code: p.code,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      maxUses: p.max_uses,
      usedCount: p.used_count,
      isActive: p.is_active,
      validUntil: p.valid_until,
      applicablePlan: p.applicable_plan || 'all',
      createdAt: p.created_at
    }));
  },

  async createPromoCode(data: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxUses?: number;
    isActive?: boolean;
    validUntil?: string | null;
    applicablePlan?: string;
  }): Promise<PromoCode> {
    const res = await fetch(`${API_BASE_URL}/promo-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        code: data.code,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        max_uses: data.maxUses ?? 0,
        is_active: data.isActive ?? true,
        valid_until: data.validUntil || null,
        applicable_plan: data.applicablePlan || 'all'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear código promocional');
    }
    const p = await res.json();
    return {
      id: p.id,
      code: p.code,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      maxUses: p.max_uses,
      usedCount: p.used_count,
      isActive: p.is_active,
      validUntil: p.valid_until,
      applicablePlan: p.applicable_plan || 'all',
      createdAt: p.created_at
    };
  },

  async togglePromoCode(promoId: string): Promise<PromoCode> {
    const res = await fetch(`${API_BASE_URL}/promo-codes/${promoId}/toggle`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Error al cambiar estado del código promocional');
    const p = await res.json();
    return {
      id: p.id,
      code: p.code,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      maxUses: p.max_uses,
      usedCount: p.used_count,
      isActive: p.is_active,
      validUntil: p.valid_until,
      applicablePlan: p.applicable_plan || 'all',
      createdAt: p.created_at
    };
  },

  async deletePromoCode(promoId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/promo-codes/${promoId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Error al eliminar código promocional');
  },

  async validatePromoCode(code: string, planId: string, baseAmount: number): Promise<PromoCodeValidationResult> {
    const res = await fetch(`${API_BASE_URL}/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        plan_id: planId,
        billing_cycle: 'monthly',
        base_amount: baseAmount
      })
    });
    if (!res.ok) {
      return {
        valid: false,
        message: 'No se pudo validar el cupón.',
        discountAmount: 0,
        finalAmount: baseAmount
      };
    }
    const data = await res.json();
    return {
      valid: data.valid,
      message: data.message,
      code: data.code,
      discountType: data.discount_type,
      discountValue: data.discount_value,
      discountAmount: data.discount_amount,
      finalAmount: data.final_amount,
      applicablePlan: data.applicable_plan
    };
  },

  async verifyYapePayment(data: {
    codigo?: string;
    planId: string;
    promoCode?: string;
    billingCycle?: string;
  }): Promise<YapeVerifyResult> {
    const res = await fetch(`${API_BASE_URL}/payments/verify-yape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        codigo: data.codigo || '000',
        plan_id: data.planId,
        promo_code: data.promoCode || undefined,
        billing_cycle: data.billingCycle || 'monthly'
      })
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = resData.detail;
      if (typeof detail === 'object' && detail !== null) {
        return {
          success: false,
          message: detail.message || 'Error al verificar el pago con Yape.',
          attemptsRemaining: detail.remaining_attempts ?? detail.attempts_remaining ?? 0,
          mustSendWhatsapp: detail.must_send_whatsapp ?? false
        };
      }
      return {
        success: false,
        message: typeof detail === 'string' ? detail : 'Error al verificar el pago con Yape.',
        attemptsRemaining: 0,
        mustSendWhatsapp: true
      };
    }

    return {
      success: !!resData.success,
      message: resData.message || (resData.success ? 'Pago verificado con éxito' : 'No se pudo verificar el pago.'),
      attemptsRemaining: resData.remaining_attempts ?? resData.attempts_remaining ?? 0,
      mustSendWhatsapp: !!resData.must_send_whatsapp,
      userStatus: resData.user_status,
      subscriptionStatus: resData.subscription_status,
      subscriptionPlan: resData.plan_id || resData.subscription_plan,
      subscriptionPeriodEnd: resData.subscription_period_end,
      storeActive: resData.activated ?? resData.store_active
    };
  },

  // --- SaaS Yape & Payments Configuration ---
  async getYapeConfig(): Promise<YapePaymentConfig> {
    const res = await fetch(`${API_BASE_URL}/payments/config`);
    if (!res.ok) throw new Error('Error al obtener configuración de Yape');
    const data = await res.json();
    return {
      phone: data.phone || '925763903',
      phoneFormatted: data.phone_formatted || '+51 925 763 903',
      holder: data.holder || 'JamuyWasi',
      qrUrl: normalizeImageUrl(data.qr_url) || '',
      instructions: data.instructions || '',
      updatedAt: data.updated_at
    };
  },

  async updateYapeConfig(config: Partial<YapePaymentConfig>): Promise<YapePaymentConfig> {
    const res = await fetch(`${API_BASE_URL}/payments/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        phone: config.phone,
        phone_formatted: config.phoneFormatted,
        holder: config.holder,
        qr_url: config.qrUrl || '',
        instructions: config.instructions || ''
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al actualizar configuración de Yape');
    }
    const data = await res.json();
    return {
      phone: data.phone,
      phoneFormatted: data.phone_formatted,
      holder: data.holder,
      qrUrl: normalizeImageUrl(data.qr_url) || '',
      instructions: data.instructions,
      updatedAt: data.updated_at
    };
  },

  // --- Billing Invoices ---
  async getMyInvoices(): Promise<SubscriptionInvoice[]> {
    const res = await fetch(`${API_BASE_URL}/payments/my-invoices`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Error al obtener historial de facturación');
    return res.json();
  },

  // --- Multi-Store Methods ---
  async getMyStores(): Promise<StoreConfig[]> {
    const res = await fetch(`${API_BASE_URL}/stores/my-stores`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Error al obtener tiendas del comerciante');
    const list = await res.json();
    return list.map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      tagline: item.tagline || '',
      description: item.description || '',
      logo: normalizeImageUrl(item.logo),
      banner: normalizeImageUrl(item.banner),
      countryCode: item.country_code || '51',
      phone: item.phone || '',
      currency: item.currency || 'PEN',
      currencySymbol: item.currency_symbol || 'S/',
      address: item.address || '',
      schedule: item.schedule || '',
      deliveryFee: item.delivery_fee ?? 10.0,
      freeDeliveryThreshold: item.free_delivery_threshold ?? 150.0,
      allowPickup: item.allow_pickup ?? true,
      paymentInstructions: item.payment_instructions || '',
      whatsappMessageTemplate: item.whatsapp_message_template || '',
      themeColor: item.theme_color || 'emerald',
      socials: item.socials || {},
      isActive: item.is_active ?? true,
      ownerId: item.owner_id
    }));
  },

  async createStore(data: Partial<StoreConfig>): Promise<StoreConfig> {
    const res = await fetch(`${API_BASE_URL}/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        name: data.name,
        slug: data.slug || undefined,
        ruc: data.ruc || '',
        store_type: data.storeType || 'virtual',
        category: data.category || 'General',
        tagline: data.tagline || '',
        description: data.description || '',
        logo: data.logo || '',
        banner: data.banner || '',
        country_code: data.countryCode || '51',
        phone: data.phone || '',
        store_email: data.storeEmail || undefined,
        currency: data.currency || 'PEN',
        currency_symbol: data.currencySymbol || 'S/',
        address: data.address || '',
        schedule: data.schedule || '',
        delivery_fee: data.deliveryFee ?? 10.0,
        free_delivery_threshold: data.freeDeliveryThreshold ?? 150.0,
        allow_pickup: data.allowPickup ?? true,
        payment_instructions: data.paymentInstructions || '',
        whatsapp_message_template: data.whatsappMessageTemplate || '',
        theme_color: data.themeColor || 'emerald',
        socials: data.socials || {},
        owner_id: data.ownerId || (data as any).owner_id || undefined
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear la nueva tienda');
    }
    const item = await res.json();
    return mapStoreFromBackend(item);
  },

  logout(): void {
    localStorage.removeItem('catalog_saas_jwt_token');
  }
};

export function mapNotificationFromBackend(raw: any): AppNotification {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title || '',
    message: raw.message || '',
    link: raw.link || {},
    storeId: raw.store_id ?? null,
    isRead: Boolean(raw.is_read),
    createdAt: raw.created_at
      ? (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw.created_at) ? raw.created_at : raw.created_at + 'Z')
      : new Date().toISOString(),
  };
}

/** API de notificaciones (campanita) */
export const notificationsApi = {
  async list(limit = 30): Promise<{ items: AppNotification[]; unread: number } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?limit=${limit}`, { headers: getAuthHeader() });
      if (!res.ok) return null;
      const data = await res.json();
      return { items: (data.items || []).map(mapNotificationFromBackend), unread: Number(data.unread || 0) };
    } catch {
      return null;
    }
  },
  async markRead(id: string): Promise<void> {
    try { await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'POST', headers: getAuthHeader() }); } catch { /* noop */ }
  },
  async markAllRead(): Promise<void> {
    try { await fetch(`${API_BASE_URL}/notifications/read-all`, { method: 'POST', headers: getAuthHeader() }); } catch { /* noop */ }
  },
};
