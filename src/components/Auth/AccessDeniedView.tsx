import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, LogIn, Store, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AccessDeniedView: React.FC = () => {
  const { currentUser, setActiveView, openLoginModal } = useApp();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200/90 shadow-xl p-6 sm:p-8 text-center space-y-6">
        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 mb-3">
            <Lock className="w-3.5 h-3.5" />
            Acceso Restringido • SuperAdmin
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Área Exclusiva de SuperAdministrador
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
            El portal de <strong>SuperAdmin SaaS</strong> contiene métricas globales de ingresos,
            control de todos los comercios del sistema y gestión de planes de suscripción.
          </p>
        </div>

        {/* Current User Status Box */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500 font-medium">
            <span>Tu estado actual:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                currentUser
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              {currentUser ? 'Sesión Iniciada' : 'Invitado / No autenticado'}
            </span>
          </div>

          {currentUser ? (
            <div className="pt-2 border-t border-neutral-200 space-y-1">
              <p className="font-bold text-neutral-900">{currentUser.name}</p>
              <p className="text-neutral-500">{currentUser.email}</p>
              <p className="text-amber-700 font-semibold flex items-center gap-1">
                Rol actual: <span className="uppercase">{currentUser.role}</span> (Sin permisos globales)
              </p>
            </div>
          ) : (
            <p className="text-neutral-500 italic pt-1">
              No has iniciado sesión con una cuenta de SuperAdministrador.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={openLoginModal}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Iniciar Sesión como SuperAdmin
          </button>

          {currentUser?.role === 'merchant' && (
            <button
              onClick={() => setActiveView('merchant')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
            >
              <Store className="w-4 h-4" />
              Ir al Panel de Mi Tienda
            </button>
          )}

          <button
            onClick={() => setActiveView('catalog')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 font-semibold text-xs border border-neutral-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catálogo Público
          </button>
        </div>
      </div>
    </div>
  );
};
