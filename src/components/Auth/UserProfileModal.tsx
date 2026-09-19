import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_STORE_LOGO } from '../../data/initialData';
import {
  User,
  ShieldCheck,
  Store,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  KeyRound,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const {
    currentUser,
    isProfileModalOpen,
    closeProfileModal,
    updateCurrentUserProfile,
    currentStore,
    openStoreCatalog,
    setActiveView,
    setMerchantTab
  } = useApp();

  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'account'>('personal');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [personalAddress, setPersonalAddress] = useState('');

  // Security / PIN fields
  const [changePin, setChangePin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setDni(currentUser.dni || '');
      setPhone(currentUser.phone || '');
      setPersonalAddress(currentUser.personalAddress || '');
      setChangePin(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [currentUser, isProfileModalOpen]);

  if (!isProfileModalOpen || !currentUser) return null;

  // Detect insecure PIN patterns in frontend for instant feedback
  const getPinWarning = (): string | null => {
    if (!newPin) return null;
    if (!/^\d{6}$/.test(newPin)) return 'El PIN debe tener exactamente 6 números.';
    if (new Set(newPin).size === 1) return 'No uses números repetidos (ej. 111111).';
    const sequences = ['012345', '123456', '234567', '345678', '456789', '543210', '654321', '765432', '876543', '987654'];
    if (sequences.includes(newPin)) return 'No uses números en secuencia obvia (ej. 123456).';
    if (dni && dni.includes(newPin)) return 'El PIN no debe coincidir con partes de tu DNI.';
    return null;
  };

  const pinWarning = changePin ? getPinWarning() : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // DNI validation
    if (dni.trim() && !/^\d{8}$/.test(dni.trim())) {
      setErrorMessage('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    // PIN validation if changing PIN
    if (changePin) {
      if (!currentPin.trim()) {
        setErrorMessage('Ingresa tu PIN actual para poder cambiarlo.');
        return;
      }
      if (!newPin) {
        setErrorMessage('Por favor ingresa tu nuevo PIN de 6 dígitos.');
        return;
      }
      if (newPin.length !== 6) {
        setErrorMessage('El nuevo PIN debe tener exactamente 6 dígitos.');
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMessage('La confirmación del nuevo PIN no coincide.');
        return;
      }
      if (pinWarning) {
        setErrorMessage(pinWarning);
        return;
      }
    }

    setIsSaving(true);
    const payload: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      dni: dni.trim() || undefined,
      phone: phone.trim() || undefined,
      personal_address: personalAddress.trim() || undefined
    };

    if (changePin && newPin) {
      if (currentPin) payload.current_pin = currentPin.trim();
      payload.new_pin = newPin.trim();
    }

    const res = await updateCurrentUserProfile(payload);
    setIsSaving(false);

    if (res.success) {
      setSuccessMessage('¡Datos actualizados y rectificados con éxito!');
      if (changePin) {
        setChangePin(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      }
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    } else {
      setErrorMessage(res.error || 'Ocurrió un error al actualizar tus datos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with User Info */}
        <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3.5 z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md ${
              currentUser.role === 'superadmin' ? 'bg-purple-600' : 'bg-emerald-600'
            }`}>
              {currentUser.role === 'superadmin' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white leading-tight">
                  {currentUser.name}
                </h2>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  currentUser.role === 'superadmin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  {currentUser.role === 'superadmin' ? 'SuperAdmin' : 'Admin Tienda'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                {currentUser.email} • ID: {currentUser.id}
              </p>
            </div>
          </div>

          <button
            onClick={closeProfileModal}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer z-10"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 sm:px-5 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'border-neutral-900 text-neutral-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-neutral-700" />
            <span>Datos Personales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-neutral-900 text-neutral-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-neutral-700" />
            <span>Seguridad & PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'border-neutral-900 text-neutral-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-neutral-700" />
            <span>Cuenta & Tienda</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs space-y-4">
          
          {/* Notifications */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: DATOS PERSONALES / TITULAR */}
          {activeTab === 'personal' && (
            <div className="space-y-3.5 animate-in fade-in duration-100">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-amber-900 text-[11px] leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Rectificación de Identidad del Titular</span>
                </p>
                <p className="mt-0.5 text-amber-800">
                  Asegúrate de que tu nombre, DNI y teléfono coincidan con tus documentos reales para validaciones de cuenta y soporte.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nombre Completo */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-700 mb-1">
                    Nombre Completo del Titular <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ej. Juan Carlos Mendoza"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900"
                    />
                  </div>
                </div>

                {/* DNI */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-neutral-700">
                      DNI (Documento de Identidad)
                    </label>
                    <span className={`text-[10px] font-mono ${dni.length === 8 ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
                      {dni.length}/8 dígitos
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={8}
                      value={dni}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setDni(val);
                      }}
                      placeholder="8 dígitos numéricos"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono text-neutral-900 focus:outline-none focus:ring-2 ${
                        dni && dni.length !== 8
                          ? 'border-amber-400 bg-amber-50/40 focus:ring-amber-400'
                          : 'border-neutral-200 bg-neutral-50/60 focus:bg-white focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                  {dni && dni.length !== 8 && (
                    <p className="text-[10px] text-amber-700 mt-1">
                      El DNI debe tener exactamente 8 dígitos numéricos.
                    </p>
                  )}
                </div>

                {/* Celular / WhatsApp Personal */}
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Teléfono Celular Personal (WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ej. 987654321"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-neutral-900"
                    />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-700 mb-1">
                    Correo Electrónico de Acceso <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Se utiliza para iniciar sesión y recuperar credenciales.
                  </p>
                </div>

                {/* Dirección Personal */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-700 mb-1">
                    Dirección Domiciliaria / Personal
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={personalAddress}
                      onChange={e => setPersonalAddress(e.target.value)}
                      placeholder="Ej. Jr. Huancavelica 450, Atalaya, Ucayali"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEGURIDAD & PIN */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">PIN de Seguridad (6 dígitos)</p>
                      <p className="text-[11px] text-neutral-500">
                        Tu llave de acceso rápido para identificarte en el sistema.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setChangePin(!changePin);
                      setCurrentPin('');
                      setNewPin('');
                      setConfirmPin('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      changePin
                        ? 'bg-neutral-200 text-neutral-800'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                    }`}
                  >
                    {changePin ? 'Cancelar Cambio' : 'Cambiar mi PIN'}
                  </button>
                </div>
              </div>

              {changePin && (
                <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/20 space-y-3.5 animate-in fade-in">
                  <p className="font-bold text-neutral-800 text-xs">
                    Configurar Nuevo PIN de Seguridad
                  </p>

                  {/* PIN Actual */}
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      PIN Actual (si ya tenías uno)
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPin ? 'text' : 'password'}
                        maxLength={6}
                        value={currentPin}
                        onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ingresa tu PIN actual"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-mono text-neutral-900 tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      >
                        {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nuevo PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-neutral-700">
                          Nuevo PIN (6 dígitos) <span className="text-rose-500">*</span>
                        </label>
                        <span className={`text-[10px] font-mono ${newPin.length === 6 ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
                          {newPin.length}/6
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          maxLength={6}
                          value={newPin}
                          onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="6 dígitos"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-mono text-neutral-900 tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        >
                          {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Confirmar Nuevo PIN <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        maxLength={6}
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Repite los 6 dígitos"
                        className={`w-full px-3 py-2 rounded-xl border font-mono text-neutral-900 tracking-widest text-sm focus:outline-none focus:ring-2 ${
                          confirmPin && confirmPin !== newPin
                            ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-400'
                            : 'border-neutral-200 bg-white focus:ring-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Dynamic security feedback */}
                  {pinWarning && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{pinWarning}</span>
                    </p>
                  )}

                  <div className="bg-neutral-100/80 rounded-xl p-3 text-[11px] text-neutral-600 space-y-1">
                    <p className="font-bold text-neutral-800">Reglas de seguridad del PIN:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                      <li>Debe ser exactamente de 6 números.</li>
                      <li>No utilices secuencias fáciles (como 123456 o 654321).</li>
                      <li>No utilices números repetitivos (como 111111 o 000000).</li>
                      <li>Por seguridad, evita los números de tu DNI o fecha de nacimiento.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUENTA & TIENDA VINCULADA */}
          {activeTab === 'account' && (
            <div className="space-y-3.5 animate-in fade-in duration-100">
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Tipo de Cuenta
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    currentUser.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {currentUser.status === 'active' ? 'Cuenta Activa' : 'Pendiente de Validación'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-600">
                    Miembro desde: <strong>{new Date(currentUser.createdAt || Date.now()).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  </span>
                </div>

                {currentUser.role === 'merchant' && (
                  <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Plan de Suscripción:</span>
                    <span className="font-extrabold text-neutral-900 uppercase">
                      {currentUser.subscription?.planId || 'Starter'}
                    </span>
                  </div>
                )}
              </div>

              {/* Si es comerciante: Datos de la Tienda Vinculada */}
              {currentUser.role === 'merchant' && currentStore && (
                <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img loading="lazy" decoding="async"
                        src={currentStore.logo || DEFAULT_STORE_LOGO}
                        alt={currentStore.name}
                        className="w-10 h-10 rounded-xl object-cover border border-neutral-200"
                      />
                      <div>
                        <h4 className="font-bold text-neutral-900 text-xs">{currentStore.name}</h4>
                        <p className="text-[11px] text-neutral-500 font-mono">/{currentStore.slug}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentStore.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {currentStore.isActive !== false ? 'Publicada' : 'En Validación'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeProfileModal();
                        openStoreCatalog(currentStore.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold cursor-pointer"
                    >
                      <span>Ver Tienda Pública</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeProfileModal();
                        setActiveView('merchant');
                        setMerchantTab('profile');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      <Store className="w-3 h-3 text-emerald-200" />
                      <span>Configuración de Marca</span>
                    </button>
                  </div>
                </div>
              )}

              {currentUser.role === 'superadmin' && (
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                  <p className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Permisos de SuperAdministrador</span>
                  </p>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Tienes acceso irrestricto a todas las tiendas de la red JamuyWasi, control total de métricas SaaS, autorización de nuevos comercios y gestión de cuentas.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeProfileModal}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-semibold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || (changePin && (!newPin || newPin.length !== 6 || newPin !== confirmPin))}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSaving ? 'Guardando...' : 'Guardar y Rectificar Datos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
