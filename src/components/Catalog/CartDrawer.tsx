import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CartItem } from '../../types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  Truck,
  Store,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  MapPin,
  Info,
  Globe
} from 'lucide-react';
import {
  formatPrice,
  generateWhatsAppOrderMessage,
  getProductEffectivePrice,
  findMatchingCombination
} from '../../utils/whatsapp';
import { DEFAULT_PRODUCT_IMAGE } from '../../data/initialData';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    currentStore,
    submitOrderToWhatsApp
  } = useApp();

  // Determine delivery & pickup capabilities
  const isFisica = currentStore.storeType === 'fisica';
  const isVirtual = !isFisica;

  // Tienda Física y Virtual: Delivery activo si allowDelivery no es false
  const canDelivery = currentStore.allowDelivery !== false;

  // Retiro en local / Punto de entrega:
  // Tienda Virtual: Si no tiene configurado punto de entrega, no mostrar retiro
  // Tienda Física: allowPickup !== false
  const hasVirtualPickupPoint = Boolean(currentStore.pickupAddress && currentStore.pickupAddress.trim().length > 0);
  const canPickup = isFisica
    ? (currentStore.allowPickup !== false)
    : (currentStore.allowPickup !== false && hasVirtualPickupPoint);

  const pickupAddressText = isVirtual
    ? (currentStore.pickupAddress || 'Punto de entrega coordinado')
    : (currentStore.address || 'Local comercial de la tienda');

  // Customer Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>(() => {
    if (!canDelivery && canPickup) return 'pickup';
    return 'delivery';
  });
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(
    currentStore.preferredPaymentMethod || 'Transferencia Bancaria'
  );
  const [notes, setNotes] = useState('');
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync deliveryType if store rules change
  React.useEffect(() => {
    if (!canDelivery && canPickup) {
      setDeliveryType('pickup');
    } else if (canDelivery && !canPickup) {
      setDeliveryType('delivery');
    }
  }, [canDelivery, canPickup, currentStore.id]);

  // Sync preferredPaymentMethod
  React.useEffect(() => {
    if (currentStore.preferredPaymentMethod) {
      setPaymentMethod(currentStore.preferredPaymentMethod);
    }
  }, [currentStore.preferredPaymentMethod, currentStore.id]);

  if (!cartDrawerOpen) return null;

  const getItemUnitPrice = (item: CartItem) =>
    (typeof item.unitPrice === 'number' && item.unitPrice > 0)
      ? item.unitPrice
      : getProductEffectivePrice(item.product, item.selectedVariants);

  const subtotal = cart.reduce((acc, item) => acc + getItemUnitPrice(item) * item.quantity, 0);
  const isFreeDelivery = deliveryType === 'pickup' || !canDelivery || subtotal >= currentStore.freeDeliveryThreshold;
  const deliveryFee = (deliveryType === 'pickup' || !canDelivery) ? 0 : (isFreeDelivery ? 0 : currentStore.deliveryFee);
  const total = subtotal + deliveryFee;

  const amountNeededForFree = Math.max(0, currentStore.freeDeliveryThreshold - subtotal);
  const freeProgress = Math.min(100, Math.round((subtotal / currentStore.freeDeliveryThreshold) * 100));

  const handleCheckout = () => {
    if (!customerName.trim()) {
      setValidationError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!customerPhone.trim()) {
      setValidationError('Por favor ingresa tu número de WhatsApp para contactarte.');
      return;
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      setValidationError('Por favor ingresa tu dirección para el envío.');
      return;
    }

    setValidationError(null);

    submitOrderToWhatsApp({
      name: customerName.trim(),
      phone: customerPhone.trim(),
      deliveryType,
      address: deliveryType === 'delivery' ? address.trim() : pickupAddressText,
      paymentMethod,
      notes: notes.trim()
    });
  };

  // Preview message generated in real-time
  const simulatedMessage = generateWhatsAppOrderMessage(
    currentStore,
    'PED-XXXX',
    {
      name: customerName || 'Nombre del Cliente',
      phone: customerPhone || '+52 55 ...',
      deliveryType,
      address: deliveryType === 'delivery' ? (address || 'Dirección de entrega') : pickupAddressText,
      paymentMethod,
      notes
    },
    cart,
    subtotal,
    deliveryFee,
    total
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full">
          {/* Drawer Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900">Tu Pedido</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {cart.reduce((t, i) => t + i.quantity, 0)} ítems
              </span>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-neutral-600 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Vaciar
                </button>
              )}
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="w-8 h-8 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free delivery progress bar */}
          {deliveryType === 'delivery' && canDelivery && (
            <div className="px-4 py-2.5 bg-emerald-50/60 border-b border-emerald-100">
              <div className="flex items-center justify-between text-xs text-neutral-700 mb-1 font-medium">
                {amountNeededForFree > 0 ? (
                  <span>
                    Agrega <strong className="text-emerald-700">{formatPrice(amountNeededForFree, currentStore.currency, currentStore.currencySymbol)}</strong> más para <strong>Envío Gratis</strong>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ¡Calificas para Envío Gratis!
                  </span>
                )}
                <span className="text-[10px] text-neutral-600 font-semibold">{freeProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${freeProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-neutral-800">El carrito está vacío</h3>
                <p className="text-xs text-neutral-600 max-w-xs">
                  Explora los productos de nuestro catálogo y agrégalos para enviar tu pedido directo a WhatsApp.
                </p>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Ver Catálogo
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    Productos seleccionados
                  </span>
                  <div className="divide-y divide-neutral-100">
                    {cart.map(item => {
                      const matchComb = findMatchingCombination(item.product.combinations, item.selectedVariants);
                      const displayImg = matchComb?.imageUrl || item.product.imageUrl || DEFAULT_PRODUCT_IMAGE;

                      return (
                        <div key={item.id} className="py-3 flex items-start gap-3">
                          <div className="w-14 h-14 rounded-xl bg-neutral-50/90 border border-neutral-200/70 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={displayImg}
                              alt={item.product.name}
                              className="max-w-full max-h-full w-auto h-auto object-contain"
                            />
                          </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {item.product.name}
                          </h4>

                          {/* Selected variants */}
                          {Object.keys(item.selectedVariants).length > 0 && (
                            <div className="text-[11px] text-neutral-600 flex flex-wrap gap-1 mt-0.5">
                              {Object.entries(item.selectedVariants).map(([name, val]) => (
                                <span key={name} className="bg-neutral-100 px-1.5 py-0.2 rounded">
                                  {name}: {val}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-[10px] text-amber-700 italic mt-0.5">
                              Nota: {item.notes}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs font-extrabold text-neutral-900">
                                {formatPrice(getItemUnitPrice(item) * item.quantity, currentStore.currency, currentStore.currencySymbol)}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  ({formatPrice(getItemUnitPrice(item), currentStore.currency, currentStore.currencySymbol)} c/u)
                                </span>
                              )}
                            </div>

                            {/* Quantity controls */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 overflow-hidden">
                                <button
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-bold text-neutral-800">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-neutral-600 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                title="Eliminar ítem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* Customer Checkout Information Form */}
                <div className="pt-3 border-t border-neutral-200 space-y-3">
                  <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    Datos para tu pedido en WhatsApp
                  </span>

                  {validationError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Delivery mode selection */}
                  {canDelivery && canPickup ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          deliveryType === 'delivery'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>Envío a Domicilio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          deliveryType === 'pickup'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        <span>{isVirtual ? 'Punto de Entrega' : 'Retiro en Local'}</span>
                      </button>
                    </div>
                  ) : canDelivery ? (
                    <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-950 flex items-center gap-2.5 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold block text-neutral-900">Modalidad: Envío a Domicilio</span>
                        <span className="text-[11px] text-neutral-600 block truncate">
                          Esta tienda realiza despacho directo a la dirección que indiques.
                        </span>
                      </div>
                    </div>
                  ) : canPickup ? (
                    <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-950 flex items-center gap-2.5 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold block text-neutral-900">
                          {isVirtual ? 'Modalidad: Retiro en Punto de Entrega' : 'Modalidad: Retiro en Local Comercial'}
                        </span>
                        <span className="text-[11px] text-neutral-600 block truncate">
                          {isVirtual ? (currentStore.pickupAddress || 'Punto acordado') : (currentStore.address || 'Local de la tienda')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Coordinar modalidad de entrega directamente por WhatsApp al enviar el pedido.</span>
                    </div>
                  )}

                  {/* Informative box if pickup is active */}
                  {deliveryType === 'pickup' && canPickup && (
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/90 text-xs text-neutral-700 space-y-1 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{isVirtual ? 'Lugar del Punto de Entrega:' : 'Dirección para Retirar:'}</span>
                      </div>
                      <p className="pl-5 text-neutral-600 text-[11px] leading-relaxed">
                        {isVirtual
                          ? (currentStore.pickupAddress || 'Punto de entrega acordado con la tienda.')
                          : (currentStore.address || 'Local comercial de la tienda.')}
                      </p>
                    </div>
                  )}

                  {/* Name & Phone */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                        Tu nombre completo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. María Fernández"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                        Tu teléfono / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="Ej. +52 55 1234 5678"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {deliveryType === 'delivery' && canDelivery && (
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                          Dirección de entrega <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Calle, número, colonia, ciudad y referencias..."
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium text-neutral-700">
                          Método de pago preferido
                        </label>
                        {currentStore.preferredPaymentMethod && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Recomendado por la tienda
                          </span>
                        )}
                      </div>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors cursor-pointer font-medium"
                      >
                        {currentStore.preferredPaymentMethod && (
                          <option value={currentStore.preferredPaymentMethod}>
                            ⭐ {currentStore.preferredPaymentMethod} (Preferido por la tienda)
                          </option>
                        )}
                        {['Transferencia Bancaria', 'Yape', 'Plin', 'Efectivo contra entrega', 'Tarjeta de Débito / Crédito (Link de Pago)', 'Pago Móvil / Billetera Digital']
                          .filter(opt => opt !== currentStore.preferredPaymentMethod)
                          .map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))
                        }
                      </select>

                      {currentStore.paymentInstructions && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold block text-amber-950">Datos para realizar el pago:</span>
                            <p className="whitespace-pre-line text-neutral-700 mt-0.5 leading-relaxed font-sans">
                              {currentStore.paymentInstructions}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                        Notas adicionales (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Dejar con portería, cambio de $500..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Collapsible WhatsApp Message Preview */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
                      className="w-full flex items-center justify-between text-xs text-emerald-800 font-semibold py-1.5 px-2 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Ver vista previa del mensaje a WhatsApp
                      </span>
                      {showWhatsAppPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showWhatsAppPreview && (
                      <div className="mt-2 p-3 rounded-xl bg-neutral-900 text-neutral-100 text-[11px] font-mono leading-relaxed whitespace-pre-wrap border border-neutral-800 max-h-48 overflow-y-auto">
                        {simulatedMessage}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer / Final WhatsApp CTA */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-3">
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-neutral-800">
                    {formatPrice(subtotal, currentStore.currency, currentStore.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de envío:</span>
                  <span className="font-semibold text-neutral-800">
                    {deliveryFee > 0
                      ? formatPrice(deliveryFee, currentStore.currency, currentStore.currencySymbol)
                      : <span className="text-emerald-700 font-bold">¡Gratis!</span>}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-1.5 border-t border-neutral-200">
                  <span>Total:</span>
                  <span className="text-emerald-700">
                    {formatPrice(total, currentStore.currency, currentStore.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Big prominent Emerald WhatsApp CTA button */}
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Pedir por WhatsApp • {formatPrice(total, currentStore.currency, currentStore.currencySymbol)}</span>
              </button>
              <p className="text-[10px] text-center text-neutral-600">
                Al hacer clic serás redirigido a WhatsApp con tu pedido desglosado para confirmar con la tienda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
