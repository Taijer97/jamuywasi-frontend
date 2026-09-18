import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  MessageCircle,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  PackageCheck,
  ShoppingBag
} from 'lucide-react';
import { formatPrice, buildWhatsAppLink } from '../../utils/whatsapp';

export const OrderSuccessModal: React.FC = () => {
  const {
    orderSuccessModalOpen,
    setOrderSuccessModalOpen,
    lastCompletedOrder,
    currentStore,
    setActiveView,
    setMerchantTab,
    currentUser,
    isSuperAdmin
  } = useApp();

  const [copied, setCopied] = useState(false);

  if (!orderSuccessModalOpen || !lastCompletedOrder) return null;

  const whatsappUrl = buildWhatsAppLink(
    currentStore.countryCode,
    currentStore.phone,
    lastCompletedOrder.whatsappMessageSent
  );

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(lastCompletedOrder.whatsappMessageSent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // El acceso al panel solo tiene sentido para el dueño de la tienda o el superadmin.
  // Un cliente normal no debe ver ese botón (lo llevaría a una pantalla de acceso denegado).
  const canManageStore = Boolean(
    isSuperAdmin ||
    (currentUser && (currentUser.storeId === currentStore.id || currentStore.ownerId === currentUser.id))
  );

  const handleGoToMerchantOrders = () => {
    setOrderSuccessModalOpen(false);
    setActiveView('merchant');
    setMerchantTab('orders');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center border border-neutral-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
          <PackageCheck className="w-3.5 h-3.5" />
          Pedido Registrado #{lastCompletedOrder.orderNumber}
        </span>

        <h3 className="text-xl font-extrabold text-neutral-900">
          ¡Tu pedido está listo para WhatsApp!
        </h3>

        <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
          Hemos generado el mensaje automático y abierto WhatsApp para que envíes tu pedido a{' '}
          <strong>{currentStore.name}</strong>.
        </p>

        {/* Order Card Brief */}
        <div className="my-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Cliente:</span>
            <span className="font-semibold text-neutral-800">{lastCompletedOrder.customerName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Modalidad:</span>
            <span className="font-semibold text-neutral-800">
              {lastCompletedOrder.deliveryType === 'delivery' ? 'Envío a Domicilio' : 'Retiro en Tienda'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Total a pagar:</span>
            <span className="font-extrabold text-emerald-700 text-sm">
              {formatPrice(lastCompletedOrder.total, currentStore.currency, currentStore.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Primary and secondary action buttons */}
        <div className="space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Abrir conversación en WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleCopyMessage}
            className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">¡Texto del pedido copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar texto del mensaje</span>
              </>
            )}
          </button>
        </div>

        {/* Shortcut to view merchant panel */}
        <div className={`mt-5 pt-4 border-t border-neutral-100 flex items-center text-xs text-neutral-500 ${canManageStore ? 'justify-between' : 'justify-center'}`}>
          <button
            onClick={() => setOrderSuccessModalOpen(false)}
            className="text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer"
          >
            Volver a la tienda
          </button>

          {canManageStore && (
            <button
              onClick={handleGoToMerchantOrders}
              className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ver pedido en Panel</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
