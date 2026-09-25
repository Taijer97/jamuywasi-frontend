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

/** Plantillas automáticas antiguas (por defecto y de las tiendas de ejemplo): se reemplazan por el mensaje recomendado. */
const LEGACY_TEMPLATES = [
  "¡Hola {store_name}! Quisiera confirmar mi pedido #{order_number}:\n{items}\nTotal: {total}",
  "🛍️ *¡HOLA {nombre_tienda}! NUEVO PEDIDO #{numero_pedido}*\nQuiero confirmar mi compra desde el catálogo digital:\n\n👤 *Comprador:* {nombre_cliente}\n📱 *Teléfono:* {telefono_cliente}\n📍 *Modalidad:* {tipo_entrega} ({direccion_entrega})\n💳 *Método de pago:* {metodo_pago}\n\n📋 *RESUMEN DE PRODUCTOS:*\n{lista_productos}\n\n💵 *Subtotal:* {subtotal}\n🚚 *Envío:* {costo_envio}\n💰 *TOTAL A PAGAR:* {total}\n\n💬 *Notas adicionales:* {notas_pedido}\n---\n_Adjunto comprobante de pago._",
  "🛍️ *¡HOLA {nombre_tienda}! NUEVO PEDIDO #{numero_pedido}*\nQuiero confirmar mi compra desde el catálogo digital:\n👤 *Comprador:* {nombre_cliente}\n📱 *Teléfono:* {telefono_cliente}\n📍 *Modalidad:* {tipo_entrega} ({direccion_entrega})\n💳 *Método de pago:* {metodo_pago}\n📋 *RESUMEN DE PRODUCTOS:*\n{lista_productos}\n💵 *Subtotal:* {subtotal}\n🚚 *Envío:* {costo_envio}\n💰 *TOTAL A PAGAR:* {total}\n💬 *Notas:* {notas_pedido}",
  "☕ *¡HOLA {nombre_tienda}! NUEVO PEDIDO #{numero_pedido}*\n👤 *Cliente:* {nombre_cliente}\n📦 *ITEMS:*\n{lista_productos}\n💰 *TOTAL:* {total}",
  "🔥 *¡HOLA {nombre_tienda}! NUEVO PEDIDO #{numero_pedido}*\n👤 *Cliente:* {nombre_cliente}\n{lista_productos}\n💰 *TOTAL:* {total}",
  "🛍️ *¡HOLA {nombre_tienda}! NUEVO PEDIDO #{numero_pedido}*\n👤 *Cliente:* {nombre_cliente}\n📦 *PRODUCTOS:*\n{lista_productos}\n💰 *TOTAL:* {total}",
];
const normTpl = (t: string) => t.replace(/\s+/g, ' ').trim();
const LEGACY_SET = new Set(LEGACY_TEMPLATES.map(normTpl));
export const isLegacyTemplate = (t?: string) => !t || !t.trim() || LEGACY_SET.has(normTpl(t));


/** ¿El método de pago es contra entrega (no se puede adelantar)? */
export const isPayOnDelivery = (method?: string) => /efectivo|contra entrega|al recibir|contraentrega/i.test(method || '');

/** Línea del mensaje que compromete al cliente a enviar el comprobante (incentiva el pago anticipado). */
export function paymentReminderLine(paymentMethod: string, deliveryType: 'delivery' | 'pickup'): string {
  if (isPayOnDelivery(paymentMethod)) {
    return deliveryType === 'delivery'
      ? '💵 Pagaré en efectivo al recibir el pedido.'
      : '💵 Pagaré en efectivo al recoger el pedido.';
  }
  return deliveryType === 'delivery'
    ? '📎 *Comprobante:* les envío la captura del pago por este chat para que mi pedido se confirme y salga con prioridad ⚡'
    : '📎 *Comprobante:* les envío la captura del pago por este chat para que tengan mi pedido listo cuanto antes ⚡';
}

