import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CatalogHeader } from './CatalogHeader';
import { ProductCard } from './ProductCard';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  Search, 
  PackageX, 
  Sparkles, 
  Store, 
  ArrowLeft, 
  ArrowRight,
  ShoppingBag,
  MapPin,
  Clock,
  Truck,
  ExternalLink,
  Lock,
  CheckCircle2,
  ShieldAlert,
  MessageCircle,
  Globe
} from 'lucide-react';
import { getSubscriptionStatusInfo, buildReactivationWhatsAppLink } from '../../utils/subscriptionUtils';
import { DEFAULT_STORE_BANNER, DEFAULT_STORE_LOGO } from '../../data/initialData';

export const CatalogView: React.FC = () => {
  const { 
    stores, 
    users,
    currentStoreId, 
    currentStoreProducts, 
    currentStore, 
    products, 
    openRegisterModal, 
    currentUser,
    viewingStoreCatalog,
    openStoreCatalog,
    returnToStoresDirectory
  } = useApp();

  // Search filter for stores directory
  const [storeSearch, setStoreSearch] = useState('');
  const debouncedStoreSearch = useDebounce(storeSearch, 200);

  // Search & filter for products within the selected store catalog
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const getStoreProductCount = (storeId: string) => {
    return products.filter(p => p.storeId === storeId).length;
  };

  // Filter stores by search query (only active/approved and non-expired stores in public directory)
  const filteredStores = useMemo(() => {
    const activeStores = stores.filter(s => {
      if (s.isActive === false) return false;
      const owner = users.find(u => u.storeId === s.id && u.role === 'merchant');
      if (owner) {
        const sub = getSubscriptionStatusInfo(owner.subscription, owner.status);
        if (sub.isExpired || sub.isPendingApproval) return false;
      }
      return true;
    });
    if (!debouncedStoreSearch.trim()) return activeStores;
    const q = debouncedStoreSearch.toLowerCase();
    return activeStores.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.tagline && s.tagline.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  }, [stores, users, debouncedStoreSearch]);

  // Extract unique categories of the active store
  const categories = useMemo(() => {
    const set = new Set<string>();
    currentStoreProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [currentStoreProducts]);

  // Filter and sort products of the active store
  const filteredProducts = useMemo(() => {
    return currentStoreProducts.filter(product => {
      const query = debouncedSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      const matchesStock = !onlyInStock || product.inStock;

      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [currentStoreProducts, debouncedSearchQuery, selectedCategory, onlyInStock, sortBy]);

  // ==========================================
  // VISTA 1: DIRECTORIO DE TIENDAS EN CARDS
  // (Se muestra primero; entra a la tienda solo al hacer clic)
  // ==========================================
  if (!viewingStoreCatalog) {
    return (
      <div className="min-h-screen bg-neutral-50/70 pb-20">
        {/* Header Principal del Directorio */}
        <div className="bg-white border-b border-neutral-200 py-8 px-4 sm:px-6 lg:px-8 xl:px-12 shadow-xs">
          <div className="w-full space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2 border border-emerald-200">
                  <Store className="w-3.5 h-3.5" />
                  <span>Directorio de Negocios</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  Tiendas Disponibles ({stores.length})
                </h1>
              </div>
              {/* Botón para registrar tienda si no está logueado */}
              {!currentUser && (
                <button
                  onClick={openRegisterModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Publicar mi Tienda Gratis</span>
                </button>
              )}
            </div>

            {/* Buscador de tiendas */}
            <div className="pt-2 max-w-md">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar tienda por nombre, rubro o ciudad..."
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-colors"
                />
                {storeSearch && (
                  <button
                    onClick={() => setStoreSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cuadrícula de Cards de Tiendas */}
        <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-8">
          {filteredStores.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200 shadow-xs max-w-md mx-auto p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-neutral-900 text-sm">No se encontraron tiendas</h3>
              <p className="text-xs text-neutral-500">
                No hay coincidencias para "{storeSearch}". Intenta con otro término de búsqueda.
              </p>
              <button
                onClick={() => setStoreSearch('')}
                className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              >
                Ver todas las tiendas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredStores.map(store => {
                const count = getStoreProductCount(store.id);
                const isUserMerchant = currentUser?.role === 'merchant';
                const isOwnStore = isUserMerchant && currentUser?.storeId === store.id;

                return (
                  <div
                    key={store.id}
                    onClick={() => openStoreCatalog(store.id)}
                    className={`group relative flex flex-col bg-white rounded-3xl border transition-all duration-300 overflow-hidden h-full cursor-pointer ${
                      isOwnStore 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg' 
                        : 'border-neutral-200/90 hover:border-emerald-500/50 hover:shadow-xl'
                    }`}
                  >
                    {/* Banner de la tienda */}
                    <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-neutral-900">
                      <img
                        src={store.banner || DEFAULT_STORE_BANNER}
                        alt={store.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                      {/* Badge tipo de tienda (Física / Virtual) y badge de tienda propia */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        {isOwnStore && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Tu Tienda</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-xs">
                          {store.storeType === 'fisica' ? (
                            <>
                              <Store className="w-3.5 h-3.5 text-amber-400" />
                              <span>Tienda Física</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5 text-sky-400" />
                              <span>Tienda Virtual</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Contenido de la tienda */}
                    <div className="relative p-5 pt-0 flex-1 flex flex-col justify-between -mt-8">
                      <div>
                        {/* Logo en relieve */}
                        <div className="relative inline-block mb-3">
                          <div className={`w-16 h-16 rounded-2xl overflow-hidden bg-white p-1 shadow-md border-2 border-white ring-2 transition-all ${
                            isOwnStore ? 'ring-emerald-500' : 'ring-emerald-500/20 group-hover:ring-emerald-500/50'
                          }`}>
                            <img
                              src={store.logo || DEFAULT_STORE_LOGO}
                              alt={store.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Nombre y eslogan */}
                        <div className="space-y-1.5">
                          <h3 className={`text-base sm:text-lg font-black leading-snug transition-colors flex items-start justify-between gap-2 ${
                            isOwnStore ? 'text-emerald-700' : 'text-neutral-950 group-hover:text-emerald-600'
                          }`}>
                            <span className="break-words font-black tracking-tight">{store.name}</span>
                            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                          </h3>
                          <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed font-normal">
                            {store.tagline || store.description}
                          </p>
                        </div>

                        {/* Metadatos: Ubicación, Horario y Delivery */}
                        <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-[11px] text-neutral-600">
                          {store.address && (
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="truncate">{store.address}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              Envío: <strong>{store.currencySymbol}{store.deliveryFee}</strong> (Gratis desde {store.currencySymbol}{store.freeDeliveryThreshold})
                            </span>
                          </div>

                          {store.schedule && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="truncate">{store.schedule}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón para entrar a la tienda */}
                      <div className="mt-5 pt-3 border-t border-neutral-100">
                        {isOwnStore ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openStoreCatalog(store.id);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Ver Mi Tienda</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openStoreCatalog(store.id);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 group-hover:bg-emerald-600 text-white text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Entrar a la Tienda</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  const storeOwner = users.find(u => u.storeId === currentStore.id && u.role === 'merchant');
  const storeOwnerSubInfo = storeOwner ? getSubscriptionStatusInfo(storeOwner.subscription, storeOwner.status) : null;
  const isStoreExpired = storeOwnerSubInfo?.isExpired ?? false;
  const isStorePending = (currentStore.isActive === false && !isStoreExpired) || (storeOwnerSubInfo?.isPendingApproval ?? false);
  const isViewerPrivileged = currentUser?.role === 'superadmin' || (currentUser?.storeId && currentUser.storeId === currentStore.id);

  // 1. Si la tienda está vencida y quien mira no es SuperAdmin ni el dueño: pantalla de tienda no disponible
  if (isStoreExpired && !isViewerPrivileged) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 text-center shadow-lg space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-black uppercase tracking-wide">
            <span>Tienda No Disponible</span>
          </div>
          <h2 className="text-xl font-black text-neutral-900">
            Catálogo en Pausa Temporal
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            La tienda <strong>{currentStore.name}</strong> se encuentra temporalmente inactiva por renovación de suscripción y mantenimiento de catálogo.
          </p>
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 font-medium text-left space-y-1">
            <p className="font-bold">¿Eres el comerciante de esta tienda?</p>
            <p className="text-[11px] text-rose-800">
              Para reactivar tu tienda y volver a recibir pedidos, solicita tu renovación vía WhatsApp al <strong>+51 325 763 903</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={buildReactivationWhatsAppLink(
                currentStore.name,
                storeOwner?.name || '',
                storeOwner?.email || '',
                storeOwner?.subscription?.planId || 'starter',
                '51325763903'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Reactivar Tienda por WhatsApp</span>
            </a>
            <button
              onClick={returnToStoresDirectory}
              className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Explorar otras tiendas activas
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Si la tienda no está autorizada o está pendiente y quien mira no es SuperAdmin ni el dueño
  if (isStorePending && !isViewerPrivileged) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">
            Tienda en Proceso de Autorización
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            La tienda <strong>{currentStore.name}</strong> ha sido registrada pero aún no cuenta con la autorización activa de <strong>SuperAdministrador</strong> para operar públicamente.
          </p>
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium text-left space-y-1">
            <p className="font-bold">¿Eres el comerciante de esta tienda?</p>
            <p className="text-[11px] text-amber-800">
              Solicita la activación de tu catálogo contactando al SuperAdministrador vía WhatsApp al <strong>+51 325 763 903</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="https://wa.me/51325763903?text=Hola%20SuperAdmin,%20deseo%20autorizar%20mi%20tienda%20en%20Atalaya%20Store"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Solicitar Autorización por WhatsApp</span>
            </a>
            <button
              onClick={returnToStoresDirectory}
              className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Explorar otras tiendas activas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-20">
      {/* Barra superior para volver al directorio de tiendas */}
      <div className="bg-white border-b border-neutral-200/90 py-3 px-4 sm:px-6 lg:px-8 xl:px-12 shadow-2xs sticky top-16 z-30">
        <div className="w-full flex items-center justify-between gap-4">
          <button
            onClick={returnToStoresDirectory}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-600" />
            <span>Volver a Tiendas Disponibles</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium hidden sm:inline">Tienda activa:</span>
            <span className="text-xs font-black text-emerald-900 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
              {currentStore.name}
            </span>
          </div>
        </div>
      </div>

      {/* Cabecera Oficial de la Tienda */}
      <CatalogHeader />

      {/* Main de productos de la tienda */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-8">
        {/* Banner promocional para comerciantes (solo visible para visitantes sin sesión iniciada) */}
        {!currentUser && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-neutral-900 to-neutral-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">
                  ¿Quieres tener tu propio catálogo digital por WhatsApp?
                </h2>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Crea tu catálogo en minutos, comparte tu link y recibe pedidos organizados directo a tu WhatsApp.
                </p>
              </div>
            </div>

            <button
              onClick={openRegisterModal}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              Registrar mi Tienda Gratis →
            </button>
          </div>
        )}

        {/* Buscador, Filtros y Categorías de la Tienda (Sticky en Scroll) */}
        <div className="sticky top-16 z-20 bg-neutral-50/95 backdrop-blur-md pt-3 pb-3 space-y-3 mb-6 border-b border-neutral-200/80 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={`Buscar productos en ${currentStore.name}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Sort & Availability Toggles */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-700 cursor-pointer select-none shadow-2xs">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={e => setOnlyInStock(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Solo disponibles</span>
              </label>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
                >
                  <option value="featured">Destacados primero</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
              }`}
            >
              Todos los productos ({currentStoreProducts.length})
            </button>
            {categories.map(cat => {
              const count = currentStoreProducts.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Productos Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200/80 p-8 shadow-xs max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <PackageX className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-neutral-900 text-base mb-1">
              No se encontraron productos
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              {searchQuery || selectedCategory !== 'all' || onlyInStock
                ? 'Intenta modificando tus términos de búsqueda o filtros seleccionados.'
                : 'Esta tienda aún no ha publicado productos en su catálogo.'}
            </p>
            {(searchQuery || selectedCategory !== 'all' || onlyInStock) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setOnlyInStock(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
