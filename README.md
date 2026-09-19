# JamuyWasi — Frontend SaaS (React + Vite + Tailwind v4)

Aplicación web tipo marketplace multicuenta que integra 5 vistas principales: Landing/Home, Marketplace de catálogos, Tienda/Catálogo público con checkout directo a WhatsApp, Panel de Comerciante (Merchant Dashboard) y Panel de SuperAdministración SaaS.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Runtime UI | **React 19** |
| Bundler / DevServer | **Vite 6** |
| Estilos | **Tailwind CSS v4** + `@tailwindcss/vite` |
| Lenguaje | **TypeScript 5.8** |
| Íconos | **Lucide React** |
| Animaciones | **Motion (Framer Motion v12)** + **Canvas Confetti** |
| Gestión de estado | **React Context** (`AppContext.tsx`) — Estado global |
| Cliente API | **Fetch API** nativo via `src/services/api.ts` (JWT Bearer) |
| Persistencia cliente | **localStorage** (carrito, tienda activa, usuario, órdenes offline) |
| Enrutamiento | **URL-driven state** (path slugs + query params, sin librería router) |
| Integración IA (opcional) | `@google/genai` |
| (Build opcional) Servidor estático | **Express** (`server.js`) |

---

## Requisitos

- Node.js ≥ 20 (LTS recomendado)
- Gestor de paquetes: `npm`, `pnpm` o `bun`
- Backend FastAPI corriendo en `http://127.0.0.1:8000` (o configurar proxy en `vite.config.ts`)

---

## Instalación y puesta en marcha

### 1. Instalar dependencias

```bash
cd frontend_as
npm install
# o bun install  /  pnpm install
```

### 2. Variables de entorno (opcional)

Copia `.env.example` como `.env` y ajusta si necesitas otro endpoint de API:

```env
VITE_API_BASE_URL=/api
VITE_SITE_NAME=JamuyWasi
```

> Nota: En modo desarrollo Vite proxea `/api` al backend en `http://127.0.0.1:8000` automáticamente. Para producción debes servir el build con el mismo origen del API o configurar `VITE_API_BASE_URL` a la URL absoluta (CORS).

### 3. Levantar en modo desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000` (expone host `0.0.0.0` para acceso desde LAN).

### 4. Build para producción

```bash
npm run build
# Genera bundle optimizado en ./dist
```

Servir localmente el build:

```bash
npm run preview
```

### 5. Servir con Express (opcional hosting propio)

```bash
npm install
node server.js
```

### 6. Type-check

```bash
npm run lint     # tsc --noEmit
```

---

## Arquitectura de carpetas