/** Mensaje por defecto: distinto para envío a domicilio y para recojo. */
function defaultOrderTemplate(deliveryType: 'delivery' | 'pickup', isVirtual: boolean, hasNotes: boolean): string {
  const head = `🛍️ *NUEVO PEDIDO #{numero_pedido}*
¡Hola, {nombre_tienda}! Acabo de hacer este pedido desde su catálogo 👇

👤 *Cliente:* {nombre_cliente}
🪪 *DNI/CE:* {dni_cliente}
📱 *WhatsApp:* {telefono_cliente}
`;
  const delivery = deliveryType === 'delivery'
    ? `
🚚 *Envío a domicilio*
📍 *Dirección:* {direccion_entrega}
`
    : `
🏬 *${isVirtual ? 'Recojo en punto de entrega' : 'Recojo en tienda'}*
📍 *Lugar:* {direccion_entrega}
🕒 Por favor avísenme cuándo puedo pasar a recogerlo.
`;
  const body = `
📦 *Productos:*
{lista_productos}

Subtotal: {subtotal}
${deliveryType === 'delivery' ? 'Envío: {costo_envio}\n' : ''}💰 *TOTAL: {total}*
💳 *Pago:* {metodo_pago}
${hasNotes ? '📝 *Notas:* {notas_pedido}\n' : ''}
{recordatorio_pago}`;
  return head + delivery + body;
}

export function generateWhatsAppOrderMessage(
  store: StoreConfig,
  orderNumber: string,
  customerData: {
    name: string;
    dni?: string;
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
  const isVirtual = store.storeType !== 'fisica';
  const notes = (customerData.notes || '').trim();
  const custom = (store.whatsappMessageTemplate || '').trim();
  const useDefault = isLegacyTemplate(custom);

  let template = useDefault ? defaultOrderTemplate(customerData.deliveryType, isVirtual, Boolean(notes)) : custom;

  // Etiquetas en inglés de plantillas antiguas
  template = template
    .replace(/{store_name}/g, '{nombre_tienda}')
    .replace(/{order_number}/g, '{numero_pedido}')
    .replace(/{items}/g, '{lista_productos}')
    .replace(/{customer_name}/g, '{nombre_cliente}')
    .replace(/{customer_phone}/g, '{telefono_cliente}');

  const dni = (customerData.dni || '').trim();
  // Si una plantilla propia no muestra el DNI, se añade junto al nombre para que la tienda pueda verificarlo
  if (!useDefault && dni && !template.includes('{dni_cliente}')) {
    template = template.replace('{nombre_cliente}', '{nombre_cliente} (DNI/CE {dni_cliente})');
  }
  // El recordatorio de pago anticipado siempre va al final si la plantilla no lo ubica
  if (!template.includes('{recordatorio_pago}')) {
    template = `${template.trimEnd()}\n\n{recordatorio_pago}`;
  }

  const itemsFormatted = formatProductListForWhatsApp(cartItems, store.currencySymbol);
  const deliveryTypeLabel = customerData.deliveryType === 'delivery'
    ? 'Envío a domicilio'
    : (isVirtual ? 'Recojo en punto de entrega' : 'Recojo en tienda');
  const deliveryFeeFormatted = deliveryFee > 0 ? formatPrice(deliveryFee, store.currency, store.currencySymbol) : '¡Gratis!';

  return template
    .replace(/{nombre_tienda}/g, store.name)
    .replace(/{numero_pedido}/g, orderNumber)
    .replace(/{nombre_cliente}/g, customerData.name || 'Cliente')
    .replace(/{dni_cliente}/g, dni || '—')
    .replace(/{telefono_cliente}/g, customerData.phone || 'No especificado')
    .replace(/{tipo_entrega}/g, deliveryTypeLabel)
    .replace(/{direccion_entrega}/g, customerData.address || (isVirtual ? 'Punto de entrega' : 'Tienda'))
    .replace(/{metodo_pago}/g, customerData.paymentMethod || 'A convenir')
    .replace(/{lista_productos}/g, itemsFormatted)
    .replace(/{subtotal}/g, formatPrice(subtotal, store.currency, store.currencySymbol))
    .replace(/{costo_envio}/g, deliveryFeeFormatted)
    // En la plantilla por defecto el total ya va en negrita
    .replace(/\*TOTAL: {total}\*/g, `*TOTAL: ${formatPrice(total, store.currency, store.currencySymbol)}*`)
    .replace(/{total}/g, `*${formatPrice(total, store.currency, store.currencySymbol)}*`)
    .replace(/{notas_pedido}/g, notes || 'Ninguna')
    .replace(/{recordatorio_pago}/g, paymentReminderLine(customerData.paymentMethod, customerData.deliveryType))
    .replace(/{fecha}/g, new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }))
    .replace(/\n{3,}/g, '\n\n');
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
