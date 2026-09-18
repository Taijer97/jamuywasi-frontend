import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingCart } from 'lucide-react';

export const FloatingCartButton: React.FC = () => {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    activeView
  } = useApp();

  const [hasBumped, setHasBumped] = useState(false);

  const cartTotalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Trigger brief bounce animation whenever items are added or quantity changes
  useEffect(() => {
    if (cartTotalItems > 0) {
      setHasBumped(true);
      const timer = setTimeout(() => setHasBumped(false), 800);
      return () => clearTimeout(timer);
    }
  }, [cartTotalItems]);

  // Only display in shopping customer views (home, marketplace, catalog)
  const isShoppingView = activeView === 'home' || activeView === 'marketplace' || activeView === 'catalog';

  // Hide while cart drawer is open to avoid visual overlap with the right drawer
  if (!isShoppingView || cartDrawerOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        type="button"
        onClick={() => setCartDrawerOpen(true)}
        className={`group relative w-14 h-14 rounded-full flex items-center justify-center bg-neutral-900/95 hover:bg-black text-white backdrop-blur-md border border-neutral-700/70 shadow-2xl hover:shadow-emerald-500/30 transition-all duration-200 cursor-pointer select-none active:scale-95 ${
          hasBumped ? 'scale-110 ring-4 ring-emerald-400/40 animate-pulse' : 'hover:scale-108'
        }`}
        aria-label={`Carrito de compras (${cartTotalItems} productos)`}
        title="Carrito de compras"
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Traditional shopping cart icon */}
        <ShoppingCart className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform stroke-[2.2]" />

        {/* Counter badge */}
        {cartTotalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-[11px] font-black leading-none text-neutral-950 bg-emerald-400 rounded-full shadow-lg ring-2 ring-neutral-900 animate-in zoom-in-75">
            {cartTotalItems > 99 ? '99+' : cartTotalItems}
          </span>
        )}
      </button>
    </div>
  );
};
