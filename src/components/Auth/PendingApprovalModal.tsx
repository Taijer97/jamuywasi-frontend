import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getAdminWhatsApp } from '../../utils/subscriptionUtils';
import {
  ShieldAlert,
  MessageCircle,
  Clock,
  Store,
  CheckCircle2,
  Lock,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles
} from 'lucide-react';

interface PendingApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantData?: {
    storeName: string;
    merchantName: string;
    email: string;
    phone: string;
    plan: string;
  } | null;
}

export const PendingApprovalModal: React.FC<PendingApprovalModalProps> = ({
  isOpen,
  onClose,
  merchantData
}) => {
  const { currentUser, currentStore, logout, yapeConfig } = useApp();
  // WhatsApp del SuperAdmin (SuperAdmin > Cobros & QR Yape)
  const adminWhatsApp = getAdminWhatsApp(yapeConfig);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const storeName = merchantData?.storeName || currentStore?.name || 'Mi Negocio';
  const merchantName = merchantData?.merchantName || currentUser?.name || 'Comerciante';
  const email = merchantData?.email || currentUser?.email || '';
  const phone = merchantData?.phone || currentUser?.phone || '';
  const plan = merchantData?.plan || currentUser?.subscription?.planId || 'starter';

  const planLabel = plan === 'business'
    ? 'Plan Negocio Escala (S/ 50/mes)'
    : plan === 'pro'
    ? 'Plan Crecimiento Pro (S/ 25/mes)'
    : 'Plan Emprendedor (S/ 10/mes)';

  const whatsappMessage = [
    '👋 *HOLA SUPERADMIN, SOLICITO AUTORIZACIÓN DE ACCESO*',
    '------------------------------------------------',
    `🏪 *Nombre del Negocio:* ${storeName}`,
    `👤 *Comerciante Responsable:* ${merchantName}`,
    `📧 *Correo de Cuenta:* ${email}`,
    phone ? `📱 *WhatsApp de la Tienda:* ${phone}` : '',
    `📦 *Plan Registrado:* ${planLabel}`,
    '------------------------------------------------',
    'He completado mi registro en la plataforma y requiero la validación y autorización del SuperAdmin para activar mi tienda.',
    '¿Podría habilitar mi acceso, por favor? Muchas gracias.'
  ].filter(Boolean).join('\n');

  const whatsappUrl = `https://wa.me/${adminWhatsApp.wa}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(adminWhatsApp.display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6">
        {/* Header con gradiente distintivo de seguridad */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-7">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3.5 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-amber-100" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/20 text-amber-200 text-[11px] font-bold mb-1.5 border border-white/10">
            <Clock className="w-3 h-3" />
            <span>Autorización Obligatoria de Seguridad</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            Acceso en Espera de Autorización
          </h2>
          <p className="text-xs text-amber-100/90 mt-1">
            Todo nuevo negocio registrado debe ser aprobado por el SuperAdministrador antes de activar su tienda.
          </p>
        </div>

        {/* Cuerpo informativo del modal */}
        <div className="p-6 space-y-5">
          {/* Tarjeta con los datos del comercio registrado */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/90 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <span className="font-bold text-neutral-500 uppercase text-[10px] tracking-wider">
                Resumen del Negocio
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                <Lock className="w-2.5 h-2.5" />
                Pendiente de Aprobación
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-neutral-700">
              <div>
                <span className="text-[10px] text-neutral-400 block font-medium">Tienda / Marca:</span>
                <span className="font-black text-neutral-900 text-sm">{storeName}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-medium">Comerciante:</span>
                <span className="font-bold text-neutral-900">{merchantName}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-medium">Correo Electrónico:</span>
                <span className="font-mono text-neutral-800 text-[11px] truncate block">{email}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-medium">Plan Seleccionado:</span>
                <span className="font-bold text-emerald-700">{planLabel}</span>
              </div>
            </div>
          </div>

          {/* Caja explicativa de política de acceso */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">¿Por qué se requiere autorización?</p>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                Para garantizar la seguridad y calidad de los catálogos en la red, cada nuevo comercio (incluso en Plan Emprendedor) es revisado y validado directamente por el SuperAdministrador.
              </p>
            </div>
          </div>

          {/* Botón principal de solicitud por WhatsApp */}
          <div className="space-y-3 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer text-center"
            >
              <MessageCircle className="w-5 h-5 fill-white shrink-0" />
              <span>Solicitar Acceso por WhatsApp ({adminWhatsApp.display})</span>
              <ExternalLink className="w-4 h-4 opacity-75 shrink-0" />
            </a>

            <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
              <span className="text-[11px]">Número del SuperAdmin:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 hover:text-emerald-700 cursor-pointer bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{adminWhatsApp.display}</span>
              </button>
            </div>
          </div>

          {/* Footer de opciones secundarias */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="text-xs font-semibold text-neutral-500 hover:text-rose-600 cursor-pointer transition-colors"
            >
              Cerrar Sesión
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Entendido, volveré pronto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
