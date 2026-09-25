import React from 'react';
import { Product, StoreConfig } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Eye, 
  Sparkles, 
  Store, 
  ArrowUpRight, 
  Flame,
  Check
} from 'lucide-react';
import { formatPrice } from '../../utils/whatsapp';
import { DEFAULT_STORE_LOGO, DEFAULT_PRODUCT_IMAGE } from '../../data/initialData';
import { thumbUrl, fallbackToOriginal } from '../../utils/imageUrls';

interface MarketplaceProductCardProps {
  product: Product;
  store?: StoreConfig;
}

export const MarketplaceProductCard: React.FC<MarketplaceProductCardProps> = ({
  product,
  store
}) => {
  const { navigateToStoreProduct } = useApp();

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const views = product.viewsCount || 0;
  const isHighInterest = views >= 1500;

  const handleClick = () => {
    if (store) {
      navigateToStoreProduct(store.id, product);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col bg-white rounded-2xl border border-neutral-200/90 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Product Image Area (Regularized & Contained) */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50/70 p-3 sm:p-4 flex items-center justify-center border-b border-neutral-100">
        <img
          src={thumbUrl(product.imageUrl) || DEFAULT_PRODUCT_IMAGE}
          onError={fallbackToOriginal(product.imageUrl)}
          decoding="async"
          alt={product.name}
          className="max-w-full max-h-full w-auto h-auto object-contain object-center rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />

        {/* Store badge overlay (top-left) */}
        {store && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10">
            <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-white/95 backdrop-blur-md shadow-xs border border-neutral-200/60 max-w-[110px] sm:max-w-[170px]">
              <img loading="lazy" decoding="async"
                src={store.logo || DEFAULT_STORE_LOGO}
                alt={store.name}
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full object-cover shrink-0"
              />
              <span className="text-[9px] sm:text-[10px] font-bold text-neutral-800 truncate">
                {store.name}
              </span>
            </div>
          </div>
        )}

        {/* Right tags: Visits / High interest & Discount */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 flex flex-col gap-1 items-end">
          {hasDiscount && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-rose-500 text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}

          {isHighInterest ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-amber-400 text-neutral-900 shadow-xs flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 fill-red-600" />
              <span className="hidden xs:inline sm:inline">Top Visitas</span>
              <span className="xs:hidden sm:hidden">Top</span>
            </span>
          ) : (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
              <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{views.toLocaleString()}</span>
            </span>
          )}
        </div>

        {/* Out of Stock Mask */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex items-center justify-center p-2 text-center">
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-neutral-900 text-white">
              Agotado
            </span>
          </div>
        )}

        {/* Hover Action prompt */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex justify-center z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-bold shadow-md transform group-hover:translate-y-0 translate-y-1 transition-transform">
            <span>Ver en tienda</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </span>
        </div>
      </div>

      {/* Card Info Area */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-neutral-500">
            <span className="text-emerald-700 uppercase tracking-wider font-bold truncate max-w-[90px] sm:max-w-none">
              {product.category}
            </span>
            <span className="hidden xs:flex sm:flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-600 font-medium shrink-0">
              <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-500" />
              {views.toLocaleString()}
            </span>
          </div>

          <h3 className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed hidden sm:block">
            {product.description}
          </p>
        </div>

        {/* Price and Footer Button */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-neutral-100 flex items-center justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-xs sm:text-base font-extrabold text-neutral-900">
                {store?.currencySymbol || 'S/'} {product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                  {store?.currencySymbol || 'S/'} {product.compareAtPrice!.toFixed(2)}
                </span>
              )}
            </div>
            {store && (
              <span className="text-[9px] sm:text-[10px] text-neutral-500 truncate max-w-[90px] sm:max-w-[130px]">
                {store.name}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="shrink-0 flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white transition-colors text-[11px] sm:text-xs font-bold cursor-pointer"
          >
            <span className="hidden sm:inline">Ir a Tienda</span>
            <span className="sm:hidden">Ver</span>
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
