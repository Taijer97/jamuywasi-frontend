import React, { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Aparece al agregar un producto de OTRA tienda cuando el carrito ya tiene productos.
 * Un pedido por WhatsApp se envía a un solo negocio, así que el cliente elige:
 * seguir con su carrito actual o vaciarlo y empezar uno nuevo con la otra tienda.
 */
export const CartStoreSwitchDialog: React.FC = () => {
  const { pendingCartSwitch, confirmCartSwitch, cancelCartSwitch } = useApp();

  useEffect(() => {
    if (!pendingCartSwitch) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelCartSwitch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingCartSwitch, cancelCartSwitch]);

  if (!pendingCartSwitch) return null;
  const { fromStoreName, toStoreName, productName } = pendingCartSwitch;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-neutral-950/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={cancelCartSwitch}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-switch-title"
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 id="cart-switch-title" className="text-lg font-black text-neutral-900 leading-snug">
            ¿Empezar un pedido nuevo en {toStoreName}?
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Tu carrito tiene productos de <strong className="text-neutral-900">{fromStoreName}</strong>. Cada pedido se
            envía por WhatsApp a una sola tienda, así que para agregar <strong className="text-neutral-900">{productName}</strong> hay
            que vaciar el carrito actual.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={confirmCartSwitch}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            Vaciar carrito y agregar
          </button>
          <button
            type="button"
            onClick={cancelCartSwitch}
            autoFocus
            className="w-full py-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-sm font-bold transition-colors cursor-pointer"
          >
            Mantener mi carrito de {fromStoreName}
          </button>
        </div>
      </div>
    </div>
  );
};
