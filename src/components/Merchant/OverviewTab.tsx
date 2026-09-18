import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Plus,
  Share2,
  Crown
} from 'lucide-react';
import { formatPrice, generateCustomerStatusUpdateWhatsAppLink } from '../../utils/whatsapp';

export const OverviewTab: React.FC = () => {
  const {
    currentStore,
    currentStoreOrders,
    currentStoreProducts,
    setMerchantTab,
    updateOrderStatus,
    setActiveView,
    currentUser,
    effectiveUser
  } = useApp();

  // Metrics calculations
  const totalRevenue = currentStoreOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = currentStoreOrders.filter(o => o.status === 'pending_whatsapp');
  const confirmedOrders = currentStoreOrders.filter(o => o.status === 'confirmed' || o.status === 'preparing');
  const deliveredOrders = currentStoreOrders.filter(o => o.status === 'delivered');

  const averageTicket = currentStoreOrders.length > 0
    ? totalRevenue / Math.max(1, currentStoreOrders.filter(o => o.status !== 'cancelled').length)
    : 0;

  const handleOpenCustomerWhatsApp = (order: typeof currentStoreOrders[0]) => {
    const url = generateCustomerStatusUpdateWhatsAppLink(currentStore, order, order.status);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* SaaS Plan Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">
                Tu tienda opera bajo el <span className="text-emerald-400 capitalize">{(currentUser || effectiveUser).subscription.planId}</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-neutral-900">
                ACTIVO
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Productos utilizados: {currentStoreProducts.length} de {(currentUser || effectiveUser).subscription.planId === 'starter' ? 20 : (currentUser || effectiveUser).subscription.planId === 'pro' ? 150 : 'Ilimitados'}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMerchantTab('subscription')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Gestionar Plan SaaS
          </button>
          <button
            onClick={() => setActiveView('catalog')}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Catálogo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Ventas Acumuladas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-neutral-900">
            {formatPrice(totalRevenue, currentStore.currency, currentStore.currencySymbol)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{currentStoreOrders.filter(o => o.status !== 'cancelled').length} pedidos completados</span>
          </p>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Pedidos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-neutral-900">
            {currentStoreOrders.length}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Enviados y procesados por WhatsApp
          </p>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Pendientes WhatsApp</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {pendingOrders.length}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Requieren atención o confirmación
          </p>
        </div>

        {/* Average Ticket */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Ticket Promedio</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-neutral-900">
            {formatPrice(averageTicket, currentStore.currency, currentStore.currencySymbol)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Por compra concretada
          </p>
        </div>
      </div>

      {/* Quick Actions & Store Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Últimos Pedidos Recibidos</h3>
              <p className="text-xs text-neutral-500">Clientes que solicitaron pedidos por WhatsApp</p>
            </div>
            <button
              onClick={() => setMerchantTab('orders')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {currentStoreOrders.slice(0, 4).map(order => (
              <div key={order.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700 shrink-0">
                    #{order.orderNumber.replace('PED-', '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-neutral-900">{order.customerName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'preparing'
                          ? 'bg-blue-50 text-blue-700'
                          : order.status === 'confirmed'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.status === 'delivered' ? 'Entregado' : order.status === 'preparing' ? 'En preparación' : order.status === 'confirmed' ? 'Confirmado' : 'Pendiente WhatsApp'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      {order.items.length} productos • {new Date(order.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-neutral-900">
                    {formatPrice(order.total, currentStore.currency, currentStore.currencySymbol)}
                  </span>
                  <button
                    onClick={() => handleOpenCustomerWhatsApp(order)}
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                    title="Chatear con cliente en WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 fill-emerald-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Config & Share Widget */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5">
            <h3 className="text-sm font-bold text-neutral-900 mb-2">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button
                onClick={() => setMerchantTab('products')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Agregar nuevo producto
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              <button
                onClick={() => setMerchantTab('settings')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Configurar plantilla WhatsApp
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              <button
                onClick={() => setMerchantTab('reports')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Ver Reporte Mensual de Ventas
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          </div>

          {/* WhatsApp Connection info */}
          <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <MessageCircle className="w-4 h-4 fill-emerald-600" />
              <span>Número de WhatsApp Conectado</span>
            </div>
            <p className="text-base font-extrabold text-neutral-900 mt-2">
              +{currentStore.countryCode} {currentStore.phone}
            </p>
            <p className="text-[11px] text-neutral-600 mt-1">
              Todos los pedidos del catálogo se enviarán directamente a este número con los mensajes automáticos predefinidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
