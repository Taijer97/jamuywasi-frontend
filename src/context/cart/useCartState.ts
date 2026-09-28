import { useEffect, useMemo, useState } from 'react';
import { fireConfetti as confetti } from '../../utils/confetti';
import { StoreConfig, Product, Order, CartItem, OrderStatus } from '../../types';
import { generateWhatsAppOrderMessage, buildWhatsAppLink, getProductEffectivePrice } from '../../utils/whatsapp';
import { api } from '../../services/api';
import { CustomerCheckoutData } from '../AppContextCore';
import { STORAGE_KEY_PREFIX } from '../storageKeys';

interface UseCartStateParams {
  products: Product[];
  stores: StoreConfig[];
  myStores: StoreConfig[];
  currentStore: StoreConfig;
  currentUserId: string;
}

/**
 * Slice de carrito + pedidos: un pedido por WhatsApp va a UN solo negocio, así que el carrito
 * solo admite productos de una tienda a la vez (con confirmación si se intenta mezclar).
 * Incluye también `orders`, porque el checkout es quien crea el primer pedido del cliente;
 * el resto de operaciones sobre pedidos (listar, cambiar estado) se apoyan en el mismo estado.
 */
export function useCartState({ products, stores, myStores, currentStore, currentUserId }: UseCartStateParams) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);

  // Persistir carrito en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'cart', JSON.stringify(cart));
    } catch { /* almacenamiento lleno o no disponible */ }
  }, [cart]);

  // Persistir pedidos locales: solo para visitantes (los del comerciante/admin viven en el servidor)
  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'orders');
      } else {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'orders', JSON.stringify(orders.slice(0, 20)));
      }
    } catch { /* almacenamiento no disponible */ }
  }, [orders, currentUserId]);

  // Refrescar el carrito guardado con los datos actuales de los productos (precio, stock, fotos)
  useEffect(() => {
    if (products.length === 0) return;
    setCart(prev => {
      let changed = false;
      const next = prev.map(item => {
        const fresh = products.find(p => p.id === item.product.id);
        if (!fresh || fresh === item.product) return item;
        changed = true;
        return { ...item, product: fresh, unitPrice: getProductEffectivePrice(fresh, item.selectedVariants) };
      });
      return changed ? next : prev;
    });
  }, [products]);

  const [pendingCartItem, setPendingCartItem] = useState<{
    product: Product; quantity: number; selectedVariants: Record<string, string>; notes?: string; unitPrice?: number;
  } | null>(null);

  const addItemToCart = (
    product: Product,
    quantity: number,
    selectedVariants: Record<string, string> = {},
    notes?: string,
    unitPrice?: number,
    replaceCart = false
  ) => {
    const effectivePrice = (typeof unitPrice === 'number' && unitPrice > 0)
      ? unitPrice
      : getProductEffectivePrice(product, selectedVariants);

    setCart(prevCart => {
      // Seguridad extra: nunca mezclar tiendas aunque el estado haya cambiado entre renders
      const prev = replaceCart || (prevCart[0] && prevCart[0].product.storeId !== product.storeId) ? [] : prevCart;
      const variantKey = JSON.stringify(selectedVariants);
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && JSON.stringify(item.selectedVariants) === variantKey
      );

      if (existingIdx > -1) {
        return prev.map((item, i) => i !== existingIdx ? item : {
          ...item,
          quantity: item.quantity + quantity,
          unitPrice: effectivePrice,
          notes: notes || item.notes,
        });
      }

      return [
        ...prev,
        {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product,
          quantity,
          selectedVariants,
          unitPrice: effectivePrice,
          notes
        }
      ];
    });

    setCartDrawerOpen(true);
  };

  const addToCart = (
    product: Product,
    quantity: number,
    selectedVariants: Record<string, string> = {},
    notes?: string,
    unitPrice?: number
  ) => {
    const cartStoreIdNow = cart[0]?.product.storeId;
    if (cartStoreIdNow && cartStoreIdNow !== product.storeId) {
      // Producto de otra tienda: preguntar antes de mezclar (no se agrega todavía)
      setPendingCartItem({ product, quantity, selectedVariants, notes, unitPrice });
      return;
    }
    addItemToCart(product, quantity, selectedVariants, notes, unitPrice);
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const confirmCartSwitch = () => {
    if (!pendingCartItem) return;
    const { product, quantity, selectedVariants, notes, unitPrice } = pendingCartItem;
    setPendingCartItem(null);
    addItemToCart(product, quantity, selectedVariants, notes, unitPrice, true);
  };

  const cancelCartSwitch = () => setPendingCartItem(null);

  // Tienda del carrito: la del primer producto (no la tienda que se esté mirando en pantalla)
  const cartStoreId = cart[0]?.product.storeId || '';
  const cartStoreFound = useMemo(
    () => (cartStoreId ? (stores.find(s => s.id === cartStoreId) || myStores.find(s => s.id === cartStoreId)) : undefined),
    [cartStoreId, stores, myStores]
  );
  const cartStore: StoreConfig = cartStoreFound || currentStore;
  const cartStoreAvailable = !cartStoreId || Boolean(cartStoreFound);
  const pendingCartSwitch = pendingCartItem ? {
    fromStoreName: cartStore.name,
    toStoreName: stores.find(s => s.id === pendingCartItem.product.storeId)?.name || 'otra tienda',
    productName: pendingCartItem.product.name,
  } : null;

  // Pedido: primero se registra en el servidor (valida DNI, nombre, teléfono, stock y precios);
  // solo si se guardó se muestra el modal de éxito con el botón para avisar a la tienda por WhatsApp.
  const submitOrderToWhatsApp = async (customerData: CustomerCheckoutData): Promise<
    { ok: true; order: Order; whatsappUrl: string } | { ok: false; error: string }
  > => {
    // El pedido se envía a la tienda de los productos del carrito, no a la que se esté viendo
    const orderStore = cartStore;
    const cartSnapshot = [...cart];
    const getItemUnitPrice = (item: CartItem) =>
      (typeof item.unitPrice === 'number' && item.unitPrice > 0)
        ? item.unitPrice
        : getProductEffectivePrice(item.product, item.selectedVariants);

    const subtotal = cartSnapshot.reduce((acc, item) => acc + getItemUnitPrice(item) * item.quantity, 0);
    const isFreeDelivery = customerData.deliveryType === 'pickup' || subtotal >= orderStore.freeDeliveryThreshold;
    const deliveryFee = isFreeDelivery ? 0 : orderStore.deliveryFee;
    const total = subtotal + deliveryFee;

    // 6 caracteres aleatorios: evita números repetidos (el backend confirma que sea único)
    const randomSuffix = Array.from(crypto.getRandomValues(new Uint8Array(3)))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const orderNumber = `PED-${randomSuffix}`;

    const items = cartSnapshot.map(item => {
      const unitPrice = getItemUnitPrice(item);
      return {
        productId: item.product.id,
        productName: item.product.name,
        price: unitPrice,
        quantity: item.quantity,
        selectedVariants: item.selectedVariants,
        subtotal: unitPrice * item.quantity,
        imageUrl: item.product.imageUrl
      };
    });
    const address = customerData.deliveryType === 'pickup' ? customerData.address || 'Recojo en tienda' : customerData.address;
    const draftMessage = generateWhatsAppOrderMessage(orderStore, orderNumber, customerData, cartSnapshot, subtotal, deliveryFee, total);

    let persisted: Order;
    try {
      persisted = await api.createOrder({
        storeId: orderStore.id,
        orderNumber,
        customerName: customerData.name,
        customerDni: customerData.dni,
        customerPhone: customerData.phone,
        customerAddress: address,
        notes: customerData.notes,
        deliveryType: customerData.deliveryType,
        paymentMethod: customerData.paymentMethod,
        items,
        subtotal,
        deliveryFee,
        total,
        whatsappMessageSent: draftMessage
      });
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : 'No se pudo registrar tu pedido.';
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      return { ok: false, error: offline ? 'No tienes conexión a internet. Revisa tu conexión e inténtalo de nuevo.' : msg };
    }

    // El mensaje final usa el número y los montos que confirmó el servidor
    const message = (persisted.orderNumber === orderNumber && Math.abs(persisted.total - total) < 0.01)
      ? draftMessage
      : generateWhatsAppOrderMessage(orderStore, persisted.orderNumber, customerData, cartSnapshot,
          persisted.subtotal, persisted.deliveryFee, persisted.total);
    const whatsappUrl = buildWhatsAppLink(orderStore.countryCode, orderStore.phone, message);
    const finalOrder: Order = { ...persisted, whatsappMessageSent: message };

    setOrders(prev => [finalOrder, ...prev.filter(o => o.id !== finalOrder.id)]);
    setLastCompletedOrder(finalOrder);
    setCart([]);
    setCartDrawerOpen(false);
    setOrderSuccessModalOpen(true);

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // silent fallback
    }

    return { ok: true, order: finalOrder, whatsappUrl };
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      await api.updateOrderStatus(orderId, status);
    } catch (err) {
      console.warn('Could not update order status in backend:', err);
    }
  };

  return {
    cart,
    setCart,
    cartDrawerOpen,
    setCartDrawerOpen,
    orders,
    setOrders,
    lastCompletedOrder,
    orderSuccessModalOpen,
    setOrderSuccessModalOpen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartStore,
    cartStoreAvailable,
    pendingCartSwitch,
    confirmCartSwitch,
    cancelCartSwitch,
    submitOrderToWhatsApp,
    updateOrderStatus
  };
}
