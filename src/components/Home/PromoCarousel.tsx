import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PromotionalBanner } from '../../types';
import { DEFAULT_STORE_BANNER, DEFAULT_STORE_LOGO } from '../../data/initialData';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  Store as StoreIcon
} from 'lucide-react';

const GRADIENT_THEMES: Record<string, { bg: string; badge: string; btn: string }> = {
  emerald: {
    bg: 'from-emerald-950 via-emerald-900 to-neutral-950 border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    btn: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
  },
  indigo: {
    bg: 'from-indigo-950 via-indigo-900 to-neutral-950 border-indigo-500/30',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    btn: 'bg-indigo-500 hover:bg-indigo-400 text-white'
  },
  amber: {
    bg: 'from-amber-950 via-neutral-900 to-neutral-950 border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    btn: 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
  },
  rose: {
    bg: 'from-rose-950 via-neutral-900 to-neutral-950 border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    btn: 'bg-rose-500 hover:bg-rose-400 text-white'
  },
  purple: {
    bg: 'from-purple-950 via-purple-900 to-neutral-950 border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    btn: 'bg-purple-500 hover:bg-purple-400 text-white'
  },
  dark: {
    bg: 'from-neutral-950 via-neutral-900 to-neutral-950 border-neutral-700/50',
    badge: 'bg-white/10 text-white border-white/20',
    btn: 'bg-white hover:bg-neutral-100 text-neutral-950'
  }
};

export const PromoCarousel: React.FC = () => {
  const { banners, stores, products, navigateToStoreProduct, openStoreCatalog } = useApp();

  const activeBanners = banners
    .filter(b => b.isActive)
    .sort((a, b) => a.order - b.order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to slide by index
  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: index * slideWidth,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  // Auto scroll effect every 5.5 seconds
  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % activeBanners.length;
      scrollToIndex(nextIndex);
    }, 5500);

    return () => clearInterval(interval);
  }, [activeBanners.length, isHovered, currentIndex]);

  // Handle manual scroll to update active dot index
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    if (slideWidth === 0) return;
    const newIndex = Math.round(container.scrollLeft / slideWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < activeBanners.length) {
      setCurrentIndex(newIndex);
    }
  };

  if (activeBanners.length === 0) {
    return null;
  }

  const handleActionClick = (banner: PromotionalBanner) => {
    const product = products.find(p => p.id === banner.productId);
    if (banner.productId && banner.storeId && product) {
      navigateToStoreProduct(banner.storeId, product);
    } else if (banner.storeId) {
      openStoreCatalog(banner.storeId);
    }
  };

  const handlePrev = () => {
    const prevIndex = currentIndex === 0 ? activeBanners.length - 1 : currentIndex - 1;
    scrollToIndex(prevIndex);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % activeBanners.length;
    scrollToIndex(nextIndex);
  };

  return (
    <div
      id="promo-section"
      className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 mb-3 sm:mb-4 pt-2 sm:pt-3 scroll-mt-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative group">
        {/* Scroll Snap Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar rounded-3xl shadow-xl border border-neutral-800/80 bg-neutral-950"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {activeBanners.map(banner => {
            const theme = GRADIENT_THEMES[banner.gradientTheme] || GRADIENT_THEMES.emerald;
            const store = stores.find(s => s.id === banner.storeId);
            const product = products.find(p => p.id === banner.productId);
            const hasTitle = Boolean(banner.title && banner.title.trim());
            const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim());
            const hasBadge = Boolean(banner.badge && banner.badge.trim());
            const hasStore = Boolean(store);
            const hasAnyText = hasTitle || hasSubtitle || hasBadge || hasStore;

            return (
              <div
                key={banner.id}
                onClick={() => handleActionClick(banner)}
                className="w-full shrink-0 snap-center relative overflow-hidden min-h-[300px] sm:min-h-[380px] md:min-h-[440px] lg:min-h-[480px] flex items-end cursor-pointer group/slide select-none"
              >
                {/* 1. Imagen de fondo completa a tamaño total */}
                <img
                  src={banner.imageUrl || DEFAULT_STORE_BANNER}
                  alt={banner.title || 'Propaganda promocional'}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover/slide:scale-105 transition-transform duration-700 ease-out"
                />

                {/* 2. Capa de oscurecimiento / gradiente cinemático para legibilidad y elegancia */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 pointer-events-none" />
                {hasAnyText && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none hidden md:block" />
                )}

                {/* 3. Badge superior flotante (Opcional) */}
                {(hasBadge || hasStore || product?.compareAtPrice) && (
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
                    {hasBadge && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-md ${theme.badge}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{banner.badge}</span>
                      </span>
                    )}

                    {hasStore && store && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white border border-white/20 shadow-md">
                        <img
                          src={store.logo || DEFAULT_STORE_LOGO}
                          alt={store.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="font-semibold">{store.name}</span>
                      </div>
                    )}

                    {product?.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-md">
                        OFERTA ESPECIAL
                      </span>
                    )}
                  </div>
                )}

                {/* 4. Contenido inferior del Banner: Textos opcionales + Botón Primordial */}
                <div className="relative z-10 w-full p-5 sm:p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-6">
                  {/* Textos Opcionales */}
                  <div className="space-y-1.5 sm:space-y-2 max-w-2xl text-left">
                    {hasTitle && (
                      <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                        {banner.title}
                      </h2>
                    )}

                    {hasSubtitle && (
                      <p className="text-xs sm:text-sm md:text-base text-neutral-200 leading-relaxed drop-shadow-sm max-w-xl">
                        {banner.subtitle}
                      </p>
                    )}

                    {product && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-extrabold text-emerald-300 shadow-sm">
                          <span>{product.name}</span>
                          <span>•</span>
                          <span>Desde {store?.currencySymbol || 'S/'} {product.price.toFixed(2)}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botón Primordial de Redirección (Siempre presente y llamativo) */}
                  <div className="shrink-0 self-start sm:self-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(banner);
                      }}
                      className={`inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95 border border-white/20 ${theme.btn}`}
                    >
                      <span>{banner.buttonText || 'Ver Promoción'}</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Previous / Next Scroll Controls */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Anuncio anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-xl active:scale-95 hover:scale-105"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Siguiente anuncio"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-xl active:scale-95 hover:scale-105"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Pagination Dots with Snap Indicator */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToIndex(idx);
                }}
                aria-label={`Ir al anuncio ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 h-2 bg-emerald-400 shadow-md'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
