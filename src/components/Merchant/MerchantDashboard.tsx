import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SAAS_PLANS, STORE_CATEGORIES, DEFAULT_STORE_LOGO } from '../../data/initialData';
import { OverviewTab } from './OverviewTab';
import { StoreProfileTab } from './StoreProfileTab';
import { ProductsTab } from './ProductsTab';
import { OrdersTab } from './OrdersTab';
import { ReportsTab } from './ReportsTab';
import { StoreSettingsTab } from './StoreSettingsTab';
import { SubscriptionTab } from './SubscriptionTab';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  Settings,
  Crown,
  ExternalLink,
  ChevronRight,
  User,
  AlertTriangle,
  ShieldAlert,
  Clock,
  ArrowRight,
  MessageCircle,
  Plus,
  Lock,
  Sparkles,
  Check,
  ChevronDown,
  Building,
  MapPin,
  X
} from 'lucide-react';
import { getSubscriptionStatusInfo, buildReactivationWhatsAppLink, getAdminWhatsApp } from '../../utils/subscriptionUtils';

export const MerchantDashboard: React.FC = () => {
  const {
    merchantTab,
    setMerchantTab,
    currentStore,
    currentStoreOrders,
    setActiveView,
    openStoreCatalog,
    currentUser,
    openPendingApprovalModal,
    openProfileModal,
    myStores,
    setCurrentStoreId,
    createAdditionalStore,
    openPlanPurchaseModal,
    isRealtimeConnected,
    yapeConfig
  } = useApp();
  // WhatsApp del SuperAdmin (SuperAdmin > Cobros & QR Yape)
  const adminWhatsApp = getAdminWhatsApp(yapeConfig);

  const merchantCleanPhone = currentUser?.phone ? currentUser.phone.replace(/\D/g, '').slice(-9) : '';

  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Moda');
  const [newStoreMode, setNewStoreMode] = useState<'virtual' | 'fisica'>('virtual');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStorePhone, setNewStorePhone] = useState(merchantCleanPhone);
  const [newStoreRuc, setNewStoreRuc] = useState('');
  const [newStoreDescription, setNewStoreDescription] = useState('');
  const [creatingStore, setCreatingStore] = useState(false);
  const [createStoreError, setCreateStoreError] = useState<string | null>(null);

  const pendingCount = currentStoreOrders.filter(o => o.status === 'pending_whatsapp').length;
  const subInfo = getSubscriptionStatusInfo(currentUser?.subscription, currentUser?.status);

  const currentPlan = SAAS_PLANS.find(p => p.id === currentUser?.subscription?.planId) || SAAS_PLANS[0];
  const maxStoresAllowed = currentPlan.maxStores || 1;
  const canCreateMoreStores = myStores.length < maxStoresAllowed;

  const newStoreSlug = newStoreName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

  const handleCreateStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStoreError(null);

    const trimmedName = newStoreName.trim();
    if (!trimmedName) {
      setCreateStoreError('Ingresa el nombre comercial de la tienda.');
      return;
    }

    const cleanPhone = newStorePhone.replace(/\D/g, '');
    if (cleanPhone.length !== 9) {
      setCreateStoreError('El WhatsApp de la tienda debe tener 9 dígitos.');
      return;
    }

    if (newStoreMode === 'fisica' && !newStoreAddress.trim()) {
      setCreateStoreError('Ingresa la dirección del local para la tienda física.');
      return;
    }

    if (newStoreRuc && newStoreRuc.replace(/\D/g, '').length !== 11) {
      setCreateStoreError('El RUC debe tener 11 dígitos.');
      return;
    }

    setCreatingStore(true);
    try {
      const res = await createAdditionalStore({
        name: trimmedName,
        slug: newStoreSlug || undefined,
        category: newStoreCategory,
        storeType: newStoreMode,
        phone: cleanPhone,
        address: newStoreMode === 'fisica' ? newStoreAddress.trim() : 'Virtual / Online',
        ruc: newStoreRuc ? newStoreRuc.replace(/\D/g, '') : '',
        description: newStoreDescription.trim() || undefined,
        tagline: `Catálogo digital de ${trimmedName}`,
        countryCode: '51',
        currency: 'PEN',
        currencySymbol: 'S/'
      });

      if (res.success) {
        setIsNewStoreModalOpen(false);
        setNewStoreName('');
        setNewStoreCategory('Moda');
        setNewStoreMode('virtual');
        setNewStoreAddress('');
        setNewStorePhone(merchantCleanPhone);
        setNewStoreRuc('');
        setNewStoreDescription('');
      } else {
        setCreateStoreError(res.error || 'Error al crear la tienda');
      }
    } catch (err: any) {
      setCreateStoreError(err.message || 'Error al crear la tienda');
    } finally {
      setCreatingStore(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen & KPIs', icon: LayoutDashboard },
    { id: 'profile', label: 'Identidad & Marca', icon: Store },
    { id: 'products', label: 'Productos & Stock', icon: Package },
    { id: 'orders', label: 'Pedidos WhatsApp', icon: ShoppingBag, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'reports', label: 'Reportes Mensuales', icon: TrendingUp },
    { id: 'settings', label: 'Delivery & WhatsApp', icon: Settings },
    { id: 'subscription', label: 'Suscripción SaaS', icon: Crown }
  ];

  return (
    <div className="min-h-screen bg-neutral-100/70 pb-24">
      {/* Top Merchant Bar */}
      <div className="bg-white border-b border-neutral-200/90 sticky top-16 z-20 shadow-2xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white p-0.5 border border-neutral-200 shadow-xs shrink-0">
              <img loading="lazy" decoding="async"
                src={currentStore.logo || DEFAULT_STORE_LOGO}
                alt={currentStore.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {myStores.length > 1 ? (
                  <select
                    value={currentStore.id}
                    onChange={e => setCurrentStoreId(e.target.value)}
                    className="font-black text-base sm:text-lg text-neutral-900 bg-white border border-neutral-200 rounded-xl px-2 py-0.5 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    {myStores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.id === currentStore.id ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h1 className="text-base sm:text-lg font-black text-neutral-900 leading-tight">
                    {currentStore.name}
                  </h1>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  Panel de Tienda
                </span>
                {isRealtimeConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Sincronización en tiempo real activa">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    En Vivo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Reconectando...">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Conectando...
                  </span>
                )}
                {maxStoresAllowed > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase tracking-wide">
                    {myStores.length}/{maxStoresAllowed} Tiendas
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 truncate max-w-xs sm:max-w-md">
                {currentStore.address || 'Ubicación no configurada'} • {currentStore.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {canCreateMoreStores ? (
              <button
                type="button"
                onClick={() => setIsNewStoreModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                title={`Crear una nueva tienda (Permitido hasta ${maxStoresAllowed} tiendas en tu plan)`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Tienda</span>
              </button>
            ) : maxStoresAllowed === 1 ? (
              <button
                type="button"
                onClick={() => openPlanPurchaseModal('pro')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer"
                title="Sube al Plan Crecimiento Pro para tener hasta 2 tiendas"
              >
                <Crown className="w-3.5 h-3.5 text-purple-600" />
                <span>Multitienda (Pro)</span>
              </button>
            ) : null}

            {/* Direct access to personal user profile modal */}
            <button
              onClick={openProfileModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              title="Ver y editar mis datos personales de comerciante"
            >
              <User className="w-3.5 h-3.5 text-neutral-500" />
              <span>Mi Perfil</span>
            </button>

            <button
              onClick={() => openStoreCatalog(currentStore.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              title="Abrir catálogo público en vivo como cliente"
            >
              <span>Ver mi catálogo en vivo</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs with Scroll Snap on mobile */}
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 border-t border-neutral-100">
          <div 
            className="flex items-center gap-1 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = merchantTab === tab.id;
              const isLocked = subInfo.isPendingApproval && tab.id !== 'subscription';

              return (
                <button
                  key={tab.id}
                  onClick={() => setMerchantTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer snap-start relative ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isLocked
                      ? 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  )}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && !isLocked && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-6">
        {/* 1. Banner de Tienda Pendiente de Autorización por SuperAdmin */}
        {(currentUser?.status === 'pending_approval' || currentUser?.subscription.status === 'pending_approval') && merchantTab !== 'subscription' && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase mb-1 border border-amber-300">
                  <span>Acceso Restringido</span>
                  <span>•</span>
                  <span>Requiere Autorización SuperAdmin</span>
                </div>
                <h3 className="text-base font-black text-neutral-900">
                  Tu tienda está registrada y en espera de activación
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 max-w-2xl">
                  Para comenzar a vender y publicar tus productos en la red multitienda, el SuperAdministrador debe validar y autorizar tu cuenta. Solicita la activación directa por WhatsApp.
                </p>
              </div>
            </div>

            <button
              onClick={() => openPendingApprovalModal({
                storeName: currentStore.name,
                merchantName: currentUser?.name || '',
                email: currentUser?.email || '',
                phone: currentUser?.phone || currentStore.phone || '',
                plan: currentUser?.subscription.planId || 'starter'
              })}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              Solicitar Autorización por WhatsApp →
            </button>
          </div>
        )}

        {/* 2. Banner Crítico: Suscripción Vencida / Pago Pendiente (Tienda Oculta) */}
        {!subInfo.isPendingApproval && subInfo.isExpired && merchantTab !== 'subscription' && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-rose-50 border-2 border-rose-500 text-rose-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-black uppercase mb-1 border border-rose-300">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span>Suscripción Vencida</span>
                  <span>•</span>
                  <span>Tienda Oculta al Público</span>
                </div>
                <h3 className="text-base font-black text-neutral-900">
                  Tu plan SaaS ha vencido y tu catálogo se encuentra temporalmente oculto
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 max-w-2xl">
                  Para no perder visibilidad de tus productos, clientes ni ventas directas a WhatsApp, actualiza tu plan y envía una solicitud inmediata de reactivación al SuperAdministrador.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <a
                href={buildReactivationWhatsAppLink(
                  currentStore.name,
                  currentUser?.name || '',
                  currentUser?.email || '',
                  currentUser?.subscription?.planId || 'starter',
                  adminWhatsApp.wa
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Reactivar Plan por WhatsApp ({adminWhatsApp.display}) →</span>
              </a>
              <button
                onClick={() => setMerchantTab('subscription')}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Ver Planes
              </button>
            </div>
          </div>
        )}

        {/* 3. Banner Preventivo: Suscripción Por Vencer (3 días o menos) */}
        {!subInfo.isPendingApproval && !subInfo.isExpired && subInfo.isExpiringSoon && merchantTab !== 'subscription' && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/50 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase mb-1 border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>Atención: {subInfo.statusBadgeText}</span>
                  <span>•</span>
                  <span>Renovación Preventiva</span>
                </div>
                <h3 className="text-base font-black text-neutral-900">
                  {subInfo.daysRemaining === 0
                    ? '¡Tu plan de suscripción vence hoy!'
                    : `Tu plan de suscripción vence en ${subInfo.daysRemaining} ${subInfo.daysRemaining === 1 ? 'día' : 'días'}`}
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 max-w-2xl">
                  Actualiza tu plan antes de que expire para no perder visibilidad en el Marketplace, evitar la suspensión de tu catálogo y continuar recibiendo pedidos sin interrupción.
                </p>
              </div>
            </div>

            <button
              onClick={() => setMerchantTab('subscription')}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5"
            >
              <span>Actualizar Plan Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {subInfo.isPendingApproval && merchantTab !== 'subscription' ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200 text-center max-w-xl mx-auto space-y-5 shadow-xs my-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase mb-2">
                <span>Acceso Bloqueado Temporalmente</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
                Tu tienda está en espera de autorización
              </h2>
              <p className="text-xs text-neutral-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                Has registrado tu tienda correctamente. Para activar la administración de productos, pedidos y publicar tu catálogo al público, el SuperAdministrador debe verificar tu comprobante de pago y autorizar tu cuenta.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => openPlanPurchaseModal(currentUser?.subscription?.planId)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ver / Enviar Comprobante Yape</span>
              </button>

              <button
                type="button"
                onClick={() => openPendingApprovalModal({
                  storeName: currentStore.name,
                  merchantName: currentUser?.name || '',
                  email: currentUser?.email || '',
                  phone: currentUser?.phone || currentStore.phone || '',
                  plan: currentUser?.subscription?.planId || 'starter'
                })}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar por WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {merchantTab === 'overview' && <OverviewTab />}
            {merchantTab === 'profile' && <StoreProfileTab />}
            {merchantTab === 'products' && <ProductsTab />}
            {merchantTab === 'orders' && <OrdersTab />}
            {merchantTab === 'reports' && <ReportsTab />}
            {merchantTab === 'settings' && <StoreSettingsTab />}
            {merchantTab === 'subscription' && <SubscriptionTab />}
          </>
        )}
      </main>

      {/* Modal para Crear Nueva Tienda Adicional */}
      {isNewStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-neutral-200 space-y-4 my-8 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">
                    Crear Nueva Tienda
                  </h3>
                  <span className="text-[11px] text-purple-700 font-bold">
                    Tienda {myStores.length + 1} de {maxStoresAllowed} permitidas en tu {currentPlan.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewStoreModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createStoreError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createStoreError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStoreSubmit} className="space-y-3.5 text-xs">
              {/* 1. Nombre comercial * */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Nombre comercial *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Store className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Boutique Florencia"
                    value={newStoreName}
                    onChange={e => setNewStoreName(e.target.value)}
                    className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-neutral-200 bg-white font-bold text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-hidden transition-all"
                  />
                </div>
                {newStoreName.trim() && (
                  <p className="text-[11px] text-purple-700 font-medium mt-1">
                    URL pública: /{newStoreSlug}
                  </p>
                )}
              </div>

              {/* 2. Rubro * & Modalidad * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Rubro *
                  </label>
                  <select
                    value={newStoreCategory}
                    onChange={e => setNewStoreCategory(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-800 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-hidden transition-all cursor-pointer h-[42px]"
                  >
                    {STORE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Modalidad *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-[42px]">
                    <button
                      type="button"
                      onClick={() => setNewStoreMode('virtual')}
                      className={`text-xs font-bold rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        newStoreMode === 'virtual'
                          ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-2xs'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <span>🌐 Virtual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewStoreMode('fisica')}
                      className={`text-xs font-bold rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        newStoreMode === 'fisica'
                          ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-2xs'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <span>🏬 Física</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Si Modalidad es física: Dirección del local * */}
              {newStoreMode === 'fisica' && (
                <div className="animate-in fade-in duration-150">
                  <label className="font-bold text-neutral-700 block mb-1">
                    Dirección del local *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Jr. Comercio 123, Centro de Atalaya"
                      value={newStoreAddress}
                      onChange={e => setNewStoreAddress(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>
              )}

              {/* 3. WhatsApp tienda * & RUC (opc) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-neutral-700">
                      WhatsApp tienda *
                    </label>
                    {merchantCleanPhone && newStorePhone !== merchantCleanPhone && (
                      <button
                        type="button"
                        onClick={() => setNewStorePhone(merchantCleanPhone)}
                        className="text-[10px] text-purple-700 font-bold hover:underline cursor-pointer"
                      >
                        Usar el mío
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500">
                      +51
                    </span>
                    <input
                      type="tel"
                      maxLength={9}
                      required
                      placeholder="987654321"
                      value={newStorePhone}
                      onChange={e => setNewStorePhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-2.5 pl-12 pr-3 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    RUC <span className="font-normal text-neutral-400">(opc)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <Building className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="11 dígitos"
                      value={newStoreRuc}
                      onChange={e => setNewStoreRuc(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-neutral-200 bg-white font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 4. ¿A qué se dedica? (opc) */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  ¿A qué se dedica? <span className="font-normal text-neutral-400">(opc)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve descripción de tu negocio o productos que ofreces"
                  value={newStoreDescription}
                  onChange={e => setNewStoreDescription(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 focus:outline-hidden transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStoreModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingStore}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {creatingStore ? (
                    <span>Creando tienda...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Crear Tienda</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
