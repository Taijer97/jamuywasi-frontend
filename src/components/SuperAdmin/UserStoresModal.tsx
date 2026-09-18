import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, StoreConfig, PlanTier } from '../../types';
import { SAAS_PLANS, STORE_CATEGORIES } from '../../data/initialData';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  Store,
  Crown,
  ExternalLink,
  Plus,
  X,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutDashboard,
  Power,
  Info,
  ShieldCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface UserStoresModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserStoresModal: React.FC<UserStoresModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const {
    stores,
    openStoreCatalog,
    setCurrentStoreId,
    setActiveView,
    setMerchantTab,
    updateStoreConfig,
    refreshMyStores,
    refreshUsers,
    addLiveNotification
  } = useApp();

  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Moda');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreType, setNewStoreType] = useState<'virtual' | 'fisica'>('virtual');
  const [newStoreRuc, setNewStoreRuc] = useState('');
  const [newStoreDescription, setNewStoreDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingStoreId, setTogglingStoreId] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const userPlanId = (user.subscription?.planId as PlanTier) || 'starter';
  const planConfig = SAAS_PLANS.find(p => p.id === userPlanId) || SAAS_PLANS[0];
  const maxStoresAllowed = planConfig.maxStores || 1;

  // Tiendas asignadas o pertenecientes a este usuario
  const userStores: StoreConfig[] = stores.filter(
    s => s.ownerId === user.id || (Boolean(user.dni) && s.ownerId === user.dni) || s.id === user.storeId
  );

  const canCreateMore = userStores.length < maxStoresAllowed;

  const handleOpenStorePanel = (store: StoreConfig) => {
    setCurrentStoreId(store.id);
    setActiveView('merchant');
    setMerchantTab('overview');
    onClose();
  };

  const handleOpenPublicCatalog = (store: StoreConfig) => {
    openStoreCatalog(store.id);
    onClose();
  };

  const handleToggleStoreStatus = async (store: StoreConfig) => {
    setTogglingStoreId(store.id);
    try {
      const updatedStatus = !store.isActive;
      await updateStoreConfig({
        ...store,
        isActive: updatedStatus
      });
      addLiveNotification({
        title: updatedStatus ? 'Tienda Activada' : 'Tienda Pausada',
        message: `La tienda "${store.name}" ahora está ${updatedStatus ? 'activa en el catálogo público' : 'pausada temporalmente'}.`,
        type: updatedStatus ? 'success' : 'warning'
      });
    } catch (err: any) {
      console.error('Error al cambiar estado de la tienda:', err);
    } finally {
      setTogglingStoreId(null);
    }
  };

  const handleCreateStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      setFormError('Ingresa el nombre de la nueva tienda');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const createdStore = await api.createStore({
        name: newStoreName.trim(),
        category: newStoreCategory,
        phone: newStorePhone.trim() || user.phone || '987654321',
        address: newStoreAddress.trim() || 'Perú',
        storeType: newStoreType,
        ruc: newStoreRuc ? newStoreRuc.replace(/\D/g, '') : '',
        description: newStoreDescription.trim() || `Bienvenido a ${newStoreName.trim()}. Haz tus pedidos directo por WhatsApp.`,
        countryCode: '51',
        currency: 'PEN',
        currencySymbol: 'S/',
        tagline: `Catálogo exclusivo de ${newStoreName.trim()}`,
        deliveryFee: 10,
        freeDeliveryThreshold: 150,
        allowPickup: true,
        paymentInstructions: 'Aceptamos transferencias, Yape y Plin.',
        whatsappMessageTemplate: '¡Hola {store_name}! Quisiera confirmar mi pedido #{order_number}:\n{items}\nTotal: {total}',
        themeColor: 'emerald',
        ownerId: user.id,
        owner_id: user.id
      } as any);

      await refreshUsers();
      await refreshMyStores();

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}

      addLiveNotification({
        title: 'Nueva Tienda Asignada',
        message: `Se creó y asignó exitosamente la tienda "${createdStore.name}" al usuario ${user.name}.`,
        type: 'success'
      });

      // Reset form
      setNewStoreName('');
      setNewStoreCategory('Moda');
      setNewStorePhone('');
      setNewStoreAddress('');
      setNewStoreRuc('');
      setNewStoreDescription('');
      setIsAddingStore(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al crear la tienda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200/80 w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-purple-950 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/30 text-purple-300 flex items-center justify-center font-black text-base shrink-0 shadow-xs">
              {(user.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black tracking-tight text-white truncate">
                  Tiendas a Cargo: {user.name}
                </h3>
                {user.role === 'superadmin' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    SuperAdmin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Store className="w-3 h-3" />
                    Comerciante
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-300 mt-1 flex-wrap">
                <span>{user.email}</span>
                {user.dni && <span>• DNI: {user.dni}</span>}
                {user.phone && <span>• Tel: {user.phone}</span>}
              </div>

              {/* Plan Capacity Banner */}
              <div className="mt-3 flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-500/30 text-purple-200">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-neutral-200">
                      Plan SaaS: <strong className="text-white uppercase">{planConfig.name}</strong>
                    </span>
                    <span className="text-[11px] text-neutral-400 ml-1.5">
                      (Permite hasta {maxStoresAllowed} {maxStoresAllowed === 1 ? 'tienda' : 'tiendas'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
                    userStores.length >= maxStoresAllowed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {userStores.length} de {maxStoresAllowed} {maxStoresAllowed === 1 ? 'tienda activa' : 'tiendas activas'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* List of Stores */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Tiendas Asignadas ({userStores.length})
              </h4>
              {canCreateMore && !isAddingStore && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingStore(true);
                    setNewStorePhone(user.phone || '');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Dar de Alta Tienda</span>
                </button>
              )}
            </div>

            {userStores.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-neutral-50 border border-neutral-200 border-dashed space-y-2">
                <Store className="w-8 h-8 text-neutral-400 mx-auto" />
                <h5 className="font-bold text-sm text-neutral-800">
                  Este usuario aún no tiene tiendas registradas
                </h5>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  Su plan {planConfig.name} le permite gestionar hasta {maxStoresAllowed} tienda(s). Puedes dar de alta su primera tienda a continuación.
                </p>
                {canCreateMore && !isAddingStore && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingStore(true);
                      setNewStorePhone(user.phone || '');
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Tienda para {user.name}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {userStores.map((store, index) => (
                  <div
                    key={store.id}
                    className="p-4 rounded-2xl border border-neutral-200/90 hover:border-purple-300 bg-white shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={store.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=120&auto=format&fit=crop&q=80'}
                          alt={store.name}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 bg-neutral-100 shadow-2xs"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-black flex items-center justify-center border border-white">
                          {index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-black text-sm text-neutral-900 truncate">
                            {store.name}
                          </h5>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            store.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${store.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {store.isActive ? 'En Vivo' : 'Pausada'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                            {store.storeType === 'fisica' ? '🏬 Física' : '🌐 Virtual'}
                          </span>
                        </div>

                        <p className="text-xs text-purple-700 font-mono font-medium mt-0.5">
                          /{store.slug}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            {store.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-400" />
                            {store.address || 'Ubicación no especificada'}
                          </span>
                          {store.category && (
                            <span className="text-neutral-600 font-medium">
                              • {store.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Store Quick Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStoreStatus(store)}
                        disabled={togglingStoreId === store.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                          store.isActive
                            ? 'border-neutral-200 hover:border-rose-300 hover:bg-rose-50 text-neutral-600 hover:text-rose-700'
                            : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                        title={store.isActive ? 'Pausar tienda (ocultar del catálogo público)' : 'Reactivar tienda'}
                      >
                        <Power className="w-3 h-3" />
                        <span>{store.isActive ? 'Pausar' : 'Activar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPublicCatalog(store)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        title="Abrir catálogo público de clientes"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Ver Catálogo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenStorePanel(store)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
                        title="Entrar a administrar este panel de tienda como SuperAdmin"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Panel Tienda</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to Add Store for this User */}
          {isAddingStore && canCreateMore && (
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Dar de Alta Nueva Tienda para {user.name}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingStore(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateStoreSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Nombre Comercial de la Tienda *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Boutique Florencia"
                      value={newStoreName}
                      onChange={e => setNewStoreName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Rubro / Categoría *
                    </label>
                    <select
                      value={newStoreCategory}
                      onChange={e => setNewStoreCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                    >
                      {STORE_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Modalidad *
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewStoreType('virtual')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          newStoreType === 'virtual'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        🌐 Virtual
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewStoreType('fisica')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          newStoreType === 'fisica'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        🏬 Física
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      WhatsApp tienda *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500">
                        +51
                      </span>
                      <input
                        type="tel"
                        maxLength={9}
                        required
                        placeholder="987654321"
                        value={newStorePhone}
                        onChange={e => setNewStorePhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      RUC <span className="font-normal text-neutral-400">(opc)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="11 dígitos"
                      value={newStoreRuc}
                      onChange={e => setNewStoreRuc(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {newStoreType === 'fisica' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Dirección del local *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Jr. Comercio 123, Atalaya, Ucayali"
                        value={newStoreAddress}
                        onChange={e => setNewStoreAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      ¿A qué se dedica? <span className="font-normal text-neutral-400">(opc)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Breve descripción del negocio o productos que comercializa"
                      value={newStoreDescription}
                      onChange={e => setNewStoreDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingStore(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span>Creando tienda...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Guardar & Asignar Tienda</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Limit Reached Notice */}
          {!canCreateMore && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3 text-neutral-600">
              <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-800">
                  Límite de tiendas alcanzado ({userStores.length} de {maxStoresAllowed} tiendas en su {planConfig.name})
                </p>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Para permitirle a este usuario habilitar tiendas adicionales (hasta 2 en Plan Pro o hasta 3 en Plan Escala), actualiza su suscripción desde la columna de acciones en la tabla de usuarios.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-500">
            Los cambios en tiendas se sincronizan en tiempo real vía WebSocket.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
