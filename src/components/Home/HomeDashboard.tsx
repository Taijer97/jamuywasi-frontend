import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryCard } from './CategoryCard';
import { StoreCard } from './StoreCard';
import { PromoCarousel } from './PromoCarousel';
import { 
  Sparkles, 
  Store, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getSubscriptionStatusInfo } from '../../utils/subscriptionUtils';

export const HomeDashboard: React.FC = () => {
  const { 
    products, 
    stores, 
    users,
    currentUser,
    openRegisterModal, 
    setActiveView, 
    navigateToMarketplaceWithCategory 
  } = useApp();

  // Scroll Snap helpers
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const storesScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Extract categories with counts
  const categoryCounts = React.useMemo(() => {
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

  // Tiendas activas, aprobadas y con suscripción al día
  const activeStores = React.useMemo(() => {
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

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-12">
      {/* 1. Carrusel de Propaganda (Banners SuperAdmin) con Scroll Snap */}
      <PromoCarousel />

      {/* Main Container */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-1 sm:pt-2 space-y-4 sm:space-y-6">
        {/* 2. Explorar por Categorías con Scroll Snap */}
        <section
          id="categories-section"
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-neutral-200/90 scroll-mt-28"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Explorar por Categorías
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Selecciona una categoría para ver todos los productos correspondientes en el catálogo multitienda
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveView('marketplace');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hidden sm:inline-flex text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer mr-2"
              >
                Ver todo el catálogo →
              </button>

              {/* Scroll Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollContainer(categoriesScrollRef, 'left')}
                  className="w-8 h-8 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer shadow-2xs"
                  aria-label="Desplazar categorías hacia la izquierda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollContainer(categoriesScrollRef, 'right')}
                  className="w-8 h-8 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer shadow-2xs"
                  aria-label="Desplazar categorías hacia la derecha"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Cards Horizontal Container with Scroll Snap */}
          <div
            ref={categoriesScrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-1 pt-1"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {categoryCounts.map(cat => (
              <div
                key={cat.name}
                className="shrink-0 snap-start w-[145px] sm:w-[175px] md:w-[205px]"
              >
                <CategoryCard
                  name={cat.name}
                  count={cat.count}
                  isSelected={false}
                  onClick={() => navigateToMarketplaceWithCategory(cat.name)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 3. Tiendas Disponibles */}
        <section
          id="stores-section"
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-neutral-200/90 scroll-mt-28"
        >
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-1 border border-emerald-200/60">
                <Store className="w-3 h-3" />
                <span>Marcas y Negocios</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                Tiendas Disponibles en la Plataforma
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Visita el catálogo exclusivo de cada tienda o compra directamente a través de su canal de WhatsApp
              </p>
            </div>

            {/* Scroll controls for stores */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollContainer(storesScrollRef, 'left')}
                className="w-8 h-8 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer shadow-2xs"
                aria-label="Desplazar tiendas hacia la izquierda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer(storesScrollRef, 'right')}
                className="w-8 h-8 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer shadow-2xs"
                aria-label="Desplazar tiendas hacia la derecha"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stores Horizontal Scroll Snap Container on mobile/tablet and Grid on large */}
          <div 
            ref={storesScrollRef}
            className="flex lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none no-scrollbar pb-1 pt-1"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {activeStores.map(store => {
              const storeProductsCount = products.filter(p => p.storeId === store.id).length;
              return (
                <div 
                  key={store.id} 
                  className="shrink-0 snap-start w-[280px] sm:w-[320px] lg:w-auto"
                >
                  <StoreCard store={store} productCount={storeProductsCount} />
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Promotional Callout: Vende con nosotros (solo visible para visitantes sin sesión) */}
        {!currentUser && (
          <section
            id="sell-section"
            className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950 text-white shadow-lg border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 scroll-mt-28"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold mb-1 border border-emerald-400/30">
                  ¿Tienes una marca o negocio?
                </div>
                <h3 className="text-lg sm:text-xl font-black">
                  Publica tu catálogo digital y vende directamente por WhatsApp
                </h3>
                <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                  Crea tu tienda en minutos, añade variantes, gestiona stock y recibe los pedidos organizados con cálculo de delivery al instante.
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
