import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import {
  Search,
  MessageCircle,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  FileText,
  User,
  MapPin,
  CreditCard
} from 'lucide-react';
import {
  formatPrice,
  generateCustomerStatusUpdateWhatsAppLink
} from '../../utils/whatsapp';

export const OrdersTab: React.FC = () => {
  const {
    currentStoreOrders,
    currentStore,
    updateOrderStatus
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const statusOptions: { value: string; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: currentStoreOrders.length },
    { value: 'pending_whatsapp', label: 'Pendientes WhatsApp', count: currentStoreOrders.filter(o => o.status === 'pending_whatsapp').length },
    { value: 'confirmed', label: 'Confirmados', count: currentStoreOrders.filter(o => o.status === 'confirmed').length },
    { value: 'preparing', label: 'En Preparación', count: currentStoreOrders.filter(o => o.status === 'preparing').length },
    { value: 'delivered', label: 'Entregados', count: currentStoreOrders.filter(o => o.status === 'delivered').length },
    { value: 'cancelled', label: 'Cancelados', count: currentStoreOrders.filter(o => o.status === 'cancelled').length }
  ];

  const filteredOrders = currentStoreOrders.filter(o => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleSendWhatsAppUpdate = (order: Order, status: OrderStatus) => {
    const url = generateCustomerStatusUpdateWhatsAppLink(currentStore, order, status);
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Entregado
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-3 h-3" /> En Preparación
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <CheckCircle2 className="w-3 h-3" /> Confirmado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-600">
            <XCircle className="w-3 h-3" /> Cancelado
          </span>
        );
      case 'pending_whatsapp':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pendiente WhatsApp
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900">
            Gestión de Pedidos Recibidos ({currentStoreOrders.length})
          </h2>
          <p className="text-xs text-neutral-500">
            Control de pedidos generados desde el catálogo y enviados a WhatsApp.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === opt.value
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
              }`}
            >
              {opt.label} ({opt.count})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, # pedido o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Pedido / Fecha</th>
                <th className="py-3 px-4">Cliente & Contacto</th>
                <th className="py-3 px-4">Ítems</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Estado del Pedido</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-neutral-900 font-mono">
                        #{order.orderNumber}
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        {new Date(order.createdAt).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-neutral-900">{order.customerName}</p>
                      <p className="text-[11px] text-neutral-500">{order.customerPhone}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-700">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} productos
                      </span>
                      <p className="text-[10px] text-neutral-400 truncate max-w-[160px]">
                        {order.items.map(i => i.productName).join(', ')}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-extrabold text-neutral-900">
                        {formatPrice(order.total, currentStore.currency, currentStore.currencySymbol)}
                      </span>
                      <p className="text-[10px] text-neutral-500 truncate">
                        {order.paymentMethod}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="text-[11px] border border-neutral-200 rounded-lg p-1 bg-neutral-50 text-neutral-700 cursor-pointer focus:outline-none"
                        >
                          <option value="pending_whatsapp">Pendiente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="preparing">En preparación</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSendWhatsAppUpdate(order, order.status)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title="Enviar actualización al cliente por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 fill-emerald-600" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalle</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No se encontraron pedidos con este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-neutral-900 font-mono">
                  Pedido #{selectedOrder.orderNumber}
                </h3>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Customer summary */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="flex items-center gap-2 text-neutral-700 font-bold">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{selectedOrder.customerAddress} ({selectedOrder.deliveryType === 'delivery' ? 'Envío' : 'Retiro'})</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Pago: {selectedOrder.paymentMethod}</span>
                </div>
                {selectedOrder.notes && (
                  <p className="text-[11px] text-amber-700 italic pt-1 border-t border-neutral-200">
                    Notas: {selectedOrder.notes}
                  </p>
                )}
              </div>

              {/* Items breakdown */}
              <div>
                <span className="font-bold text-neutral-700 block mb-2">Productos ordenados</span>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-2.5">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-100"
                          />
                        )}
                        <div>
                          <p className="font-bold text-neutral-900">{item.quantity}x {item.productName}</p>
                          {Object.keys(item.selectedVariants).length > 0 && (
                            <p className="text-[10px] text-neutral-500">
                              {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-extrabold text-neutral-900">
                        {formatPrice(item.subtotal, currentStore.currency, currentStore.currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-3.5 rounded-xl bg-neutral-50 space-y-1.5 text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-neutral-800">
                    {formatPrice(selectedOrder.subtotal, currentStore.currency, currentStore.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de envío:</span>
                  <span className="font-bold text-neutral-800">
                    {selectedOrder.deliveryFee > 0
                      ? formatPrice(selectedOrder.deliveryFee, currentStore.currency, currentStore.currencySymbol)
                      : 'Gratis'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-neutral-900 pt-1.5 border-t border-neutral-200">
                  <span>Total a cobrar:</span>
                  <span className="text-emerald-700">
                    {formatPrice(selectedOrder.total, currentStore.currency, currentStore.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Status Updater */}
              <div className="pt-2">
                <label className="block font-semibold text-neutral-700 mb-1.5">
                  Actualizar estado del pedido:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['confirmed', 'preparing', 'delivered', 'cancelled'] as OrderStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-colors cursor-pointer ${
                        selectedOrder.status === st
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {st === 'confirmed' ? 'Confirmar' : st === 'preparing' ? 'Preparar' : st === 'delivered' ? 'Entregar' : 'Cancelar'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-semibold cursor-pointer"
              >
                Cerrar
              </button>

              <button
                onClick={() => handleSendWhatsAppUpdate(selectedOrder, selectedOrder.status)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Notificar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
