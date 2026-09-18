import { StoreConfig, CartItem, Order, Product, ProductCombination } from '../types';

export function findMatchingCombination(
  combinations: ProductCombination[] | undefined,
  selectedVariants: Record<string, string>
): ProductCombination | undefined {
  if (!combinations || combinations.length === 0) return undefined;
  return combinations.find(comb => {
    const keys = Object.keys(comb.options);
    if (keys.length === 0) return false;
    return keys.every(k => comb.options[k] === selectedVariants[k]);
  });
}

export function isOptionAvailableInCombinations(
  combinations: ProductCombination[] | undefined,
  variantName: string,
  optionName: string,
  currentSelection: Record<string, string>
): boolean {
  if (!combinations || combinations.length === 0) return true;

  // Check if there is any active combination with this option and current selection
  const compatibleActive = combinations.find(comb => {
    if (!comb.inStock) return false;
    if (comb.options[variantName] !== optionName) return false;
    for (const [vName, vVal] of Object.entries(currentSelection)) {
      if (vName !== variantName && comb.options[vName] && comb.options[vName] !== vVal) {
        return false;
      }
    }
    return true;
  });

  return Boolean(compatibleActive);
}

export function findCompatibleSelectionForOption(
  combinations: ProductCombination[] | undefined,
  variantName: string,
  optionName: string
): Record<string, string> | null {
  if (!combinations || combinations.length === 0) return null;
  const activeComb = combinations.find(comb => comb.inStock && comb.options[variantName] === optionName);
  return activeComb ? { ...activeComb.options } : null;
}

export function getProductEffectivePrice(
  product: Product,
  selectedVariants: Record<string, string> = {}
): number {
  if (!product) return 0;

  // 1. Check if product has combinations with specific price
  if (product.combinations && product.combinations.length > 0) {
    const match = findMatchingCombination(product.combinations, selectedVariants);
    if (match && typeof match.price === 'number' && match.price > 0) {
      return match.price;
    }
  }

  // 2. Check variant options
  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const selectedOptName = selectedVariants[variant.name];
      if (!selectedOptName) continue;

      const opt = variant.options.find(o =>
        (typeof o === 'string' ? o : o.name) === selectedOptName
      );

      if (opt && typeof opt !== 'string' && typeof opt.price === 'number' && opt.price > 0) {
        return opt.price;
      }
    }
  }

  return product.price;
}

export function formatPrice(amount: number, currency: string = 'PEN', symbol: string = 'S/'): string {
  const isSol = symbol === 'S/' || symbol === 'S/.' || currency === 'PEN';
  const effectiveSymbol = isSol ? (symbol.endsWith('/') || symbol.endsWith('/.') ? symbol : 'S/') : symbol;
  const locale = isSol ? 'es-PE' : 'es-MX';
  const formatted = amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (isSol) {
    return `${effectiveSymbol} ${formatted}`;
  }
  return `${effectiveSymbol}${formatted} ${currency}`;
}

export function formatProductListForWhatsApp(items: CartItem[], currencySymbol: string = 'S/'): string {
  const isSol = currencySymbol === 'S/' || currencySymbol === 'S/.';
  const symbolPrefix = isSol ? `${currencySymbol} ` : currencySymbol;

  return items
    .map(item => {
      const variantsText = Object.entries(item.selectedVariants)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
      const variantSuffix = variantsText ? ` (${variantsText})` : '';
      const notesSuffix = item.notes ? ` [Nota: ${item.notes}]` : '';
      const unitPrice = (typeof item.unitPrice === 'number' && item.unitPrice > 0)
        ? item.unitPrice
        : getProductEffectivePrice(item.product, item.selectedVariants);
      const lineTotal = (unitPrice * item.quantity).toFixed(2);
      return `• ${item.quantity}x ${item.product.name}${variantSuffix} - ${symbolPrefix}${lineTotal}${notesSuffix}`;
    })
    .join('\n');
}

