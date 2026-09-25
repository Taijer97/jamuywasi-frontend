import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, PlanTier } from '../../types';
import { SAAS_PLANS } from '../../data/initialData';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Store,
  Crown,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  Check,
  X,
  Calendar,
  CreditCard,
  Building2,
  Phone,
  Mail,
  KeyRound,
  Lock
} from 'lucide-react';
import { UserStoresModal } from './UserStoresModal';
import { getSubscriptionStatusInfo } from '../../utils/subscriptionUtils';
import { formatPrice } from '../../utils/whatsapp';
import { exportUsersDirectory } from '../../utils/reportExports';

export const UserManagementTab: React.FC = () => {
  const {
    users,
    stores,
    currentUser,
    currentStore,
    addUser,
    updateUser,
    deleteUser,
    updateUserSubscription,
    switchUserRole,
    approveUserAccount,
    suspendUserAccount,
    refreshUsers,
    adminResetPinDefault
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshUsers();
    setIsRefreshing(false);
  };

  // Filtering and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'merchant' | 'superadmin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_approval' | 'trial' | 'past_due' | 'canceled'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | PlanTier>('all');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deleteConfirmationUser, setDeleteConfirmationUser] = useState<UserAccount | null>(null);
  const [confirmResetPinUser, setConfirmResetPinUser] = useState<UserAccount | null>(null);
  const [selectedUserForStores, setSelectedUserForStores] = useState<UserAccount | null>(null);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'merchant' | 'superadmin'>('merchant');
  const [newStoreId, setNewStoreId] = useState(stores[0]?.id || '');
  const [newPlan, setNewPlan] = useState<PlanTier>('pro');
  const [newBillingCycle, setNewBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [newSubStatus, setNewSubStatus] = useState<'active' | 'trial'>('active');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleResetPinDefault = async (user: UserAccount) => {
    setIsResettingPin(true);
    try {
      const res = await adminResetPinDefault(user.id);
      if (res.success) {
        showNotification(`¡PIN de ${user.name} restablecido a 000000 con éxito! Al iniciar sesión se le exigirá cambiarlo.`);
        setConfirmResetPinUser(null);
        if (editingUser && editingUser.id === user.id) {
          setEditingUser({
            ...editingUser,
            pinResetRequested: false,
            failedLoginAttempts: 0,
            mustChangePin: true
          });
        }
      } else {
        showNotification(`Error: ${res.error || 'No se pudo restablecer el PIN'}`);
      }
    } catch (err: any) {
      showNotification(`Error: ${err.message || 'Error inesperado'}`);
    } finally {
      setIsResettingPin(false);
    }
  };

  // Metrics computation
  const totalUsers = users.length;
  const totalSuperAdmins = users.filter(u => u.role === 'superadmin').length;
  const totalMerchants = users.filter(u => u.role === 'merchant').length;
  const pinResetRequestedUsers = users.filter(u => u.pinResetRequested).length;
  const pendingApprovalUsers = users.filter(
    u => u.role === 'merchant' && (u.status === 'pending_approval' || u.subscription?.status === 'pending_approval')
  ).length;
  const activePaidSubscriptions = users.filter(
    u => u.role === 'merchant' && u.subscription?.status === 'active' && u.subscription?.planId !== 'starter'
  ).length;
  const trialSubscriptions = users.filter(
    u => u.role === 'merchant' && u.subscription?.status === 'trial'
  ).length;

  const expiringSoonUsers = users.filter(u => {
    if (u.role !== 'merchant') return false;
    const sub = getSubscriptionStatusInfo(u.subscription, u.status);
    return sub.isExpiringSoon && !sub.isExpired && !sub.isPendingApproval;
  }).length;

  // Filtered users
  const filteredUsers = users.filter(u => {
    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    // Status filter
    if (statusFilter !== 'all') {
      const uSub = getSubscriptionStatusInfo(u.subscription, u.status);
      if (statusFilter === 'expiring_soon') {
        if (!uSub.isExpiringSoon || uSub.isExpired || uSub.isPendingApproval) return false;
      } else if (statusFilter === 'pending_approval') {
        if (!uSub.isPendingApproval) return false;
      } else if (statusFilter === 'past_due') {
        if (!uSub.isExpired) return false;
      } else if (u.subscription?.status !== statusFilter) {
        return false;
      }
    }

    // Plan filter
    if (planFilter !== 'all' && (u.subscription?.planId || 'starter') !== planFilter) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const store = stores.find(s => s.id === u.storeId);
      const matchesName = u.name?.toLowerCase().includes(q);
      const matchesEmail = u.email?.toLowerCase().includes(q);
      const matchesPhone = u.phone?.toLowerCase().includes(q);
      const matchesStore = store?.name?.toLowerCase().includes(q);
      const matchesRole = u.role?.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail && !matchesPhone && !matchesStore && !matchesRole) {
        return false;
      }
    }

    return true;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const assignedStoreId = newRole === 'superadmin' ? 'all' : (newStoreId || stores[0]?.id || '');

    const created = addUser({
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '+51 987 654 321',
      role: newRole,
      storeId: assignedStoreId,
      status: 'active',
      subscription: {
        planId: newRole === 'superadmin' ? 'business' : newPlan,
        status: newRole === 'superadmin' ? 'active' : newSubStatus,
        billingCycle: newBillingCycle,
        startDate: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        renewsAutomatically: true
      }
    });

    setCreateModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('merchant');
    showNotification(`¡Usuario ${created.name} creado exitosamente con rol ${created.role === 'superadmin' ? 'SuperAdmin' : 'Admin de Tienda'}!`);
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = await updateUser(editingUser);
    if (res.success) {
      showNotification(`¡Usuario ${editingUser.name} actualizado y rectificado correctamente!`);
      setEditingUser(null);
    } else {
      alert(`Error al actualizar usuario: ${res.error || 'Intente nuevamente'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    // Safety check: don't delete if it's the last superadmin
    if (target.role === 'superadmin' && totalSuperAdmins <= 1) {
      alert('No puedes eliminar al único SuperAdministrador de la plataforma.');
      return;
    }

    // Regla: solo poder eliminar un usuario si su plan está vencido o cancelado
    if (target.role === 'merchant') {
      const subInfo = getSubscriptionStatusInfo(target.subscription, target.status);
      const isExpiredOrCanceled = subInfo.isExpired || target.subscription?.status === 'canceled';
      if (!isExpiredOrCanceled) {
        alert('Solo se puede eliminar un usuario si su plan de suscripción se encuentra vencido o cancelado.');
        return;
      }
    }

    const res = await deleteUser(userId);
    if (res && !res.success) {
      alert(res.error || 'No se pudo eliminar el usuario.');
      return;
    }

    setDeleteConfirmationUser(null);
    showNotification(`El usuario ${target.name} ha sido eliminado.`);
  };

  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const handleExportUsersExcel = async () => {
    if (isExportingUsers) return;
    setIsExportingUsers(true);
    try {
      await exportUsersDirectory({ users, stores });
      showNotification('Directorio de usuarios exportado a Excel.');
    } catch (e) {
      console.error('No se pudo generar el Excel', e);
      showNotification('Error: no se pudo generar el archivo de Excel.');
    } finally {
      setIsExportingUsers(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards for User Management */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500">Usuarios Totales</span>
            <div className="text-2xl font-black text-neutral-900 mt-1">
              {totalUsers}
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Cuentas registradas en la plataforma
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500">Super Administradores</span>
            <div className="text-2xl font-black text-purple-700 mt-1 flex items-center gap-1.5">
              <span>{totalSuperAdmins}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Acceso Total
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Gestión global y control de tiendas
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500">Admins de Tienda</span>
            <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
              <span>{totalMerchants}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Comerciantes
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              {activePaidSubscriptions} con plan Pro/Business activo
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500">En Prueba / Seguimiento</span>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {trialSubscriptions}
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Suscripciones en periodo de prueba
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Banner de Solicitudes de Reset de PIN pendientes */}
      {pinResetRequestedUsers > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <span>{pinResetRequestedUsers} {pinResetRequestedUsers === 1 ? 'usuario solicitó' : 'usuarios solicitaron'} restablecimiento de PIN</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  Atención Requerida
                </span>
              </p>
              <p className="text-xs text-amber-900 mt-0.5">
                Bloquearon su cuenta tras 3 intentos fallidos o solicitaron asistencia por WhatsApp. Puedes restablecer su PIN a <strong>000000</strong> con un solo clic.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const reqUser = users.find(u => u.pinResetRequested);
                if (reqUser) setConfirmResetPinUser(reqUser);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Atender Solicitud PIN</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-neutral-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <span>Directorio de Cuentas & Control de Suscripciones</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-neutral-200 text-neutral-700">
                {filteredUsers.length} de {users.length}
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              Administra privilegios de SuperAdmin, vinculación de tiendas y estados de suscripción SaaS en Soles (S/).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Sincronizar usuarios desde la base de datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Actualizando...' : 'Refrescar'}</span>
            </button>

            <button
              onClick={handleExportUsersExcel}
              disabled={isExportingUsers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              title="Descargar directorio de usuarios en Excel (.xlsx)"
            >
              <Download className={`w-3.5 h-3.5 ${isExportingUsers ? 'animate-bounce' : ''}`} />
              <span>{isExportingUsers ? 'Generando…' : 'Exportar Excel'}</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-neutral-100 bg-white grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o tienda..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="md:col-span-4 flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/70">
            <button
              onClick={() => setRoleFilter('all')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                roleFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Todos ({totalUsers})
            </button>
            <button
              onClick={() => setRoleFilter('superadmin')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                roleFilter === 'superadmin' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              SuperAdmin ({totalSuperAdmins})
            </button>
            <button
              onClick={() => setRoleFilter('merchant')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                roleFilter === 'merchant' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Store className="w-3 h-3 text-emerald-600" />
              Admins ({totalMerchants})
            </button>
          </div>

          {/* Subscription Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Cualquier Estado</option>
              <option value="pending_approval">⏳ Pendiente de Autorizar ({pendingApprovalUsers})</option>
              <option value="expiring_soon">⚠️ Por Vencer ({expiringSoonUsers})</option>
              <option value="active">Suscripción Activa</option>
              <option value="trial">En Prueba (Trial)</option>
              <option value="past_due">Vencida / Past Due</option>
              <option value="canceled">Cancelada</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="md:col-span-2">
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Planes</option>
              {SAAS_PLANS.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (S/ {plan.priceMonthly}/mes)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Usuario & Contacto</th>
                <th className="py-3 px-4">Rol en la Plataforma</th>
                <th className="py-3 px-4">Tiendas a Cargo</th>
                <th className="py-3 px-4">Suscripción SaaS</th>
                <th className="py-3 px-4">Estado & Vigencia</th>
                <th className="py-3 px-4 text-right">Acciones de Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="font-semibold">No se encontraron usuarios coincidentes</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Prueba cambiando los filtros o el término de búsqueda</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const assignedStore = stores.find(s => s.id === user.storeId);
                  const isSuperAdmin = user.role === 'superadmin';
                  const userSub = user.subscription || {
                    planId: 'starter',
                    status: (user.status === 'pending_approval' ? 'pending_approval' : (user.status === 'suspended' ? 'past_due' : 'active')),
                    billingCycle: 'monthly',
                    startDate: user.createdAt || new Date().toISOString(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    renewsAutomatically: true
                  };
                  const planConfig = SAAS_PLANS.find(p => p.id === userSub.planId) || SAAS_PLANS[0];
                  const isSelf = Boolean(currentUser && currentUser.id === user.id);
                  const uSubStatusInfo = getSubscriptionStatusInfo(userSub, user.status);
                  const isExpiredOrCanceled = uSubStatusInfo.isExpired || userSub.status === 'canceled';
                  const canDelete = !isSelf && (user.role === 'superadmin' ? totalSuperAdmins > 1 : isExpiredOrCanceled);
                  const deleteTooltip = isSelf
                    ? 'No puedes eliminar tu propia cuenta'
                    : user.role === 'superadmin'
                    ? (totalSuperAdmins <= 1 ? 'No puedes eliminar al único SuperAdministrador' : 'Eliminar SuperAdmin')
                    : (!isExpiredOrCanceled
                        ? 'Solo se puede eliminar si el plan está vencido o cancelado'
                        : 'Eliminar comercio (Plan vencido o cancelado)');

                  return (
                    <tr key={user.id} data-notif-target={user.id} className={`hover:bg-neutral-50/60 transition-colors ${isSelf ? 'bg-purple-50/30' : ''}`}>
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              isSuperAdmin
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-neutral-900 text-white'
                            }`}
                          >
                            {(user.name || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-neutral-900">{user.name || 'Sin Nombre'}</span>
                              {user.dni && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  DNI: {user.dni}
                                </span>
                              )}
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-700">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-neutral-400" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="flex items-center gap-1 text-neutral-500">
                                  • <Phone className="w-3 h-3" /> {user.phone}
                                </span>
                              )}
                            </div>
                            {user.personalAddress && (
                              <p className="text-[10px] text-neutral-400 truncate max-w-xs mt-0.5">
                                📍 {user.personalAddress}
                              </p>
                            )}
                            {user.pinResetRequested && (
                              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Solicitó Reset PIN ({user.failedLoginAttempts || 3} fallos)</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setConfirmResetPinUser(user)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer"
                                  title="Restablecer PIN a 000000 por defecto"
                                >
                                  <KeyRound className="w-3 h-3" />
                                  <span>Reset a 000000</span>
                                </button>
                              </div>
                            )}
                            {user.mustChangePin && !user.pinResetRequested && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  <Lock className="w-3 h-3 text-purple-600" />
                                  <span>PIN temporal 000000 (Pendiente de cambiar)</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Quick Toggle */}
                      <td className="py-3 px-4">
                        {isSuperAdmin ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Super Admin</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                            <Store className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Admin Tienda</span>
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-400 mt-1">
                          {isSuperAdmin ? 'Control SaaS Global' : 'Gestor de Catálogo'}
                        </div>
                      </td>

                      {/* Tiendas a Cargo según el Plan */}
                      <td className="py-3 px-4">
                        {isSuperAdmin && user.storeId === 'all' ? (
                          <span className="text-xs font-semibold text-purple-700 flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-purple-50 border border-purple-200">
                            <Building2 className="w-3.5 h-3.5 text-purple-600" />
                            <span>Acceso Global (Todas)</span>
                          </span>
                        ) : (
                          (() => {
                            const userStores = stores.filter(s => 
                              s.ownerId === user.id || 
                              (Boolean(user.dni) && s.ownerId === user.dni) || 
                              s.id === user.storeId
                            );
                            const maxAllowed = planConfig.maxStores || 1;
                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedUserForStores(user)}
                                className="group flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-neutral-200/90 hover:border-purple-400 bg-white hover:bg-purple-50/50 transition-all text-left shadow-2xs cursor-pointer"
                                title={`Ver y gestionar tiendas (${userStores.length} de ${maxAllowed} permitidas en su plan)`}
                              >
                                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                  {userStores.length > 0 ? (
                                    userStores.slice(0, 3).map((st) => (
                                      <img loading="lazy" decoding="async"
                                        key={st.id}
                                        src={st.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&auto=format&fit=crop&q=80'}
                                        alt={st.name}
                                        className="inline-block w-6 h-6 rounded-lg ring-1 ring-white object-cover bg-neutral-100 shadow-xs"
                                      />
                                    ))
                                  ) : (
                                    <div className="w-6 h-6 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                                      <Store className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-neutral-800 text-xs group-hover:text-purple-900 truncate max-w-[130px]">
                                      {userStores.length === 1
                                        ? userStores[0].name
                                        : userStores.length > 1
                                        ? `${userStores[0].name} +${userStores.length - 1}`
                                        : 'Sin tiendas'}
                                    </p>
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black shrink-0 ${
                                      userStores.length >= maxAllowed
                                        ? 'bg-neutral-100 text-neutral-700'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {userStores.length}/{maxAllowed}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-purple-600 font-semibold group-hover:underline flex items-center gap-0.5">
                                    <span>Ver {userStores.length <= 1 ? 'tienda' : 'tiendas'}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </span>
                                </div>
                              </button>
                            );
                          })()
                        )}
                      </td>

                      {/* Plan SaaS */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              userSub.planId === 'business'
                                ? 'bg-neutral-900 text-white'
                                : userSub.planId === 'pro'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            {planConfig.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
                          S/ {userSub.billingCycle === 'annual' ? Math.round(planConfig.priceAnnual / 12) : planConfig.priceMonthly}/mes
                        </div>
                      </td>

                      {/* Status & Validity */}
                      <td className="py-3 px-4">
                        {(() => {
                          const uSubInfo = getSubscriptionStatusInfo(userSub, user.status);
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {uSubInfo.isPendingApproval && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Pendiente Autorizar</span>
                                </span>
                              )}
                              {!uSubInfo.isPendingApproval && uSubInfo.isExpired && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>{userSub.status === 'canceled' ? 'Cancelada' : 'Vencida'}</span>
                                </span>
                              )}
                              {!uSubInfo.isPendingApproval && !uSubInfo.isExpired && uSubInfo.isExpiringSoon && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-400">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>{uSubInfo.statusBadgeText}</span>
                                </span>
                              )}
                              {!uSubInfo.isPendingApproval && !uSubInfo.isExpired && !uSubInfo.isExpiringSoon && userSub.status === 'trial' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>Prueba</span>
                                </span>
                              )}
                              {!uSubInfo.isPendingApproval && !uSubInfo.isExpired && !uSubInfo.isExpiringSoon && userSub.status === 'active' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Activa</span>
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {userSub.currentPeriodEnd && (
                          <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>Vence: {new Date(userSub.currentPeriodEnd).toLocaleDateString('es-PE')}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón de Autorización Directa si está pendiente */}
                          {(user.status === 'pending_approval' || userSub.status === 'pending_approval') && (
                            <button
                              type="button"
                              onClick={() => {
                                approveUserAccount(user.id);
                                const currentEnd = new Date(userSub.currentPeriodEnd || Date.now()).getTime();
                                const newEnd = new Date(Math.max(Date.now(), currentEnd) + 30 * 24 * 60 * 60 * 1000).toISOString();
                                updateUserSubscription(user.id, {
                                  status: 'active',
                                  planId: userSub.pendingPlanId || userSub.planId,
                                  currentPeriodEnd: newEnd,
                                  pendingPlanId: undefined,
                                  pendingAmount: undefined
                                });
                                showNotification(`¡Tienda de ${user.name} autorizada y activada con éxito (+30 días acumulados)!`);
                              }}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              title="Aprobar y habilitar acceso a este comercio"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Autorizar</span>
                            </button>
                          )}

                          {/* Restablecer PIN: solo aparece cuando el usuario lo solicitó (evita resets por error).
                              Si no hay solicitud se deja un espacio del mismo tamaño para que las columnas no se muevan. */}
                          {user.pinResetRequested ? (
                            <button
                              type="button"
                              onClick={() => setConfirmResetPinUser(user)}
                              className="p-1.5 rounded-lg border transition-colors cursor-pointer border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 ring-2 ring-amber-400/40 animate-pulse"
                              title="¡Solicitó restablecer su PIN! Restablecer a 000000"
                              aria-label={`Restablecer PIN de ${user.name} a 000000 (solicitado)`}
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="w-[30px] h-[30px] shrink-0" aria-hidden="true" />
                          )}

                          {/* Ver y Gestionar Tiendas a Cargo */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForStores(user)}
                            className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer shadow-2xs"
                            title="Ver y administrar tiendas a cargo de este usuario"
                          >
                            <Store className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...user, subscription: userSub })}
                            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-neutral-700 transition-colors cursor-pointer"
                            title="Editar usuario y suscripción"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!canDelete) return;
                              setDeleteConfirmationUser({ ...user, subscription: userSub });
                            }}
                            disabled={!canDelete}
                            className={`p-1.5 rounded-lg border border-neutral-200 transition-colors ${
                              !canDelete
                                ? 'opacity-30 cursor-not-allowed text-neutral-400 bg-neutral-100 hover:bg-neutral-100'
                                : 'bg-white hover:bg-rose-50 hover:text-rose-700 text-neutral-700 cursor-pointer'
                            }`}
                            title={deleteTooltip}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nuevo Usuario */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Dar de Alta Nuevo Usuario
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Crea un Super Administrador de plataforma o un Admin de Tienda con suscripción.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              {/* Role Selection */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1.5">
                  Tipo de Rol en la Plataforma <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setNewRole('merchant')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      newRole === 'merchant'
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-neutral-900">Admin de Tienda</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Gestiona un catálogo comercial, pedidos de WhatsApp y su propia suscripción.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewRole('superadmin')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      newRole === 'superadmin'
                        ? 'border-purple-600 bg-purple-50/50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-neutral-900">Super Admin</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Acceso total a métricas globales de MRR, todas las tiendas y usuarios.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Santillán"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Correo Electrónico <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rodrigo@ejemplo.pe"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  type="tel"
                  placeholder="+51 987 654 321"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              {/* Merchant Specific Subscription Settings */}
              {newRole === 'merchant' ? (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Configuración de Tienda & Suscripción Inicial</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Asignar a Tienda
                    </label>
                    <select
                      value={newStoreId}
                      onChange={e => setNewStoreId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer"
                    >
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} (/{store.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Plan SaaS
                      </label>
                      <select
                        value={newPlan}
                        onChange={e => setNewPlan(e.target.value as PlanTier)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer"
                      >
                        {SAAS_PLANS.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} (S/ {plan.priceMonthly}/mes)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Estado Inicial
                      </label>
                      <select
                        value={newSubStatus}
                        onChange={e => setNewSubStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="active">Activa Inmediata</option>
                        <option value="trial">Periodo de Prueba (14 días)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Ciclo de Facturación
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="cycle"
                          checked={newBillingCycle === 'monthly'}
                          onChange={() => setNewBillingCycle('monthly')}
                        />
                        <span>Mensual</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="cycle"
                          checked={newBillingCycle === 'annual'}
                          onChange={() => setNewBillingCycle('annual')}
                        />
                        <span>Anual (Ahorro 2 meses)</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Privilegios de SuperAdministrador</span>
                  </p>
                  <p className="text-[11px] text-purple-700 mt-1">
                    Este usuario tendrá acceso sin límites a todas las tiendas, reportes de facturación MRR y podrá gestionar a otros administradores.
                  </p>
                </div>
              )}

              {/* Buttons */}
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
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuario & Suscripción */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Gestionar Usuario: {editingUser.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Modifica rol administrativo, estado de cuenta y control de suscripción SaaS.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="p-5 space-y-4 text-xs">
              {/* Bloque de Datos Personales (Solo Lectura) */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-800 text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Datos Personales del Titular</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200/70 text-neutral-600 border border-neutral-300/50">
                    <Lock className="w-2.5 h-2.5" /> Solo lectura
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Nombre Completo
                    </span>
                    <p className="font-bold text-neutral-900 mt-0.5 truncate" title={editingUser.name}>
                      {editingUser.name || 'Sin nombre registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Correo Electrónico
                    </span>
                    <p className="font-semibold text-neutral-800 mt-0.5 truncate font-mono text-[11px]" title={editingUser.email}>
                      {editingUser.email}
                    </p>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      DNI (Documento Nacional de Identidad)
                    </span>
                    <p className="font-mono font-bold text-neutral-900 mt-0.5">
                      {editingUser.dni || <span className="text-neutral-400 font-normal italic">No registrado</span>}
                    </p>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Teléfono Celular
                    </span>
                    <p className="font-mono font-semibold text-neutral-800 mt-0.5">
                      {editingUser.phone || <span className="text-neutral-400 font-normal italic">No registrado</span>}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Dirección Domiciliaria / Personal
                    </span>
                    <p className="text-neutral-700 mt-0.5">
                      {editingUser.personalAddress || <span className="text-neutral-400 italic">No especificada</span>}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Tienda Propia / Asignada
                    </span>
                    <div className="mt-0.5 text-xs">
                      {editingUser.role === 'superadmin' && editingUser.storeId === 'all' ? (
                        <span className="text-purple-700 font-bold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Todas las tiendas (Control Global)</span>
                        </span>
                      ) : (
                        (() => {
                          const assigned = stores.find(s => s.id === editingUser.storeId);
                          return assigned ? (
                            <span className="inline-flex items-center gap-1.5 text-neutral-900 font-bold">
                              <Store className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{assigned.name}</span>
                              <span className="text-[11px] font-mono text-neutral-500 font-normal">
                                (/{assigned.slug})
                              </span>
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic font-normal">
                              Sin tienda vinculada
                            </span>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Fields: Rol en la Plataforma & Estado de la Cuenta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Rol en la Plataforma
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({
                      ...editingUser,
                      role: e.target.value as 'merchant' | 'superadmin',
                      storeId: e.target.value === 'superadmin' ? 'all' : (editingUser.storeId === 'all' ? (users.find(u => u.id === editingUser.id)?.storeId || '') : editingUser.storeId)
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="merchant">Admin de Tienda (Merchant)</option>
                    <option value="superadmin">Super Administrador (Global)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={editingUser.status}
                    onChange={e => setEditingUser({
                      ...editingUser,
                      status: e.target.value as any,
                      subscription: {
                        ...editingUser.subscription,
                        status: e.target.value === 'suspended' ? 'past_due' : (e.target.value === 'active' ? 'active' : editingUser.subscription.status)
                      }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer font-bold text-neutral-800"
                  >
                    <option value="active">Activa (Habilitada)</option>
                    <option value="pending_approval">Pendiente de Autorizar</option>
                    <option value="suspended">Suspendida (Inactiva)</option>
                  </select>
                </div>
              </div>

              {/* Subscription & Vigencia Editor Box */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="font-bold text-neutral-900 text-xs flex items-center justify-between border-b border-neutral-200/80 pb-2">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    <span>Control de Suscripción SaaS & Vigencia</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const currentEnd = new Date(editingUser.subscription.currentPeriodEnd || Date.now()).getTime();
                        const newEnd = new Date(Math.max(Date.now(), currentEnd) + 30 * 24 * 60 * 60 * 1000).toISOString();
                        setEditingUser({
                          ...editingUser,
                          subscription: {
                            ...editingUser.subscription,
                            currentPeriodEnd: newEnd,
                            status: 'active'
                          }
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-[10px] font-bold text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Sumar 30 días adicionales a la vigencia"
                    >
                      <Plus className="w-3 h-3" /> +30 días
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentEnd = new Date(editingUser.subscription.currentPeriodEnd || Date.now()).getTime();
                        const newEnd = new Date(Math.max(Date.now(), currentEnd) + 365 * 24 * 60 * 60 * 1000).toISOString();
                        setEditingUser({
                          ...editingUser,
                          subscription: {
                            ...editingUser.subscription,
                            currentPeriodEnd: newEnd,
                            status: 'active'
                          }
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-[10px] font-bold text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Sumar 1 año adicional a la vigencia"
                    >
                      <Plus className="w-3 h-3" /> +1 año
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Plan SaaS
                    </label>
                    <select
                      value={editingUser.subscription.planId}
                      onChange={e => setEditingUser({
                        ...editingUser,
                        subscription: { ...editingUser.subscription, planId: e.target.value as PlanTier }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer font-semibold"
                    >
                      {SAAS_PLANS.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} (S/ {plan.priceMonthly}/mes)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Estado de Pago / Suscripción
                    </label>
                    <select
                      value={editingUser.subscription.status}
                      onChange={e => setEditingUser({
                        ...editingUser,
                        subscription: { ...editingUser.subscription, status: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="active">Activa (Al día)</option>
                      <option value="trial">Periodo de Prueba</option>
                      <option value="past_due">Vencida / Pago Pendiente</option>
                      <option value="canceled">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Fecha de Vigencia / Vencimiento
                    </label>
                    <input
                      type="date"
                      value={editingUser.subscription.currentPeriodEnd ? editingUser.subscription.currentPeriodEnd.split('T')[0] : ''}
                      onChange={e => {
                        if (e.target.value) {
                          const dateObj = new Date(`${e.target.value}T23:59:59.000Z`);
                          setEditingUser({
                            ...editingUser,
                            subscription: {
                              ...editingUser.subscription,
                              currentPeriodEnd: dateObj.toISOString()
                            }
                          });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none font-semibold text-neutral-800 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Ciclo de Facturación
                    </label>
                    <select
                      value={editingUser.subscription.billingCycle}
                      onChange={e => setEditingUser({
                        ...editingUser,
                        subscription: { ...editingUser.subscription, billingCycle: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Renovación Automática
                    </label>
                    <select
                      value={editingUser.subscription.renewsAutomatically ? 'true' : 'false'}
                      onChange={e => setEditingUser({
                        ...editingUser,
                        subscription: { ...editingUser.subscription, renewsAutomatically: e.target.value === 'true' }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="true">Sí, auto-renovable</option>
                      <option value="false">No, manual</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Eliminación */}
      {deleteConfirmationUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  ¿Eliminar cuenta de usuario?
                </h3>
                <p className="text-xs text-neutral-500">
                  Esta acción revocará el acceso de {deleteConfirmationUser.name} ({deleteConfirmationUser.email}).
                </p>
              </div>
            </div>

            {(() => {
              const info = getSubscriptionStatusInfo(deleteConfirmationUser.subscription, deleteConfirmationUser.status);
              const isExpiredOrCanceled = info.isExpired || deleteConfirmationUser.subscription?.status === 'canceled';
              const canDeleteUser = deleteConfirmationUser.role === 'superadmin' ? totalSuperAdmins > 1 : isExpiredOrCanceled;

              return (
                <>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
                    <p><strong>Rol:</strong> {deleteConfirmationUser.role === 'superadmin' ? 'Super Administrador' : 'Admin de Tienda'}</p>
                    <p><strong>Plan:</strong> {(deleteConfirmationUser.subscription?.planId || 'starter').toUpperCase()}</p>
                    {deleteConfirmationUser.role === 'merchant' && (
                      <>
                        <p>
                          <strong>Estado de Suscripción:</strong>{' '}
                          <span className={`font-bold ${isExpiredOrCanceled ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {deleteConfirmationUser.subscription?.status === 'canceled'
                              ? 'Cancelada'
                              : info.isExpired
                              ? 'Vencida / Pago Pendiente'
                              : 'Activa / Vigente'}
                          </span>
                        </p>
                        <p className="text-[11px] text-rose-700 font-semibold pt-1 border-t border-neutral-200/80">
                          ⚠️ Al eliminar este comerciante, también se eliminarán permanentemente todas las tiendas, productos y pedidos asociados a su cargo.
                        </p>
                      </>
                    )}
                  </div>

                  {deleteConfirmationUser.role === 'merchant' && !isExpiredOrCanceled && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Acción no permitida:</strong> Solo se puede eliminar un usuario si su plan de suscripción está <strong>vencido</strong> o <strong>cancelado</strong>.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmationUser(null)}
                      className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!canDeleteUser}
                      onClick={() => handleDeleteUser(deleteConfirmationUser.id)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Confirmar Eliminación
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Restablecimiento de PIN a 000000 */}
      {confirmResetPinUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  ¿Restablecer PIN a 000000 por defecto?
                </h3>
                <p className="text-xs text-neutral-500">
                  Usuario: <strong>{confirmResetPinUser.name}</strong> ({confirmResetPinUser.email})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Efectos inmediatos del restablecimiento:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900">
                    <li>El PIN quedará temporalmente en <strong>000000</strong>.</li>
                    <li>Se reiniciará el contador de intentos fallidos (desbloqueando la cuenta).</li>
                    <li>Se resolverá la solicitud de restablecimiento.</li>
                    <li>
                      <strong>Seguridad obligatoria:</strong> Tan pronto el usuario inicie sesión con 000000, el sistema le mostrará un modal obligatorio para ingresar y confirmar su nuevo PIN de 6 dígitos antes de poder acceder a su tienda.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isResettingPin}
                onClick={() => setConfirmResetPinUser(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isResettingPin}
                onClick={() => handleResetPinDefault(confirmResetPinUser)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isResettingPin ? 'Restableciendo...' : 'Confirmar Reset a 000000'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tiendas a Cargo del Usuario */}
      <UserStoresModal
        user={selectedUserForStores}
        isOpen={selectedUserForStores !== null}
        onClose={() => setSelectedUserForStores(null)}
      />
    </div>
  );
};
