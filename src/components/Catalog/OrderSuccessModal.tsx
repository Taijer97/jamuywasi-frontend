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
  Zap,
  Receipt,
  Banknote,
  MapPin,
  Truck,
  Store as StoreIcon,
} from 'lucide-react';
import { formatPrice, buildWhatsAppLink, isPayOnDelivery } from '../../utils/whatsapp';

export const OrderSuccessModal: React.FC = () => {
  const {
    orderSuccessModalOpen,
    setOrderSuccessModalOpen,
    lastCompletedOrder,
    currentStore: viewedStore,
    stores,
    setActiveView,
    setMerchantTab,
    currentUser,
    isSuperAdmin
  } = useApp();

  const [copied, setCopied] = useState<'msg' | 'pay' | null>(null);
  const [notified, setNotified] = useState(false);

  // La tienda del pedido (puede ser distinta de la que se está mirando)
  const currentStore = (lastCompletedOrder && stores.find(s => s.id === lastCompletedOrder.storeId)) || viewedStore;

  if (!orderSuccessModalOpen || !lastCompletedOrder) return null;

  const order = lastCompletedOrder;
  const whatsappUrl = buildWhatsAppLink(currentStore.countryCode, currentStore.phone, order.whatsappMessageSent);
  const payOnDelivery = isPayOnDelivery(order.paymentMethod);
  const isPickup = order.deliveryType === 'pickup';
  const isVirtual = currentStore.storeType !== 'fisica';

  const copy = (text: string, what: 'msg' | 'pay') => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };

  const close = () => {
    setOrderSuccessModalOpen(false);
    setNotified(false);
  };

  // El acceso al panel solo tiene sentido para el dueño de la tienda o el superadmin.
  const canManageStore = Boolean(
    isSuperAdmin ||
    (currentUser && (currentUser.storeId === currentStore.id || currentStore.ownerId === currentUser.id))
  );

  const handleGoToMerchantOrders = () => {
    close();
    setActiveView('merchant');
    setMerchantTab('orders');
  };

  const money = (n: number) => formatPrice(n, currentStore.currency, currentStore.currencySymbol);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
    >
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 border border-neutral-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 id="order-success-title" className="text-xl font-extrabold text-neutral-900">¡Pedido registrado con éxito!</h3>
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <PackageCheck className="w-3.5 h-3.5" />
            Pedido #{order.orderNumber}
          </span>
          <p className="text-xs text-neutral-600 mt-2.5 leading-relaxed">
            <strong>{currentStore.name}</strong> ya lo tiene en su panel. Avísale por WhatsApp para coordinar el pago y la {isPickup ? 'hora de recojo' : 'entrega'}.
          </p>
        </div>

        {/* Resumen */}
        <div className="my-4 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-1.5">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-500">Cliente</span>
            <span className="font-semibold text-neutral-800 text-right">{order.customerName}</span>
          </div>
          {order.customerDni && (
            <div className="flex justify-between gap-3">
              <span className="text-neutral-500">DNI/CE</span>
              <span className="font-semibold text-neutral-800">{order.customerDni}</span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-neutral-500 flex items-center gap-1">
              {isPickup ? <StoreIcon className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
              {isPickup ? (isVirtual ? 'Recojo en punto de entrega' : 'Recojo en tienda') : 'Envío a domicilio'}
            </span>
          </div>
          {order.customerAddress && (
            <div className="flex items-start gap-1 text-neutral-700">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-emerald-600" />
              <span className="leading-snug">{order.customerAddress}</span>
            </div>
          )}
          <div className="flex justify-between gap-3 pt-1.5 border-t border-neutral-200">
            <span className="text-neutral-500">Total ({order.paymentMethod})</span>
            <span className="font-extrabold text-emerald-700 text-sm">{money(order.total)}</span>
          </div>
        </div>

        {/* Incentivo de pago anticipado */}
        {payOnDelivery ? (
          <div className="mb-4 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex gap-2.5">
            <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="leading-relaxed">
              Pagarás <strong>{money(order.total)}</strong> en efectivo al {isPickup ? 'recoger' : 'recibir'} tu pedido. Si puedes, ten el monto exacto o sencillo.
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
            <p className="flex items-center gap-1.5 font-extrabold text-amber-900">
              <Zap className="w-4 h-4 fill-amber-400 text-amber-600" />
              Paga ahora y recibe tu pedido más rápido
            </p>
            <ol className="space-y-1 text-[11px] leading-relaxed list-decimal pl-4 marker:font-bold">
              <li>Paga <strong>{money(order.total)}</strong> con <strong>{order.paymentMethod}</strong>.</li>
              <li>Toma una captura del comprobante.</li>
              <li>Envíala en el chat de WhatsApp de la tienda: los pedidos pagados se confirman y {isPickup ? 'se preparan' : 'se despachan'} primero.</li>
            </ol>
            {currentStore.paymentInstructions && (
              <div className="mt-1 p-2.5 rounded-lg bg-white border border-amber-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-[11px] flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Datos para pagar</span>
                  <button
                    type="button"
                    onClick={() => copy(currentStore.paymentInstructions || '', 'pay')}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'pay' ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                  </button>
                </div>
                <p className="whitespace-pre-line text-[11px] text-neutral-700 leading-relaxed">{currentStore.paymentInstructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setNotified(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>{notified ? 'Abrir WhatsApp otra vez' : 'Notificar a la tienda por WhatsApp'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {notified && !payOnDelivery && (
            <p className="text-[11px] text-center text-neutral-600">
              Recuerda enviar la captura de tu pago en ese mismo chat. 📎
            </p>
          )}

          <button
            type="button"
            onClick={() => copy(order.whatsappMessageSent, 'msg')}
            className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied === 'msg'
              ? <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700">¡Mensaje copiado!</span></>
              : <><Copy className="w-3.5 h-3.5" /><span>Copiar el mensaje del pedido</span></>}
          </button>
        </div>

        <div className={`mt-5 pt-4 border-t border-neutral-100 flex items-center text-xs text-neutral-500 ${canManageStore ? 'justify-between' : 'justify-center'}`}>
          <button onClick={close} className="text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer py-1">
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
