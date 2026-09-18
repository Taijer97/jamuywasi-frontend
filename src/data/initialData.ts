import { StoreConfig, Product, Order, PlanConfig, UserAccount, PromotionalBanner } from '../types';

export const SAAS_PLANS: PlanConfig[] = [
  {
    id: 'starter',
    name: 'Plan Emprendedor',
    tagline: 'Ideal para iniciar tu catálogo digital y cerrar primeras ventas en WhatsApp.',
    priceMonthly: 10,
    priceAnnual: 100,
    maxProducts: 20,
    maxOrdersPerMonth: 100,
    maxStores: 1,
    features: [
      '1 Tienda digital activa',
      'Hasta 20 productos en catálogo',
      'Catálogo responsive para móvil y web',
      'Enlace directo y botón de WhatsApp',
      'Mensaje de pedido predefinido básico',
      'Carrito de compras integrado',
      'Soporte estándar por correo'
    ]
  },
  {
    id: 'pro',
    name: 'Plan Crecimiento Pro',
    tagline: 'Para negocios en expansión que buscan automatización, multi-tienda y métricas.',
    priceMonthly: 25,
    priceAnnual: 250,
    maxProducts: 150,
    maxOrdersPerMonth: 1000,
    maxStores: 2,
    recommended: true,
    features: [
      'Hasta 2 tiendas digitales independientes',
      'Hasta 150 productos por tienda',
      'Personalización total de plantilla WhatsApp',
      'Panel de métricas y reportes mensuales',
      'Gestión de inventario y variantes (tallas, colores)',
      'Exportación de reportes a CSV',
      'Sin comisiones por ventas',
      'Soporte prioritario por WhatsApp'
    ]
  },
  {
    id: 'business',
    name: 'Plan Negocio Escala',
    tagline: 'Solución empresarial sin límites con soporte multi-tienda avanzado.',
    priceMonthly: 50,
    priceAnnual: 500,
    maxProducts: 9999,
    maxOrdersPerMonth: 10000,
    maxStores: 3,
    features: [
      'Hasta 3 tiendas digitales independientes',
      'Productos y categorías ilimitados',
      'Múltiples administradores de tienda',
      'Reportes financieros y comparativas mensuales',
      'Integración de dominio personalizado',
      'Respuestas automáticas inteligentes',
      'Soporte VIP 24/7 y onboarding asistido'
    ]
  }
];

// Mock data removed. Real data is loaded dynamically from the FastAPI backend & MySQL database.
export const INITIAL_STORES: StoreConfig[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_USERS: UserAccount[] = [];
export const INITIAL_BANNERS: PromotionalBanner[] = [];

export const STORE_CATEGORIES = [
  { id: 'Moda',         label: '👗 Moda & Calzado' },
  { id: 'Gastronomía',  label: '🍔 Restaurante & Comida' },
  { id: 'Cafetería',    label: '☕ Café & Postres' },
  { id: 'Tecnología',   label: '📱 Tecnología & Celulares' },
  { id: 'Belleza',      label: '💄 Belleza & Cosmética' },
  { id: 'Abarrotes',    label: '🛒 Market & Abarrotes' },
  { id: 'Salud',        label: '💊 Farmacia & Salud' },
  { id: 'Hogar',        label: '🛋 Hogar & Decoración' },
  { id: 'Servicios',    label: '💼 Servicios Profesionales' },
  { id: 'General',      label: '✨ Boutique General' },
];

export const DEFAULT_STORE_LOGO = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80';
export const DEFAULT_STORE_BANNER = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80';
export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