export function generateWhatsAppOrderMessage(
  store: StoreConfig,
  orderNumber: string,
  customerData: {
    name: string;
    phone: string;
    deliveryType: 'delivery' | 'pickup';
    address: string;
    paymentMethod: string;
    notes?: string;
  },
  cartItems: CartItem[],
  subtotal: number,
  deliveryFee: number,
  total: number
): string {
  const template = store.whatsappMessageTemplate || `🛍️ *¡HOLA {nombre_tienda}! NUEVO PEDIDO #{numero_pedido}*
Quiero confirmar mi compra desde el catálogo digital:

👤 *Comprador:* {nombre_cliente}
📱 *Teléfono:* {telefono_cliente}
📍 *Modalidad:* {tipo_entrega} ({direccion_entrega})
💳 *Método de pago:* {metodo_pago}

📋 *RESUMEN DE PRODUCTOS:*
{lista_productos}

💵 *Subtotal:* {subtotal}
🚚 *Envío:* {costo_envio}
💰 *TOTAL A PAGAR:* {total}

💬 *Notas adicionales:* {notas_pedido}
---
_Adjunto comprobante de pago._`;

  const itemsFormatted = formatProductListForWhatsApp(cartItems, store.currencySymbol);
  const deliveryTypeLabel = customerData.deliveryType === 'delivery'
    ? 'Envío a Domicilio'
    : (store.storeType === 'virtual' ? 'Retiro en Punto de Entrega' : 'Retiro en Tienda / Local');
  const deliveryFeeFormatted = deliveryFee > 0 ? formatPrice(deliveryFee, store.currency, store.currencySymbol) : '¡Gratis!';

  return template
    .replace(/{nombre_tienda}/g, store.name)
    .replace(/{numero_pedido}/g, orderNumber)
    .replace(/{nombre_cliente}/g, customerData.name || 'Cliente')
    .replace(/{telefono_cliente}/g, customerData.phone || 'No especificado')
    .replace(/{tipo_entrega}/g, deliveryTypeLabel)
    .replace(/{direccion_entrega}/g, customerData.address || 'Retiro en tienda')
    .replace(/{metodo_pago}/g, customerData.paymentMethod || 'A convenir')
    .replace(/{lista_productos}/g, itemsFormatted)
    .replace(/{subtotal}/g, formatPrice(subtotal, store.currency, store.currencySymbol))
    .replace(/{costo_envio}/g, deliveryFeeFormatted)
    .replace(/{total}/g, `*${formatPrice(total, store.currency, store.currencySymbol)}*`)
    .replace(/{notas_pedido}/g, customerData.notes ? customerData.notes : 'Ninguna')
    .replace(/{fecha}/g, new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }));
}

export function buildWhatsAppLink(countryCode: string, phone: string, message: string): string {
  // Clean phone number: remove non-digits
  const cleanCode = countryCode.replace(/\D/g, '');
  const cleanNumber = phone.replace(/\D/g, '');
  const fullPhone = `${cleanCode}${cleanNumber}`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encoded}`;
}

export function generateCustomerStatusUpdateWhatsAppLink(
  store: StoreConfig,
  order: Order,
  newStatus: string
): string {
  let message = '';
  switch (newStatus) {
    case 'confirmed':
      message = `¡Hola ${order.customerName}! 👋 Te confirmamos que hemos recibido tu pago y tu pedido *#${order.orderNumber}* en *${store.name}* está formalmente confirmado. ¡Comenzamos a prepararlo! 📦`;
      break;
    case 'preparing':
      message = `¡Hola ${order.customerName}! 🛍️ Tu pedido *#${order.orderNumber}* en *${store.name}* ya se encuentra en proceso de empaquetado y preparación. Te avisaremos cuando salga en camino.`;
      break;
    case 'delivered':
      message = `¡Hola ${order.customerName}! 🎉 Tu pedido *#${order.orderNumber}* de *${store.name}* ha sido ${order.deliveryType === 'pickup' ? 'entregado para retiro' : 'entregado en tu dirección'}. ¡Muchas gracias por tu compra! Déjanos saber si todo llegó perfecto. ⭐`;
      break;
    case 'cancelled':
      message = `Hola ${order.customerName}. Te informamos sobre una actualización en tu pedido *#${order.orderNumber}* de *${store.name}*. Por favor escríbenos si tienes cualquier duda.`;
      break;
    default:
      message = `Hola ${order.customerName}, te escribimos de *${store.name}* en relación a tu pedido *#${order.orderNumber}*.`;
  }

  // Remove non-digit chars from customer phone
  const cleanPhone = order.customerPhone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