```
frontend_as/
├── src/
│   ├── App.tsx                        # Composición de vistas + lazy loading de paneles admin
│   ├── main.tsx                       # Entrypoint React 19
│   ├── index.css                      # Tailwind + tema global
│   ├── types.ts                       # Interfaces TypeScript de dominio
│   ├── context/
│   │   └── AppContext.tsx             # Estado global (AppProvider + hook useApp)
│   ├── services/
│   │   └── api.ts                     # Cliente API REST + JWT + snake_case ↔ camelCase
│   ├── data/
│   │   ├── initialData.ts             # SAAS_PLANS 3 tiers (Starter/Pro/Business)
│   │   └── saasPayments.ts
│   ├── hooks/
│   │   └── useDebounce.ts
│   ├── utils/
│   │   ├── whatsapp.ts                # Generación de plantillas y enlaces wa.me
│   │   ├── imageCompressor.ts         # Compresión cliente WebP (logos/productos/banners)
│   │   └── storeSchedule.ts
│   └── components/
│       ├── Navbar.tsx                 # Barra superior: navegación + auth + acceso a paneles
│       ├── Auth/
│       │   ├── AuthModal.tsx              # Modal unificado login/register 3 pasos
│       │   ├── UserProfileModal.tsx       # Edición de datos personales + PIN
│       │   ├── PendingApprovalModal.tsx   # Post-registro: guía aprobación por WhatsApp
│       │   └── AccessDeniedView.tsx       # Pantalla 403 para no superadmins
│       ├── Home/
│       │   ├── HomeDashboard.tsx          # Landing + carrusel banners + categorías + tiendas
│       │   ├── PromoCarousel.tsx
│       │   ├── HomeFiltersSidebar.tsx
│       │   ├── CategoryCard.tsx
│       │   ├── StoreCard.tsx
│       │   └── MarketplaceProductCard.tsx
│       ├── Marketplace/
│       │   └── MarketplaceDashboard.tsx   # Buscador global + filtros + todas las tiendas
│       ├── Catalog/
│       │   ├── CatalogView.tsx            # Catálogo de la tienda activa (vista slug público)
│       │   ├── CatalogHeader.tsx          # Banner + info tienda + contacto WhatsApp
│       │   ├── ProductCard.tsx
│       │   ├── ProductModal.tsx           # Ficha producto + variantes + añadir a carrito
│       │   ├── CartDrawer.tsx             # Drawer carrito lateral + checkout
│       │   └── OrderSuccessModal.tsx      # Confirmación + confeti + enlace WhatsApp
│       ├── Merchant/
│       │   ├── MerchantDashboard.tsx      # Panel comerciante (tabs)
│       │   ├── OverviewTab.tsx            # KPIs + últimos pedidos
│       │   ├── StoreProfileTab.tsx        # Editar perfil, logo, banner, redes, horarios
│       │   ├── ProductsTab.tsx            # CRUD productos + upload imagen comprimida
│       │   ├── OrdersTab.tsx              # Listado de pedidos + cambio de estado + WhatsApp
│       │   ├── PaymentVerificationPanel.tsx  # Verificación manual de pagos
│       │   ├── ReportsTab.tsx             # Reportes métricos y exportación
│       │   ├── StoreSettingsTab.tsx       # Delivery, moneda, plantilla WhatsApp
│       │   └── SubscriptionTab.tsx        # Planes y upgrade Pro/Business
│       ├── SuperAdmin/
│       │   ├── SaasAdminView.tsx          # Panel administración SaaS
│       │   ├── UserManagementTab.tsx      # Aprobación / suspensión / roles de merchants
│       │   └── BannersManagementTab.tsx   # CRUD banners promocionales home
│       └── Common/
│           └── StoreStatusBadge.tsx
├── public/
├── index.html
├── vite.config.ts                # Proxy /api → :8000 + Tailwind plugin v4
├── tsconfig.json
├── package.json
└── README.md
```

---

## Rutas y navegación URL-driven

La aplicación no usa una librería de routing; el estado activo se sincroniza bidireccionalmente con el `window.location` (pushState + popstate). Esto permite URLs amigables, Deep Links compartibles y navegación Atrás/Adelante nativa.

| Ruta (pathname / querys) | Vista | Descripción |
|--------------------------|-------|-------------|
| `/` | **Home Dashboard** | Landing con banners, categorías destacadas y directorio de tiendas. |
| `/marketplace` | **Marketplace** | Buscador global + filtros (categoría / tienda) + listado completo de productos. |
| `/marketplace?category=Moda&filterStore=store_aura` | Marketplace filtrado | Filtros persistentes en la URL. |
| `/<slug-tienda>` | **CatalogView (Tienda pública)** | Catálogo exclusivo de la tienda (por slug único). Esta URL es la que cada comercio comparte a sus clientes. |
| `/<slug-tienda>?product=<slug-producto>` | CatalogView + abrir ProductModal | Enlace directo a un producto. |
| `/merchant` | **MerchantDashboard** | Panel privado del comerciante dueño de store. |
| `/merchant?tab=products` | MerchantDashboard pestaña específica | `overview`, `profile`, `products`, `orders`, `reports`, `settings`, `subscription`. |
| `/superadmin` | **SaasAdminView** | Panel SuperAdmin (solo si `role=superadmin`). |
| `/superadmin?adminTab=users` | SuperAdmin pestaña | `users`, `stores`, `plans`, `banners`. |

---

## Vistas / Roles / Flujos principales

### 🧑‍💼 Visitante público (sin login)

1. Llega a `/` (Home) o al enlace directo de una tienda `/mi-tienda`.
2. Navega productos → abre ficha en modal → añade al carrito.
3. Abre **CartDrawer**: completa datos (nombre, teléfono, dirección, método de pago, delivery/retiro).
4. En **checkout** se:
   - Genera el número de pedido `PED-XXXX`.
   - Construye el mensaje WhatsApp personalizado según la plantilla de cada tienda.
   - Persiste el pedido asíncronamente en backend MySQL.
   - Dispara confeti y abre un modal de éxito + link `https://wa.me/...` pre-cargado.
   - El cliente pulsa "Enviar por WhatsApp" y completa la compra hablando directamente con el dueño.

