import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SAAS_PLANS } from '../../data/initialData';
import { PlanTier } from '../../types';
import { UserManagementTab } from './UserManagementTab';
import { BannersManagementTab } from './BannersManagementTab';
import { PromoCodesTab } from './PromoCodesTab';
import { PaymentConfigTab } from './PaymentConfigTab';
import { ErrorBoundary } from '../Common/ErrorBoundary';
import {
  ShieldCheck,
  Users,
  Plus,
  Store,
  CheckCircle2,
  CreditCard,
  X,
  Megaphone,
  Tag,
  QrCode
} from 'lucide-react';

export const SaasAdminView: React.FC = () => {
  const {
    users,
    banners,
    adminTab,
    setAdminTab,
    createNewStore,
    isRealtimeConnected
  } = useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New store form state
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('pro');

  // MRR Calculation
  const totalMRR = users.reduce((acc, user) => {
    const plan = SAAS_PLANS.find(p => p.id === user.subscription.planId);
    return acc + (plan?.priceMonthly || 0);
  }, 0);

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !merchantEmail.trim()) return;

    createNewStore(
      {
        name: storeName.trim(),
        tagline: tagline.trim() || 'Catálogo digital con pedidos por WhatsApp',
        phone: phone.trim() || '987654321',
        countryCode: '51',
        currency: 'PEN',
        currencySymbol: 'S/'
      },
      merchantName.trim() || 'Nuevo Comerciante',
      merchantEmail.trim(),
      selectedPlan
    );

    setCreateModalOpen(false);
    setStoreName('');
    setTagline('');
    setPhone('');
    setMerchantName('');
    setMerchantEmail('');
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 pb-24">
      {/* Top Banner */}
      <div className="bg-neutral-900 text-white border-b border-neutral-800">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Portal SuperAdministrador
                </span>
                {isRealtimeConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    WebSocket En Vivo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    Reconectando...
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-1">
                Administración SaaS de Catálogos & Comercios
              </h1>
              <p className="text-xs text-neutral-400 max-w-xl mt-1">
                Monitoreo global de inquilinos (tiendas), ingresos recurrentes mensuales (MRR) y suscripciones activas.
              </p>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dar de Alta Nueva Tienda</span>
            </button>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-800 overflow-x-auto pb-1">
            <button
              onClick={() => setAdminTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                adminTab === 'users'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestión de Usuarios & Roles</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                adminTab === 'users' ? 'bg-purple-700 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setAdminTab('plans')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                adminTab === 'plans'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Planes SaaS & Finanzas</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                adminTab === 'plans' ? 'bg-purple-700 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                S/ {totalMRR}/mes
              </span>
            </button>

            <button
              onClick={() => setAdminTab('banners')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                adminTab === 'banners'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Publicidad & Propaganda Inicio</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                adminTab === 'banners' ? 'bg-purple-700 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {banners.length}
              </span>
            </button>

            <button
              onClick={() => setAdminTab('promos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                adminTab === 'promos'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Cupones & Promociones</span>
            </button>

            <button
              onClick={() => setAdminTab('yape_config')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                adminTab === 'yape_config'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Cobros & QR Yape</span>
            </button>
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 space-y-6">
        {adminTab === 'users' && (
          <ErrorBoundary fallbackTitle="Error en Directorio de Usuarios" fallbackMessage="Ocurrió un error inesperado al renderizar el directorio de usuarios. Puedes reintentar sin perder tu sesión.">
            <UserManagementTab />
          </ErrorBoundary>
        )}
        {adminTab === 'banners' && (
          <ErrorBoundary fallbackTitle="Error en Banners Publicitarios">
            <BannersManagementTab />
          </ErrorBoundary>
        )}
        {adminTab === 'promos' && (
          <ErrorBoundary fallbackTitle="Error en Cupones y Promociones">
            <PromoCodesTab />
          </ErrorBoundary>
        )}
        {adminTab === 'yape_config' && (
          <ErrorBoundary fallbackTitle="Error en Configuración de Cobros Yape">
            <PaymentConfigTab />
          </ErrorBoundary>
        )}

        {adminTab === 'plans' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
              <div className="max-w-2xl">
                <h3 className="text-base font-black text-neutral-900">
                  Estructura de Monetización & Planes de Suscripción (S/)
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Valores configurados en Soles Peruanos para la adquisición y retención de comerciantes en la plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {SAAS_PLANS.map(plan => {
                  const subscribersCount = users.filter(u => u.subscription.planId === plan.id).length;
                  const estimatedMonthlyRevenue = subscribersCount * plan.priceMonthly;

                  return (
                    <div
                      key={plan.id}
                      className={`p-5 rounded-2xl border-2 flex flex-col justify-between ${
                        plan.recommended
                          ? 'border-purple-600 bg-purple-50/20'
                          : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-purple-700 tracking-wide">
                            {plan.name}
                          </span>
                          {plan.recommended && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white">
                              Más Vendido
                            </span>
                          )}
                        </div>

                        <div className="mt-3">
                          <span className="text-3xl font-black text-neutral-900">
                            S/ {plan.priceMonthly}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium"> / mes</span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 text-[11px] font-black">
                          <Store className="w-3.5 h-3.5 text-purple-600" />
                          <span>{plan.maxStores === 1 ? '1 Tienda digital' : `Hasta ${plan.maxStores} tiendas digitales`}</span>
                        </div>

                        <p className="text-[11px] text-neutral-600 mt-2">{plan.tagline}</p>

                        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2 text-xs">
                          {plan.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 text-neutral-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-[11px]">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-neutral-100 bg-neutral-50 -mx-5 -mb-5 p-4 rounded-b-2xl flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Suscriptores:</span>
                        <div className="text-right">
                          <span className="font-bold text-neutral-900">{subscribersCount} comercios</span>
                          <p className="text-[10px] text-emerald-700 font-bold">~ S/ {estimatedMonthlyRevenue}/mes</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Store Creation Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-extrabold text-neutral-900">
                Registrar Nueva Tienda en la Plataforma SaaS
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Nombre de la Tienda <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Boutique Urbana"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Eslogan corto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ropa y calzado exclusivo"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Nombre del Comerciante
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Javier Gómez"
                    value={merchantName}
                    onChange={e => setMerchantName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Correo del Comerciante <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="javier@tienda.com"
                    value={merchantEmail}
                    onChange={e => setMerchantEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    WhatsApp para Pedidos
                  </label>
                  <input
                    type="tel"
                    placeholder="5512345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Plan SaaS Asignado
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={e => setSelectedPlan(e.target.value as PlanTier)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {SAAS_PLANS.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (S/ {plan.priceMonthly}/mes)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Crear Tienda Inmediatamente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
