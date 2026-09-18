import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SAAS_PLANS } from '../../data/initialData';
import { SUPER_ADMIN_CONFIG, buildPaymentProofWhatsappUrl } from '../../data/saasPayments';
import {
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  UploadCloud,
  FileText,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Store,
  RefreshCw,
  Zap
} from 'lucide-react';
import { formatPrice } from '../../utils/whatsapp';

export const PaymentVerificationPanel: React.FC = () => {
  const {
    currentUser,
    effectiveUser,
    currentStore,
    updateUserSubscription,
    upgradeSubscription,
    openPlanPurchaseModal,
    setCurrentUserId,
    setActiveView
  } = useApp();

  const user = currentUser || effectiveUser;
  const targetPlanId = user.subscription.pendingPlanId || user.subscription.planId;
  const targetPlan = SAAS_PLANS.find(p => p.id === targetPlanId) || SAAS_PLANS[1];
  const billingCycle = user.subscription.pendingBillingCycle || user.subscription.billingCycle || 'monthly';
  const price = billingCycle === 'annual' ? targetPlan.priceAnnual : targetPlan.priceMonthly;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState(user.subscription.proofReference || '');
  const [proofNote, setProofNote] = useState(user.subscription.proofNote || '');
  const [receiptImage, setReceiptImage] = useState<string | null>(user.subscription.proofReceiptUrl || null);
  const [submitting, setSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(Boolean(user.subscription.proofSubmittedAt));

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setReceiptImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmProofSubmitted = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    updateUserSubscription(user.id, {
      proofSubmittedAt: new Date().toISOString(),
      proofReference: referenceNumber.trim() || 'Comprobante WhatsApp',
      proofNote: proofNote.trim(),
      proofReceiptUrl: receiptImage || undefined,
      pendingAmount: price
    });

    setTimeout(() => {
      setSubmitting(false);
      setSavedSuccess(true);
    }, 600);
  };

  // Demo auto-approve action
  const handleDemoInstantApproval = () => {
    updateUserSubscription(user.id, {
      status: 'active',
      planId: targetPlanId,
      pendingPlanId: undefined,
      pendingAmount: undefined,
      approvedAt: new Date().toISOString(),
      approvedBy: 'SuperAdmin (Alejandro Ramos)'
    });
  };

  const whatsappUrl = buildPaymentProofWhatsappUrl({
    storeName: currentStore.name,
    merchantName: user.name,
    email: user.email,
    phone: user.phone || currentStore.phone,
    planName: targetPlan.name,
    amount: price,
    billingCycle,
    reference: referenceNumber || undefined
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Banner Alert */}
      <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-6 mb-8 text-neutral-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-200 text-amber-900">
                  Activación Pendiente
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  Plan de Pago Seleccionado
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                Envía tu comprobante de pago para activar tu tienda
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                Has seleccionado el <strong className="text-neutral-900">{targetPlan.name}</strong> por{' '}
                <strong className="text-emerald-700">{formatPrice(price, 'S/')} / {billingCycle === 'annual' ? 'año' : 'mes'}</strong>.
                Para validar tu cuenta y habilitar el panel completo, envía tu comprobante al Super Administrador por WhatsApp o verifícalo automáticamente.
              </p>

              <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openPlanPurchaseModal(targetPlanId)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Verificar Automáticamente con Código Yape (3 Dígitos)</span>
                </button>
                <span className="text-[11px] text-neutral-500">
                  Activación inmediata sin esperar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Payment Steps & Accounts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Realizar el pago */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-extrabold text-neutral-900">
                  Cuentas Oficiales para Abonar
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Total a Pagar: {formatPrice(price, 'S/')}
              </span>
            </div>

            <div className="space-y-3">
              {SUPER_ADMIN_CONFIG.paymentAccounts.map(acc => {
                const isCopied = copiedKey === acc.id;
                return (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl border border-neutral-200/90 bg-neutral-50/70 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-neutral-900">{acc.name}</span>
                        {acc.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {acc.badge}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(acc.accountNumber, acc.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-xs font-mono font-bold text-neutral-900 select-all">
                      {acc.accountNumber}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Titular: <strong className="text-neutral-700">{acc.holder}</strong>
                    </div>
                    {acc.cci && (
                      <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                        CCI: {acc.cci}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Enviar Comprobante por WhatsApp */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-extrabold text-neutral-900">
                Enviar Comprobante por WhatsApp
              </h2>
            </div>

            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Haz clic en el botón a continuación para abrir WhatsApp con el mensaje prellenado y adjuntar tu comprobante de pago al Super Administrador ({SUPER_ADMIN_CONFIG.name}):
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Enviar Comprobante por WhatsApp al Super Admin</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            <div className="mt-3 text-center text-[11px] text-neutral-500">
              Número del Super Administrador: <strong className="text-neutral-800">{SUPER_ADMIN_CONFIG.phoneFormatted}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Receipt Registration & Quick Options */}
        <div className="lg:col-span-5 space-y-6">
          {/* Plan Summary Card */}
          <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-md border border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Resumen de Pedido SaaS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-neutral-950 uppercase">
                {targetPlan.id}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">{targetPlan.name}</span>
                <span className="text-lg font-black text-emerald-400">
                  {formatPrice(price, 'S/')}
                  <span className="text-xs text-neutral-400 font-normal">
                    /{billingCycle === 'annual' ? 'año' : 'mes'}
                  </span>
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 space-y-1.5 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hasta {targetPlan.maxProducts === 9999 ? 'Productos ilimitados' : `${targetPlan.maxProducts} productos`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Pedidos automáticos con WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Soporte prioritario y activación rápida</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
                Tienda: <strong className="text-white">{currentStore.name}</strong> • Email: <strong className="text-white">{user.email}</strong>
              </div>
            </div>
          </div>

          {/* Form: Registrar Nº de Operación */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
              Registrar Notificación de Pago
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Ingresa el número de operación para acelerar la verificación manual por el SuperAdmin:
            </p>

            <form onSubmit={handleConfirmProofSubmitted} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nº de Operación / Código de Pago (Yape/BCP)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Op. 849201 ó Código 12934"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nota adicional (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Transferido desde cuenta BCP a las 3:15 PM"
                  value={proofNote}
                  onChange={e => setProofNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Captura de Comprobante (opcional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold cursor-pointer transition-colors">
                    <UploadCloud className="w-4 h-4 text-neutral-500" />
                    <span>Seleccionar imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {receiptImage && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Captura cargada
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando registro...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Ya envié mi comprobante por WhatsApp</span>
                  </>
                )}
              </button>
            </form>

            {savedSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">¡Comprobante registrado en la plataforma!</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    El Super Administrador ha recibido la notificación. Una vez aprobado tu depósito, tu panel se desbloqueará de inmediato.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Demo Testing Shortcut */}
          <div className="bg-purple-50/80 rounded-2xl border border-purple-200 p-4">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-1">
              <Zap className="w-4 h-4 text-purple-700" />
              <span>Modo Pruebas / Demostración</span>
            </div>
            <p className="text-[11px] text-purple-800 mb-2.5 leading-tight">
              Para evaluar la experiencia de aprobación del SuperAdmin de inmediato, puedes aprobar esta cuenta con un clic:
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDemoInstantApproval}
                className="flex-1 py-1.5 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
              >
                Aprobar Ahora (Modo Demo)
              </button>
              <button
                onClick={() => {
                  setCurrentUserId('usr_superadmin');
                  setActiveView('superadmin');
                }}
                className="py-1.5 px-2.5 rounded-lg border border-purple-300 bg-white text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors cursor-pointer"
                title="Entrar como SuperAdmin"
              >
                Ir a SuperAdmin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
