import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Minus, ShoppingBag, Check, ShieldCheck, Share2 } from 'lucide-react';
import {
  formatPrice,
  getProductEffectivePrice,
  findMatchingCombination,
  isOptionAvailableInCombinations,
  findCompatibleSelectionForOption
} from '../../utils/whatsapp';
import { DEFAULT_STORE_LOGO, DEFAULT_PRODUCT_IMAGE } from '../../data/initialData';

export const ProductModal: React.FC = () => {
  const {
    selectedProductForModal,
    setSelectedProductForModal,
    currentStore,
    stores,
    addToCart
  } = useApp();

  const product = selectedProductForModal;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Smooth image transition states
  const [displayedImage, setDisplayedImage] = useState<string>(DEFAULT_PRODUCT_IMAGE);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopyProductLink = () => {
    if (!product) return;
    const storeSlugOrId = currentStore.slug || product.storeId || currentStore.id;
    const productSlugOrId = product.slug || product.id;
    const productUrl = `${window.location.origin}${window.location.pathname}?view=catalog&store=${storeSlugOrId}&product=${productSlugOrId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(productUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Image target that should be displayed
  const targetImage = activeImage || product?.imageUrl || DEFAULT_PRODUCT_IMAGE;

  // Trigger smooth crossfade whenever the target image changes
  useEffect(() => {
    if (product && targetImage && targetImage !== displayedImage) {
      setPreviousImage(displayedImage);
      setDisplayedImage(targetImage);
      setIsImageTransitioning(true);

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = setTimeout(() => {
        setIsImageTransitioning(false);
        setPreviousImage(null);
      }, 400);
    }
  }, [targetImage, displayedImage, product]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Initialize selected variants with first available variant that has an image or first option
  useEffect(() => {
    if (product) {
      let initialImage: string | null = null;
      let initialSelection: Record<string, string> = {};

      // 1. If product has combinations matrix
      if (product.combinations && product.combinations.length > 0) {
        // Prioritize in-stock combinations
        const inStockCombs = product.combinations.filter(c => c.inStock);
        const candidates = inStockCombs.length > 0 ? inStockCombs : product.combinations;

        // Try to find candidate combination that has an image (combination.imageUrl OR option.imageUrl)
        const chosenComb = candidates.find(c => {
          if (c.imageUrl) return true;
          if (product.variants) {
            for (const [vName, vVal] of Object.entries(c.options)) {
              const vGroup = product.variants.find(v => v.name === vName);
              const opt = vGroup?.options?.find(o => (typeof o === 'string' ? o : o.name) === vVal);
              if (opt && typeof opt !== 'string' && opt.imageUrl) return true;
            }
          }
          return false;
        }) || candidates[0];

        if (chosenComb) {
          initialSelection = { ...chosenComb.options };
          if (chosenComb.imageUrl) {
            initialImage = chosenComb.imageUrl;
          } else if (product.variants) {
            for (const [vName, vVal] of Object.entries(chosenComb.options)) {
              const vGroup = product.variants.find(v => v.name === vName);
              const opt = vGroup?.options?.find(o => (typeof o === 'string' ? o : o.name) === vVal);
              if (opt && typeof opt !== 'string' && opt.imageUrl) {
                initialImage = opt.imageUrl;
                break;
              }
            }
          }
        }
      }
      // 2. If product has simple variants
      else if (product.variants && product.variants.length > 0) {
        // Default each variant group to its first option
        product.variants.forEach(v => {
          if (v.options && v.options.length > 0) {
            const firstOpt = v.options[0];
            initialSelection[v.name] = typeof firstOpt === 'string' ? firstOpt : firstOpt.name;
          }
        });

        // Search for the first variant option that has an image
        let foundOptImage: string | null = null;
        for (const v of product.variants) {
          for (const opt of v.options || []) {
            if (typeof opt !== 'string' && opt.imageUrl) {
              foundOptImage = opt.imageUrl;
              initialSelection[v.name] = opt.name;
              break;
            }
          }
          if (foundOptImage) break;
        }

        if (foundOptImage) {
          initialImage = foundOptImage;
        }
      }

      // If no variant image found, fallback to product primary image
      if (!initialImage) {
        initialImage = product.imageUrl || null;
      }

      setSelectedVariants(initialSelection);
      setActiveImage(initialImage);
      setDisplayedImage(initialImage || DEFAULT_PRODUCT_IMAGE);
      setPreviousImage(null);
      setIsImageTransitioning(false);
      setQuantity(1);
      setNotes('');
    } else {
      setSelectedVariants({});
      setActiveImage(null);
      setDisplayedImage(DEFAULT_PRODUCT_IMAGE);
      setPreviousImage(null);
      setIsImageTransitioning(false);
      setQuantity(1);
      setNotes('');
    }
  }, [product]);

  if (!product) return null;

  const handleSelectVariant = (variantName: string, optionName: string, optionImage?: string) => {
    if (product.combinations && product.combinations.length > 0) {
      const isDirectlyAvailable = isOptionAvailableInCombinations(
        product.combinations,
        variantName,
        optionName,
        selectedVariants
      );

      let newSelection = { ...selectedVariants, [variantName]: optionName };

      if (!isDirectlyAvailable) {
        const compatible = findCompatibleSelectionForOption(product.combinations, variantName, optionName);
        if (compatible) {
          newSelection = { ...compatible };
        }
      }

      setSelectedVariants(newSelection);

      // Combination image > Option image > Selected option image from product variants
      const match = findMatchingCombination(product.combinations, newSelection);
      if (match?.imageUrl) {
        setActiveImage(match.imageUrl);
      } else if (optionImage) {
        setActiveImage(optionImage);
      } else {
        let foundOptImg: string | undefined;
        if (product.variants) {
          for (const [vName, vVal] of Object.entries(newSelection)) {
            const vGroup = product.variants.find(v => v.name === vName);
            const opt = vGroup?.options?.find(o => (typeof o === 'string' ? o : o.name) === vVal);
            if (opt && typeof opt !== 'string' && opt.imageUrl) {
              foundOptImg = opt.imageUrl;
              break;
            }
          }
        }
        if (foundOptImg) {
          setActiveImage(foundOptImg);
        }
      }
      return;
    }

    // Fallback for simple variants
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: optionName
    }));
    if (optionImage) {
      setActiveImage(optionImage);
    }
  };

  const currentCombination = product.combinations && product.combinations.length > 0
    ? findMatchingCombination(product.combinations, selectedVariants)
    : undefined;

  const isCombinationInStock = currentCombination !== undefined ? currentCombination.inStock : true;
  const isAvailable = product.inStock && isCombinationInStock;
  const effectiveUnitPrice = getProductEffectivePrice(product, selectedVariants);

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product, quantity, selectedVariants, notes.trim() || undefined, effectiveUnitPrice);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setSelectedProductForModal(null);
    }, 400);
  };

  const lineTotal = effectiveUnitPrice * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl lg:max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 flex flex-col md:flex-row max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top actions: Share and Close buttons */}
        <div className="absolute top-3.5 right-3.5 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyProductLink}
            className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-600 hover:text-neutral-900 flex items-center justify-center shadow-xs border border-neutral-200/80 cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="Copiar enlace de este producto"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4 text-neutral-600" />
            )}
          </button>
          <button
            onClick={() => setSelectedProductForModal(null)}
            className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-600 hover:text-neutral-900 flex items-center justify-center shadow-xs border border-neutral-200/80 cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Image Area (Regularized & Contained) */}
        <div className="md:w-1/2 bg-neutral-50/80 relative shrink-0 flex items-center justify-center p-4 sm:p-6 md:p-8 min-h-[280px] sm:min-h-[350px] md:min-h-[440px] overflow-hidden select-none border-b md:border-b-0 md:border-r border-neutral-100">
          {/* Silky smooth crossfade style without scale-overflow */}
          <style>{`
            @keyframes modalImageFadeIn {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }
            .modal-img-crossfade {
              animation: modalImageFadeIn 0.28s ease-out forwards;
            }
          `}</style>

          {/* Ambient subtle blur in background for smooth aesthetic */}
          <img
            src={displayedImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-15 pointer-events-none scale-105"
          />

          {/* Background Layer: previous image during transition */}
          {previousImage && (
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8 pointer-events-none">
              <img
                src={previousImage}
                alt=""
                aria-hidden="true"
                className="max-w-full max-h-[250px] sm:max-h-[320px] md:max-h-[390px] w-auto h-auto object-contain pointer-events-none drop-shadow-sm"
              />
            </div>
          )}

          {/* Foreground Layer: active product image (perfectly contained, regulated, no clipping/overflow) */}
          <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
            <img
              key={displayedImage}
              src={displayedImage}
              alt={product.name}
              className={`max-w-full max-h-[250px] sm:max-h-[320px] md:max-h-[390px] w-auto h-auto object-contain drop-shadow-sm pointer-events-none ${
                isImageTransitioning ? 'modal-img-crossfade' : ''
              }`}
            />
          </div>

          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs z-20">
              Oferta Especial
            </span>
          )}

          {activeImage && activeImage !== product.imageUrl && (
            <button
              type="button"
              onClick={() => setActiveImage(product.imageUrl || null)}
              className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/85 text-white text-[10px] font-semibold backdrop-blur-md transition-all cursor-pointer z-20 shadow-xs active:scale-95 flex items-center gap-1"
            >
              <span>Ver foto principal</span>
            </button>
          )}
        </div>

        {/* Product Details & Selection form */}
        <div className="md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Store Attribution & Category (with dedicated space so it never hides behind buttons) */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100 pr-20 md:pr-24">
              {(() => {
                const productStore = stores.find(s => s.id === product.storeId) || currentStore;
                return productStore ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={productStore.logo || DEFAULT_STORE_LOGO}
                      alt={productStore.name}
                      className="w-6 h-6 rounded-lg object-cover border border-neutral-200 shadow-3xs shrink-0"
                    />
                    <span className="text-xs font-bold text-neutral-800 truncate">
                      {productStore.name}
                    </span>
                  </div>
                ) : null;
              })()}

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  {product.category}
                </span>
                {product.sku && (
                  <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 leading-snug tracking-tight">
                {product.name}
              </h2>
            </div>

            {/* Price */}
            <div className="flex items-baseline flex-wrap gap-2">
              <span className="text-2xl font-black text-neutral-900">
                {formatPrice(effectiveUnitPrice, currentStore.currency, currentStore.currencySymbol)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > effectiveUnitPrice && (
                <span className="text-sm text-neutral-400 line-through font-medium">
                  {formatPrice(product.compareAtPrice, currentStore.currency, currentStore.currencySymbol)}
                </span>
              )}
              {effectiveUnitPrice !== product.price && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {currentCombination?.price ? 'Precio por combinación' : 'Precio por variante'}
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {product.description}
            </p>

            {/* Variants options (Talla, Color, etc.) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                {product.variants.map((variant, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-neutral-700">
                      <span>{variant.name}:</span>
                      <span className="font-bold text-neutral-900">
                        {selectedVariants[variant.name] || 'Seleccionar'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option, optIdx) => {
                        const optName = typeof option === 'string' ? option : (option.name || '');
                        const optImage = typeof option === 'string' ? undefined : (option.imageUrl || undefined);
                        const optPrice = typeof option === 'string' ? undefined : option.price;
                        const isSelected = selectedVariants[variant.name] === optName;

                        const hasCombinations = product.combinations && product.combinations.length > 0;
                        const isAvailableDirectly = hasCombinations
                          ? isOptionAvailableInCombinations(product.combinations, variant.name, optName, selectedVariants)
                          : true;
                        const existsInAnyComb = hasCombinations
                          ? Boolean(product.combinations?.some(c => c.inStock && c.options[variant.name] === optName))
                          : true;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectVariant(variant.name, optName, optImage)}
                            title={
                              !existsInAnyComb
                                ? 'Opción sin stock en todas las combinaciones'
                                : !isAvailableDirectly
                                ? 'Disponible con otra combinación (clic para autoseleccionar)'
                                : undefined
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs scale-[1.02]'
                                : !existsInAnyComb
                                ? 'bg-neutral-100 text-neutral-400 border-dashed border-neutral-300 opacity-60 line-through cursor-not-allowed'
                                : !isAvailableDirectly
                                ? 'bg-neutral-50 text-neutral-500 border-dashed border-neutral-300 hover:border-neutral-400 hover:text-neutral-800'
                                : 'bg-white hover:bg-neutral-50 border-neutral-200/90 text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            {optImage && (
                              <img
                                src={optImage}
                                alt={optName}
                                className={`w-4 h-4 rounded-md object-cover border border-black/10 shrink-0 bg-neutral-100 ${
                                  !existsInAnyComb ? 'opacity-40' : ''
                                }`}
                              />
                            )}
                            <span>{optName}</span>
                            {!existsInAnyComb && (
                              <span className="text-[9px] text-rose-500 font-normal ml-0.5">(Agotado)</span>
                            )}
                            {existsInAnyComb && !isAvailableDirectly && !isSelected && (
                              <span className="text-[9px] text-amber-500 font-bold ml-0.5">•</span>
                            )}
                            {optPrice !== undefined && optPrice > 0 && !hasCombinations && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {formatPrice(optPrice, currentStore.currency, currentStore.currencySymbol)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Out-of-stock warning for combination */}
            {product.combinations && product.combinations.length > 0 && !isCombinationInStock && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <span className="font-bold">⚠️ Combinación sin stock:</span>
                <span>Esta combinación específica no está disponible. Elige otra opción.</span>
              </div>
            )}

            {/* Optional Item Notes */}
            <div className="pt-2 border-t border-neutral-100">
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Instrucciones especiales para este producto (opcional):
              </label>
              <input
                type="text"
                placeholder="Ej. Sin envoltorio, tamaño especial..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Bottom Actions: Quantity + Add Button */}
          <div className="mt-6 pt-4 border-t border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-600">Cantidad:</span>
              <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-neutral-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                !isAvailable
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>¡Agregado al carrito!</span>
                </>
              ) : !isAvailable ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Combinación Agotada / Sin Stock</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Agregar al carrito • {formatPrice(lineTotal, currentStore.currency, currentStore.currencySymbol)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
