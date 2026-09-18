import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketplaceProductCard } from '../Home/MarketplaceProductCard';
import { HomeFiltersSidebar, FilterState } from '../Home/HomeFiltersSidebar';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  Flame, 
  Store, 
  PackageX,
  X,
  Tag,
  ShoppingBag
} from 'lucide-react';
import { getSubscriptionStatusInfo } from '../../utils/subscriptionUtils';

export const MarketplaceDashboard: React.FC = () => {
  const { 
    products, 
    stores, 
    users,
    currentUser,
    marketplaceCategoryFilter, 
    setMarketplaceCategoryFilter,
    marketplaceStoreFilter,
    setMarketplaceStoreFilter,
    openRegisterModal
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [sortBy, setSortBy] = useState<'views' | 'price-asc' | 'price-desc' | 'recent'>('views');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize filters with any global pre-selections
  const [filters, setFilters] = useState<FilterState>({
    minPrice: '',
    maxPrice: '',
    selectedStoreIds: marketplaceStoreFilter,
    selectedCategory: marketplaceCategoryFilter,
    onlyInStock: false,
    onlyOnSale: false
  });

  // Keep filters in sync if pre-selections change
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      selectedCategory: marketplaceCategoryFilter,
      selectedStoreIds: marketplaceStoreFilter.length > 0 ? marketplaceStoreFilter : prev.selectedStoreIds
    }));
  }, [marketplaceCategoryFilter, marketplaceStoreFilter]);

  // Extract category counts across all products
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [products]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      minPrice: '',
      maxPrice: '',
      selectedStoreIds: [],
      selectedCategory: 'all',
      onlyInStock: false,
      onlyOnSale: false
    });
    setMarketplaceCategoryFilter('all');
    setMarketplaceStoreFilter([]);
    setSortBy('views');
  };

  // Filtrar tiendas activas, aprobadas y no vencidas
  const activeStores = useMemo(() => {
    return stores.filter(s => {
      if (s.isActive === false) return false;
      const owner = users.find(u => u.storeId === s.id && u.role === 'merchant');
      if (owner) {
        const sub = getSubscriptionStatusInfo(owner.subscription, owner.status);
        if (sub.isExpired || sub.isPendingApproval) return false;
      }
      return true;
    });
  }, [stores, users]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const query = debouncedSearchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query);

        const matchesStore =
          filters.selectedStoreIds.length === 0 ||
          filters.selectedStoreIds.includes(product.storeId);

        const matchesCategory =
          filters.selectedCategory === 'all' ||
          product.category === filters.selectedCategory;

        const matchesMinPrice =
          filters.minPrice === '' || product.price >= filters.minPrice;
        const matchesMaxPrice =
          filters.maxPrice === '' || product.price <= filters.maxPrice;

        // Excluir productos de tiendas no autorizadas, inactivas o con suscripción vencida
        const productStore = activeStores.find(s => s.id === product.storeId);
        if (!productStore) return false;

        const matchesStock = !filters.onlyInStock || product.inStock;

        const matchesSale =
          !filters.onlyOnSale ||
          (product.compareAtPrice !== undefined && product.compareAtPrice > product.price);

        return (
          matchesSearch &&
          matchesStore &&
          matchesCategory &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesStock &&
          matchesSale
        );
      })
      .sort((a, b) => {
        if (sortBy === 'views') {
          return (b.viewsCount || 0) - (a.viewsCount || 0);
        }
        if (sortBy === 'price-asc') {
          return a.price - b.price;
        }
        if (sortBy === 'price-desc') {
          return b.price - a.price;
        }
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [products, searchQuery, filters, sortBy]);

  const activeFiltersCount =
    (filters.minPrice !== '' ? 1 : 0) +
    (filters.maxPrice !== '' ? 1 : 0) +
    filters.selectedStoreIds.length +
    (filters.selectedCategory !== 'all' ? 1 : 0) +
    (filters.onlyInStock ? 1 : 0) +
    (filters.onlyOnSale ? 1 : 0);

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-20">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950 text-white py-10 px-4 sm:px-6 lg:px-8 xl:px-12 border-b border-neutral-800">
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                <Store className="w-3.5 h-3.5" />
                <span>Catálogo Multitienda Central</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Explora productos de todas las <span className="text-emerald-400">tiendas aliadas</span>
              </h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 text-center">
                <div className="text-xs text-neutral-400 font-medium">Tiendas</div>
                <div className="text-lg font-black text-white">{stores.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 text-center">
                <div className="text-xs text-neutral-400 font-medium">Productos</div>
                <div className="text-lg font-black text-emerald-400">{products.length}</div>
              </div>
            </div>
          </div>

          {/* Prominent Search Bar */}
          <div className="pt-2">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-black/15 p-1.5 border border-neutral-200">
              <Search className="w-5 h-5 text-neutral-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por producto, marca, categoría o descripción..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-700 font-bold cursor-pointer mr-1"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-8">
        {/* Active Filters Pill Bar */}
        {activeFiltersCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <span className="text-xs font-bold text-neutral-500 mr-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Filtros activos ({activeFiltersCount}):
            </span>

            {filters.selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <span>Categoría: {filters.selectedCategory}</span>
                <button 
                  onClick={() => {
                    setFilters(prev => ({ ...prev, selectedCategory: 'all' }));
                    setMarketplaceCategoryFilter('all');
                  }}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.selectedStoreIds.map(storeId => {
              const st = stores.find(s => s.id === storeId);
              return (
                <span key={storeId} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                  <span>Tienda: {st?.name || storeId}</span>
                  <button 
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        selectedStoreIds: prev.selectedStoreIds.filter(id => id !== storeId)
                      }));
                      setMarketplaceStoreFilter(marketplaceStoreFilter.filter(id => id !== storeId));
                    }}
                    className="hover:text-blue-950 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}

            {(filters.minPrice !== '' || filters.maxPrice !== '') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold">
                <span>
                  Precio: {filters.minPrice !== '' ? `S/ ${filters.minPrice}` : 'S/ 0'} - {filters.maxPrice !== '' ? `S/ ${filters.maxPrice}` : 'Sin tope'}
                </span>
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))}
                  className="hover:text-neutral-950 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.onlyInStock && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <span>Solo en stock</span>
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, onlyInStock: false }))}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.onlyOnSale && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                <span>En oferta</span>
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, onlyOnSale: false }))}
                  className="hover:text-rose-950 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
            >
              Limpiar todos
            </button>
          </div>
        )}

        {/* 2-Columns Layout: Sidebar Filters + Products Feed */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative min-h-[800px]">
          {/* Sidebar Filters */}
          <HomeFiltersSidebar
            filters={filters}
            setFilters={setFilters}
            stores={activeStores}
            categories={categoryCounts}
            totalProductsCount={products.length}
            filteredCount={filteredProducts.length}
            onReset={handleResetFilters}
            isMobileOpen={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
          />

          {/* Products Feed Section */}
          <div className="flex-1 w-full space-y-4 sm:space-y-5">
            {/* Toolbar: Results Count, Mobile filter trigger & Sort selector */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-bold text-neutral-900">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-bold hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Sorting Options */}
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-[calc(100vw-130px)] sm:max-w-none">
                  <button
                    onClick={() => setSortBy('views')}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      sortBy === 'views'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="Ordenar por mayor número de visitas"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Más visitados</span>
                  </button>

                  <button
                    onClick={() => setSortBy('price-asc')}
                    className={`shrink-0 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      sortBy === 'price-asc'
                        ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Menor precio
                  </button>

                  <button
                    onClick={() => setSortBy('price-desc')}
                    className={`shrink-0 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      sortBy === 'price-desc'
                        ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Mayor precio
                  </button>

                  <button
                    onClick={() => setSortBy('recent')}
                    className={`shrink-0 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      sortBy === 'recent'
                        ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Novedades
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
                {filteredProducts.map(product => {
                  const store = stores.find(s => s.id === product.storeId);
                  return (
                    <MarketplaceProductCard
                      key={product.id}
                      product={product}
                      store={store}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-neutral-300">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-3">
                  <PackageX className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  No encontramos productos con estos filtros
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Prueba modificando el rango de precio, deseleccionando tiendas o cambiando la categoría.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Restablecer todos los filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Callout para invitar a crear tienda (solo visible para visitantes sin sesión iniciada) */}
        {!currentUser && (
          <section className="mt-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950 text-white shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold mb-1 border border-emerald-400/30">
                  Cierre directo por WhatsApp
                </div>
                <h3 className="text-lg sm:text-xl font-black">
                  ¿Deseas agregar tu catálogo de productos a esta red?
                </h3>
                <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                  Crea tu tienda digital con inventario, variantes y pedidos automáticos sin pagar comisiones por venta.
                </p>
              </div>
            </div>

            <button
              onClick={openRegisterModal}
              className="shrink-0 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer whitespace-nowrap"
            >
              Registrar mi Tienda Gratis →
            </button>
          </section>
        )}
      </main>
    </div>
  );
};