### 🏪 Merchant (Dueño de tienda)

Se registra en 3 pasos (Titular → Tienda → PIN). Su cuenta queda `pending_approval` hasta que el SuperAdmin la aprueba.

Acciones en su panel `/merchant`:
- **Overview**: KPI de ventas, gráficos y últimos pedidos.
- **Profile**: Editar logo/banner, slogan, horarios, RRSS, datos de contacto (sube imágenes comprimidas a MinIO).
- **Products**: CRUD completo, variantes (talla/color), stock, destacados, subida foto.
- **Orders**: Historial pedidos por estado (pending_whatsapp / confirmed / preparing / delivered / cancelled). Cada estado tiene un botón "Enviar WhatsApp a cliente" con plantilla predefinida.
- **Reports**: Métricas exportables CSV.
- **Settings**: Delivery fee, umbral envío gratis, moneda (S/ PEN por defecto), instrucciones de pago y **plantilla personalizable de WhatsApp** con placeholders: `{numero_pedido}`, `{nombre_cliente}`, `{lista_productos}`, `{total}`, etc.
- **Subscription**: Upgrade entre tiers **Starter (Free, 20 productos) → Pro ($19/mes, 150 productos) → Business ($49/mes, ilimitado)**.

### 👨‍💼 SuperAdmin

Accede a `/superadmin` (solo `role === 'superadmin'`):
- **User ManagementTab**: Lista todos los merchants. Acciones rápidas: ✅ **Aprobar cuenta** (pasa a `active` y activa `store.is_active`), ⛔ **Suspender** (oculta la tienda del marketplace), asignar rol superadmin, resetear PIN, editar plan.
- **Banners ManagementTab**: Añadir/editar/ordenar banners promocionales del carrusel Home (`emerald/amber/indigo/rose/purple/dark`) con link a producto o tienda concreta.
- **Plans / Stores**: gestión complementaria.

---

## Integración con Backend FastAPI

Archivo: `src/services/api.ts` (base `/api`).

### Mapeo snake_case ↔ camelCase

El backend usa convenciones Python (`snake_case`), el frontend usa TypeScript (`camelCase`). Existen helpers `mapStoreFromBackend`, `mapProductFromBackend` y sus inversos para transformación transparente en cada request/response.

### Autenticación JWT

- Al hacer login `/auth/login` o registro `/auth/register`, el token se guarda en `localStorage.catalog_saas_jwt_token`.
- `getAuthHeader()` inyecta `Authorization: Bearer <token>` en cada llamada a endpoint privado.
- `getCurrentUser()` llama a `/auth/me` para validar token al montar la app; si falla borra el token.

### Endpoints consumidos

| API | UI asociada |
|-----|-------------|
| `GET /api/stores` (+ include_all si admin) | Home, Marketplace, Dropdown tiendas |
| `GET /api/stores/{slug}` | Vista Catálogo de una tienda |
| `PUT /api/stores/{id}` | Merchant ProfileTab / StoreSettingsTab |
| `GET /api/products?search=&store_ids=&category=&min_price=&max_price=&sort_by=` | Catálogo, Marketplace, filtros y buscador |
| `POST /api/products/{id}/visit` | Contador de vistas al abrir ficha producto |
| `POST /api/products` / `PUT` / `DELETE` | Merchant ProductsTab |
| `POST /api/orders` | Checkout Carrito → persistir pedido |
| `GET /api/orders/store/{id}` | Merchant OrdersTab |
| `PATCH /api/orders/{id}/status?status=` | Cambio de estado de pedido |
| `GET /api/banners` | Home PromoCarousel |
| `POST /api/uploads/image?folder=logos/products/banners` | Subida imágenes (comprime en cliente a WebP antes) |
| `POST /api/auth/register` | AuthModal 3 pasos → nuevo merchant pending_approval |
| `POST /api/auth/login` | AuthModal login email/DNI + PIN |
| `GET  /api/auth/me`, `PUT /api/auth/profile` | Perfil de usuario |
| `GET /api/auth/users` | SuperAdmin UserManagementTab |
| `PUT /api/auth/users/{id}/status` | Aprobar/suspender |
| `PUT /api/auth/users/{id}/role` | Cambio a superadmin |
| `DELETE /api/auth/users/{id}` | Eliminar usuario |

