import React from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, Sparkles, Check, Eye } from 'lucide-react';
import { formatPrice } from '../../utils/whatsapp';
import { DEFAULT_PRODUCT_IMAGE } from '../../data/initialData';
import { thumbUrl, fallbackToOriginal } from '../../utils/imageUrls';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { currentStore, addToCart, setSelectedProductForModal } = useApp();

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const hasVariants = product.variants && product.variants.length > 0;
  const hasVariantPricing = product.variants?.some(v =>
    v.options?.some(opt => typeof opt !== 'string' && typeof opt.price === 'number' && opt.price > 0 && opt.price !== product.price)
  );

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) {
      setSelectedProductForModal(product);
    } else {
      addToCart(product, 1);
    }
  };

  return (
    <div
      onClick={() => setSelectedProductForModal(product)}
      className="group relative flex flex-col bg-white rounded-2xl border border-neutral-200/80 hover:border-neutral-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Image container (Regularized & Contained) */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50/70 p-3 sm:p-4 flex items-center justify-center border-b border-neutral-100">
        <img
          src={thumbUrl(product.imageUrl) || DEFAULT_PRODUCT_IMAGE}
          onError={fallbackToOriginal(product.imageUrl)}
          decoding="async"
          alt={product.name}
          className="max-w-full max-h-full w-auto h-auto object-contain object-center rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-neutral-900 shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Destacado
            </span>
          )}
        </div>

        {/* Stock status indicator */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 text-white">
              Agotado
            </span>
          </div>
        )}

        {/* Quick View Button on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs text-xs font-semibold text-neutral-800 shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            Ver detalles
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            {product.category}
          </span>
          <h3 className="mt-1 text-sm font-bold text-neutral-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Variants preview chips */}
          {hasVariants && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.variants.map((v, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded font-medium"
                >
                  {v.name}: {v.options.length} opciones
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              {hasVariantPricing && (
                <span className="text-[11px] font-bold text-neutral-500">Desde</span>
              )}
              <span className="text-base font-extrabold text-neutral-900">
                {formatPrice(product.price, currentStore.currency, currentStore.currencySymbol)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(product.compareAtPrice!, currentStore.currency, currentStore.currencySymbol)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Cierre en WhatsApp</span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleActionClick}
            disabled={!product.inStock}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              !product.inStock
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : hasVariants
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{hasVariants ? 'Opciones' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
