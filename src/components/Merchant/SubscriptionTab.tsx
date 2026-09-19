import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PlanTier, SubscriptionInvoice } from '../../types';
import { SAAS_PLANS } from '../../data/initialData';
import { api } from '../../services/api';
import {
  Crown,
  Check,
  CheckCircle2,
  Calendar,
  CreditCard,
  Download,
  AlertCircle,
  Zap,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  MessageCircle,
  Clock,
  FileText,
  Printer,
  X,
  Loader2,
  Receipt,
  ExternalLink
} from 'lucide-react';
import { formatPrice } from '../../utils/whatsapp';
import { getSubscriptionStatusInfo, buildReactivationWhatsAppLink, getAdminWhatsApp } from '../../utils/subscriptionUtils';

export const SubscriptionTab: React.FC = () => {
  const {
    currentUser,
    effectiveUser,
    currentStoreProducts,
    currentStoreOrders,
    upgradeSubscription,
    currentStore,
    openPlanPurchaseModal,
    yapeConfig
  } = useApp();
  // WhatsApp del SuperAdmin (SuperAdmin > Cobros & QR Yape)
  const adminWhatsApp = getAdminWhatsApp(yapeConfig);

  const user = currentUser || effectiveUser;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInvoices = async () => {
      try {
        setLoadingInvoices(true);
        const data = await api.getMyInvoices();
        if (isMounted) setInvoices(data);
      } catch (err) {
        console.error('Error cargando historial de facturación:', err);
      } finally {
        if (isMounted) setLoadingInvoices(false);
      }
    };
    fetchInvoices();
    return () => {
      isMounted = false;
    };
  }, [user.subscription.planId, user.subscription.currentPeriodEnd, user.subscription.status]);

  const formatDatePE = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTimePE = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const currentPlan = SAAS_PLANS.find(p => p.id === user.subscription.planId) || SAAS_PLANS[0];

  const handleSelectPlan = (planId: PlanTier) => {
    openPlanPurchaseModal(planId);
  };

  const productUsagePercent = Math.min(
    100,
    Math.round((currentStoreProducts.length / currentPlan.maxProducts) * 100)
  );

  const subInfo = getSubscriptionStatusInfo(user.subscription, user.status);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-base font-extrabold text-neutral-900">
          Suscripción SaaS & Planes de Servicio
        </h2>
        <p className="text-xs text-neutral-500">
          Gestiona el nivel de tu cuenta, límites de productos y facturación de la plataforma.
        </p>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Alerta Crítica si el plan está vencido */}
      {subInfo.isExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-black uppercase mb-1 border border-rose-300">
                <span>Estado: {subInfo.statusBadgeText}</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-neutral-900">
                Tu tienda se encuentra oculta al público por falta de pago
              </h4>
              <p className="text-xs text-neutral-600 mt-0.5">
                Para rehabilitar la visibilidad de tu catálogo multitienda y continuar vendiendo por WhatsApp, solicita la reactivación inmediata con el SuperAdministrador.
              </p>
            </div>
          </div>

          <a
            href={buildReactivationWhatsAppLink(
              currentStore.name,
              user.name,
              user.email,
              user.subscription.planId,
              adminWhatsApp.wa
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Reactivar Plan por WhatsApp ({adminWhatsApp.display}) →</span>
          </a>
        </div>
      )}

      {/* Alerta Preventiva si está por vencer */}
      {!subInfo.isExpired && subInfo.isExpiringSoon && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-amber-950 flex items-center gap-3.5 shadow-sm animate-in fade-in">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs sm:text-sm font-black text-neutral-900 flex items-center gap-2">
              <span>Plan Por Vencer: {subInfo.statusBadgeText}</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-neutral-600 mt-0.5">
              Te recomendamos renovar o cambiar tu plan a continuación para garantizar la continuidad operativa de tu tienda en línea y evitar suspensiones.
            </p>
          </div>
        </div>
      )}

      {/* Current Active Plan Overview Card */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-950 text-white rounded-2xl p-6 shadow-md border border-neutral-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide ${
                subInfo.isExpired 
                  ? 'bg-rose-500 text-white' 
                  : subInfo.isExpiringSoon 
                    ? 'bg-amber-400 text-neutral-950' 
                    : 'bg-emerald-500 text-neutral-950'
              }`}>
                {subInfo.statusBadgeText}
              </span>
              <span className="text-xs text-neutral-400">
                Ciclo: {user.subscription.billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
              </span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight">
              {currentPlan.name}
            </h3>
            <p className="text-xs text-neutral-300 max-w-md">
              {currentPlan.tagline}
            </p>

            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Renovación: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {user.subscription.paymentMethod && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{user.subscription.paymentMethod.brand} terminada en {user.subscription.paymentMethod.last4}</span>
                </div>
              )}
            </div>
          </div>

          {/* Usage Meters */}
          <div className="w-full md:w-72 bg-neutral-800/80 backdrop-blur-xs p-4 rounded-xl border border-neutral-700 space-y-3 shrink-0">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-neutral-300">
                <span>Productos activos:</span>
                <span className="text-white font-mono">
                  {currentStoreProducts.length} / {currentPlan.maxProducts === 9999 ? '∞' : currentPlan.maxProducts}
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    productUsagePercent > 85 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, productUsagePercent)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-neutral-300">
                <span>Pedidos recibidos:</span>
                <span className="text-white font-mono">
                  {currentStoreOrders.length} / {currentPlan.maxOrdersPerMonth}
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (currentStoreOrders.length / currentPlan.maxOrdersPerMonth) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Cycle Switcher */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-neutral-900' : 'text-neutral-600'}`}>
          Facturación Mensual
        </span>
        <button
          type="button"
          onClick={() => setBillingCycle(c => c === 'monthly' ? 'annual' : 'monthly')}
          className="w-12 h-6 rounded-full bg-neutral-200 p-0.5 transition-colors relative cursor-pointer"
        >
          <div
            className={`w-5 h-5 rounded-full bg-emerald-600 transition-transform ${
              billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-neutral-900' : 'text-neutral-600'}`}>
          <span>Facturación Anual</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Ahorra 2 meses
          </span>
        </span>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SAAS_PLANS.map(plan => {
          const isCurrent = user.subscription.planId === plan.id;
          const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceAnnual / 12);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 ${
                isCurrent
                  ? 'border-2 border-emerald-600 shadow-lg'
                  : plan.recommended
                  ? 'border-2 border-neutral-900 shadow-md'
                  : 'border border-neutral-200/80 shadow-xs'
              }`}
            >
              {plan.recommended && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-neutral-900 text-white uppercase tracking-wider">
                  Más Popular
                </span>
              )}

              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" /> Tu Plan Actual
                </span>
              )}

              <div>
                <h4 className="text-base font-extrabold text-neutral-900">{plan.name}</h4>
                <p className="text-xs text-neutral-500 mt-1 min-h-[32px]">{plan.tagline}</p>

                <div className="mt-4 pb-4 border-b border-neutral-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-neutral-900">
                      {price === 0 ? 'Gratis' : formatPrice(price, currentStore.currency, currentStore.currencySymbol)}
                    </span>
                    {price > 0 && (
                      <span className="text-xs font-semibold text-neutral-500">
                        / mes
                      </span>
                    )}
                  </div>
                  {billingCycle === 'annual' && plan.priceAnnual > 0 && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      Cobrado anualmente ({formatPrice(plan.priceAnnual, currentStore.currency, currentStore.currencySymbol)}/año)
                    </p>
                  )}
                </div>

                {/* Features checklist */}
                <ul className="mt-5 space-y-2.5 text-xs text-neutral-600">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                {isCurrent ? (
                  subInfo.isExpired || subInfo.daysRemaining <= 3 ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan.id)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Renovar Plan Actual</span>
                      </button>
                      <p className="text-[10px] text-amber-700 font-semibold text-center mt-2">
                        {subInfo.isExpired
                          ? 'Suscripción vencida. ¡Renueva para reactivar!'
                          : subInfo.daysRemaining === 0
                          ? '¡Tu plan vence hoy! Ya puedes renovar.'
                          : `Vence en ${subInfo.daysRemaining} día(s). ¡Renovación habilitada!`}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        disabled={true}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed flex items-center justify-center gap-1.5 shadow-none"
                        title={`Renovación disponible a partir de los últimos 3 días antes de vencer. Te quedan ${subInfo.daysRemaining} días.`}
                      >
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Renovar Plan Actual</span>
                      </button>
                      <p className="text-[10px] text-neutral-500 font-medium text-center mt-2 leading-tight">
                        Renovación disponible a partir de los últimos 3 días (te quedan <strong className="text-neutral-800 font-bold">{subInfo.daysRemaining} días</strong> vigentes).
                      </p>
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      plan.recommended
                        ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {`Adquirir ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial Real de Facturación */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Historial de Facturación de tu Tienda
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Comprobantes de pago y recibos de suscripción emitidos en tiempo real por la plataforma SaaS.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
            {invoices.length} comprobante(s) registrado(s)
          </span>
        </div>

        {loadingInvoices ? (
          <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs font-medium">Cargando comprobantes de facturación...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-10 text-center text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-xs font-bold text-neutral-700">No hay comprobantes de facturación registrados</p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-sm mx-auto">
              Cuando actives o renueves tu plan por Yape o con un cupón promocional, tus comprobantes aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">N° Comprobante</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Concepto & Cobertura</th>
                  <th className="py-2.5 px-3">Método / Ref.</th>
                  <th className="py-2.5 px-3">Monto</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-neutral-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-neutral-600 whitespace-nowrap">
                      {formatDatePE(inv.created_at)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-neutral-900">
                        Plan {inv.plan_name}
                        <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                          {inv.billing_cycle === 'annual' ? 'Anual' : 'Mensual'}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {formatDatePE(inv.period_start)} al {formatDatePE(inv.period_end)}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-neutral-800">
                        {inv.payment_method}
                      </span>
                      {inv.reference && (
                        <div className="text-[10px] text-neutral-500 truncate max-w-[140px]" title={inv.reference}>
                          {inv.reference}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-neutral-900 whitespace-nowrap">
                      {inv.amount <= 0 ? (
                        <span className="text-emerald-700 font-bold">S/ 0.00 (Gratis)</span>
                      ) : (
                        `S/ ${inv.amount.toFixed(2)} PEN`
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status === 'paid' ? 'Pagado' : inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-emerald-700 text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
                        title="Ver y descargar comprobante"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Comprobante Oficial */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900">
                    Comprobante de Suscripción Electrónico
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    {selectedInvoice.invoice_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido imprimible del recibo */}
            <div className="p-6 overflow-y-auto space-y-6 text-neutral-800 print:p-0">
              {/* Encabezado del Comprobante */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-5">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-neutral-900 flex items-center gap-1.5">
                    <span className="text-emerald-700">Jamuy</span>Wasi
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Plataforma SaaS de Catálogos Virtuales</p>
                  <p className="text-[11px] text-neutral-400 mt-1">R.U.C. 20608942183 • Lima, Perú</p>
                </div>
                <div className="text-right border border-emerald-200 bg-emerald-50/60 rounded-xl px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    RECIBO ELECTRÓNICO
                  </p>
                  <p className="text-sm font-black text-neutral-900 font-mono">
                    {selectedInvoice.invoice_number}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {formatDateTimePE(selectedInvoice.created_at)}
                  </p>
                </div>
              </div>

              {/* Información del Cliente & Comercio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200/70 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1 tracking-wider">
                    Datos del Comercio / Titular
                  </p>
                  <p className="font-bold text-neutral-900">
                    {selectedInvoice.store_name || currentStore?.name || 'Mi Tienda'}
                  </p>
                  <p className="text-neutral-600 mt-0.5">
                    Titular: <span className="font-medium text-neutral-800">{selectedInvoice.customer_name || user.name}</span>
                  </p>
                  <p className="text-neutral-600">
                    DNI/RUC: <span className="font-medium text-neutral-800">{selectedInvoice.customer_dni || user.dni || 'No especificado'}</span>
                  </p>
                  <p className="text-neutral-600 truncate">
                    Correo: <span className="font-medium text-neutral-800">{user.email}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1 tracking-wider">
                    Detalles del Pago & Vigencia
                  </p>
                  <p className="text-neutral-600">
                    Método de Pago: <span className="font-bold text-neutral-900">{selectedInvoice.payment_method}</span>
                  </p>
                  {selectedInvoice.reference && (
                    <p className="text-neutral-600">
                      Referencia: <span className="font-medium text-neutral-800">{selectedInvoice.reference}</span>
                    </p>
                  )}
                  <p className="text-neutral-600 mt-1">
                    Vigencia del Servicio:
                  </p>
                  <p className="font-semibold text-emerald-800 text-[11px]">
                    {formatDatePE(selectedInvoice.period_start)} al {formatDatePE(selectedInvoice.period_end)}
                  </p>
                </div>
              </div>

              {/* Tabla de Conceptos */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100/70 text-neutral-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Descripción del Servicio</th>
                      <th className="py-2 px-3 text-center">Ciclo</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    <tr>
                      <td className="py-3 px-3">
                        <p className="font-bold text-neutral-900">
                          Suscripción JamuyWasi - Plan {selectedInvoice.plan_name}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Activación de plataforma multitienda, catálogo WhatsApp, pasarela Yape y soporte.
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-600 capitalize">
                        {selectedInvoice.billing_cycle === 'annual' ? 'Anual (12 Meses)' : 'Mensual (30 Días)'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-neutral-900">
                        {selectedInvoice.amount <= 0 ? 'S/ 0.00' : `S/ ${selectedInvoice.amount.toFixed(2)}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Resumen Total */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="text-xs text-neutral-500 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Estado: PAGADO & CONFORME
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Comprobante digital sin valor tributario directo emitido conforme a las políticas de JamuyWasi.
                  </p>
                </div>
                <div className="text-right shrink-0 bg-neutral-900 text-white px-4 py-2.5 rounded-xl">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400">Total Abonado</p>
                  <p className="text-lg font-black text-emerald-400">
                    {selectedInvoice.amount <= 0 ? 'S/ 0.00' : `S/ ${selectedInvoice.amount.toFixed(2)}`} PEN
                  </p>
                </div>
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-600" />
                Imprimir / Guardar PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