---

## Estado global (AppContext)

`AppContext.tsx` exporta el hook `useApp()` que expone:
- Datos vivos del backend: `stores`, `products`, `users`, `banners`, `orders`, `currentUser`, `currentStore`.
- UI state: `activeView`, `merchantTab`, `adminTab`, `viewingStoreCatalog`, `marketplaceCategoryFilter`, `marketplaceStoreFilter`.
- Cart state + acciones: `cart`, `cartDrawerOpen`, `addToCart`, `updateCartQuantity`, `removeFromCart`, `clearCart`, `submitOrderToWhatsApp`.
- Modales globales: `authModalOpen`, `authModalMode`, `selectedProductForModal`, `orderSuccessModalOpen`, `profileModal`, `pendingApprovalModal`.
- Acciones autenticadas: `login`, `logout`, `registerMerchantStore`, `updateCurrentUserProfile`, `approveUserAccount`, `suspendUserAccount`, `switchUserRole`, `updateUser`.
- Acciones CRUD Merchant: `addProduct`, `updateProduct`, `deleteProduct`, `toggleProductStock`, `updateStoreConfig`, `upgradeSubscription`.
- Acciones CRUD SuperAdmin: `addBanner`, `updateBanner`, `deleteBanner`, `toggleBannerActive`.
- Upload helper: `uploadImage(file, folder)` (comprime a WebP en cliente según carpeta → 400/1000/1400 px máximo + calidad 0.84).

---

## SaaS Plans (3 tiers)

Definidos en `src/data/initialData.ts`:

| Plan | Precio/mes | Productos max | Pedidos/mes | Destacado |
|------|------------|---------------|-------------|-----------|
| **Starter** (Emprendedor) | Gratis | 20 | 100 | Primeros pasos |
| **Pro** (Crecimiento) | $19 / $190 anual | 150 | 1.000 | ⭐ Recomendado |
| **Business** (Escala) | $49 / $490 anual | Ilimitado | 10.000 | Multi-admin + dominio |

---

## Customización visual

- **Tailwind v4** con alias `@` → `frontend_as/` (ver `vite.config.ts`).
- Cada tienda puede definir un `themeColor` (el verde esmeralda por defecto). El `<Navbar/>` y `CatalogHeader` respetan la paleta de la tienda activa.
- Formateo de moneda: utilidad `formatPrice` en `utils/whatsapp.ts` (locale `es-PE` para soles S/).

---

## Proxy / CORS en producción

Desarrollo: Vite proxea `/api` → `http://127.0.0.1:8000` automáticamente.

Producción recomendada:
1. Servir `dist/` desde el mismo origen que el backend (Nginx, Caddy, Cloudflare) para no necesitar CORS.
2. O: desplegar front en un dominio y back en otro. Configurar `CORS_ORIGINS` en el `.env` del backend y `VITE_API_BASE_URL=https://api.tudominio.pe` en el front.

---

## Troubleshooting comunes

- **404 al entrar a `/mi-slug-tienda` directamente al refrescar**: En producción el servidor (Netlify/Vercel/Nginx) debe tener un **rewrite** a `/index.html` (SPA fallback). De lo contrario la ruta del slug no se encuentra.
- **Imágenes no se ven (403 MinIO)**: Asegurarse de que el bucket tenga la policy `public-read` aplicada (el backend la crea al iniciarse en `minio_client._ensure_bucket`).
- **Login falla sin mensaje claro**: Abrir DevTools → Network → revisar respuesta de `/auth/login`. Si el PIN es "123456" o secuencias similares el backend lo rechaza por seguridad; registrarse con un PIN robusto.
- **WhatsApp no abre el mensaje**: `wa.me` a veces requiere que el número tenga el código de país correcto sin espacios (se limpia automáticamente en `buildWhatsAppLink`).
- **HMR lento en Windows**: Vite ya configura `watch` y `allowedHosts=true`; si tienes antivirus/firewall a veces hace falta añadir exclusión.
