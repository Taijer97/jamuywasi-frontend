import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SAAS_PLANS } from '../../data/initialData';
import { SUPER_ADMIN_CONFIG } from '../../data/saasPayments';
import { PlanTier, PromoCodeValidationResult, YapeVerifyResult } from '../../types';
import { api } from '../../services/api';
import {
  X,
  Check,
  Copy,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  MessageCircle,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  Tag,
  Store,
  AlertCircle,
  Zap,
  QrCode,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PlanPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: PlanTier;
}

export const PlanPurchaseModal: React.FC<PlanPurchaseModalProps> = ({
  isOpen,
  onClose,
  initialPlanId
}) => {
  const {
    currentUser,
    effectiveUser,
    currentStore,
    updateUserSubscription,
    handleSubscriptionActivated,
    logout,
    setActiveView,
    yapeConfig
  } = useApp();
  const user = currentUser || effectiveUser;

  const yapeCleanPhone = (yapeConfig?.phone || '925763903').replace(/\D/g, '');
  const yapeDisplayPhone = yapeConfig?.phoneFormatted || `+51 ${yapeCleanPhone}`;
  const yapeHolder = yapeConfig?.holder || 'JamuyWasi';
  const autoQR = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/51${yapeCleanPhone}?text=Pago%20Yape%20JamuyWasi`;
  const yapeActiveQR = yapeConfig?.qrUrl?.trim() || autoQR;
  const yapeInstructions = yapeConfig?.instructions || '';

  const currentEndMs = user?.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).getTime() : 0;
  const nowMs = Date.now();
  const daysRemaining = currentEndMs > nowMs ? Math.ceil((currentEndMs - nowMs) / (1000 * 60 * 60 * 24)) : 0;
  const isCurrentSubActive = Boolean(
    (user?.subscription?.status === 'active' || user?.subscription?.status === 'trial') &&
    user?.status !== 'pending_approval' &&
    daysRemaining > 0
  );
  const canRenewCurrentPlan = !isCurrentSubActive || daysRemaining <= 3;

  const defaultInitialPlan = initialPlanId || (
    !canRenewCurrentPlan && user?.subscription?.planId
      ? (SAAS_PLANS.find(p => p.id !== user?.subscription?.planId)?.id || 'pro')
      : user?.subscription?.planId || 'starter'
  );

  const [selectedPlanId, setSelectedPlanId] = useState<PlanTier>(defaultInitialPlan);
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<PromoCodeValidationResult | null>(null);
  
  // Verificación Automática Yape (3 dígitos)
  const [yapeCode, setYapeCode] = useState('');
  const [verifyingYape, setVerifyingYape] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);
  const [mustSendWhatsapp, setMustSendWhatsapp] = useState<boolean>(false);
  const [autoVerifiedSuccess, setAutoVerifiedSuccess] = useState<boolean>(false);

  // Formulario Manual (WhatsApp / Comprobante)
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showManualSection, setShowManualSection] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // El modal es persistente si el usuario es comerciante sin plan activado aún
  const isPlanRequired = Boolean(
    user &&
    user.role === 'merchant' &&
    (user.status === 'pending_approval' || user.subscription?.status === 'pending_approval') &&
    !autoVerifiedSuccess &&
    !submittedSuccess
  );

  useEffect(() => {
    if (initialPlanId) {
      setSelectedPlanId(initialPlanId);
    }
  }, [initialPlanId]);

  // Si se abre el modal, resetear estados temporales si aún no está verificado
  useEffect(() => {
    if (isOpen) {
      setVerifyStatus('idle');
      setVerifyMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPlan = SAAS_PLANS.find(p => p.id === selectedPlanId) || SAAS_PLANS[0];
  const basePrice = selectedPlan.priceMonthly;

  // Calcular precio con cupón si aplica
  const discountAmount = promoResult?.valid ? (promoResult.discountAmount || 0) : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const currentPlan = user?.subscription?.planId ? SAAS_PLANS.find(p => p.id === user.subscription.planId) : null;
  const isChangingPlan = Boolean(currentPlan && currentPlan.id !== selectedPlanId);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    try {
      const result = await api.validatePromoCode(promoInput.trim(), selectedPlanId, basePrice);
      setPromoResult(result);
      if (verifyStatus === 'error') {
        setVerifyStatus('idle');
        setVerifyMessage(null);
      }
    } catch (err: any) {
      setPromoResult({
        valid: false,
        message: err.message || 'Error al validar cupón.',
        discountAmount: 0,
        finalAmount: basePrice
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(yapeCleanPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
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

  // --- Activación Gratuita Directa (Monto S/ 0.00 con Cupón) ---
  const handleDirectFreeActivation = async () => {
    setVerifyingYape(true);
    setVerifyStatus('idle');
    setVerifyMessage(null);

    try {
      const res: YapeVerifyResult = await api.verifyYapePayment({
        codigo: '000',
        planId: selectedPlanId,
        promoCode: promoResult?.valid ? promoResult.code : undefined,
        billingCycle: 'monthly'
      });

      if (res.success) {
        setVerifyStatus('success');
        setVerifyMessage(res.message);
        setAutoVerifiedSuccess(true);
        handleSubscriptionActivated(res);
      } else {
        setVerifyStatus('error');
        setVerifyMessage(res.message || 'No se pudo activar el plan gratuito.');
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setVerifyMessage(err.message || 'Error al procesar la activación gratuita.');
    } finally {
      setVerifyingYape(false);
    }
  };

  // --- Verificación Automática con el API de Yape (3 Dígitos) ---
  const handleAutoVerifyYape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mustSendWhatsapp || attemptsRemaining <= 0) return;

    const cleanCode = yapeCode.trim();
    if (cleanCode.length !== 3 || !/^\d{3}$/.test(cleanCode)) {
      setVerifyStatus('error');
      setVerifyMessage('Ingresa exactamente el código numérico de 3 dígitos de tu constancia de Yape (ej: 895).');
      return;
    }

    setVerifyingYape(true);
    setVerifyStatus('idle');
    setVerifyMessage(null);

    try {
      const res: YapeVerifyResult = await api.verifyYapePayment({
        codigo: cleanCode,
        planId: selectedPlanId,
        promoCode: promoResult?.valid ? promoResult.code : undefined,
        billingCycle: 'monthly'
      });

      setAttemptsRemaining(res.attemptsRemaining);
      setMustSendWhatsapp(res.mustSendWhatsapp);

      if (res.success) {
        setVerifyStatus('success');
        setVerifyMessage(res.message);
        setAutoVerifiedSuccess(true);
        handleSubscriptionActivated(res);
      } else {
        setVerifyStatus('error');
        setVerifyMessage(res.message);
        if (res.mustSendWhatsapp || res.attemptsRemaining <= 0) {
          setShowManualSection(true);
        }
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setVerifyMessage(err.message || 'Error de comunicación con el servicio de verificación.');
    } finally {
      setVerifyingYape(false);
    }
  };

  // --- Envío Manual por WhatsApp (Fallback / 3 intentos agotados) ---
  const handleSendProof = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    const storeName = currentStore?.name || 'Mi Tienda';
    const merchantName = user?.name || 'Comerciante';
    const email = user?.email || '';
    const phone = user?.phone || currentStore?.phone || '';

    // Preparar mensaje de WhatsApp
    const lines = [
      '🔔 *COMPROBANTE DE PAGO DE SUSCRIPCIÓN - JAMUYWASI*',
      '----------------------------------------',
      `🏪 *Tienda:* ${storeName}`,
      `👤 *Comerciante:* ${merchantName}`,
      `📧 *Correo:* ${email}`,
      phone ? `📱 *WhatsApp:* ${phone}` : '',
      `📦 *Plan Elegido:* ${selectedPlan.name} (S/ ${basePrice}/mes)`,
      promoResult?.valid ? `🏷️ *Cupón Aplicado:* ${promoResult.code} (-S/ ${discountAmount.toFixed(2)})` : '',
      `💰 *Monto Abonado:* S/ ${finalPrice.toFixed(2)}`,
      daysRemaining > 0 ? `⏳ *Días Restantes a Conservar:* ${daysRemaining} día(s) (Nueva vigencia acumulada: ${daysRemaining + 30} días)` : '',
      yapeCode.trim() ? `🔢 *Código de Aprobación Yape:* ${yapeCode.trim()}` : '',
      referenceNumber.trim() ? `🔖 *Nº de Operación / Ref:* ${referenceNumber.trim()}` : '',
      mustSendWhatsapp ? '⚠️ *Nota:* Intentos automáticos agotados, solicito validación y activación manual.' : '',
      '----------------------------------------',
      '📄 *Adjunto mi comprobante de pago de Yape/Plin.*',
      'Solicito la activación inmediata de mi tienda.',
      '¡Muchas gracias!'
    ].filter(Boolean);

    const fullAdminPhone = yapeCleanPhone.startsWith('51') ? yapeCleanPhone : `51${yapeCleanPhone}`;
    const whatsappUrl = `https://wa.me/${fullAdminPhone}?text=${encodeURIComponent(lines.join('\n'))}`;

    // Actualizar suscripción del usuario en estado pending_approval con detalles de comprobante
    if (user) {
      updateUserSubscription(user.id, {
        status: 'pending_approval',
        pendingPlanId: selectedPlanId,
        pendingAmount: finalPrice,
        promoCodeApplied: promoResult?.valid ? promoResult.code : undefined,
        discountApplied: discountAmount,
        proofReference: referenceNumber.trim() || (yapeCode.trim() ? `Código Yape: ${yapeCode.trim()}` : 'Comprobante Yape'),
        proofReceiptUrl: receiptImage || undefined,
        proofSubmittedAt: new Date().toISOString()
      });
    }

    setTimeout(() => {
      setSubmitting(false);
      setSubmittedSuccess(true);
      window.open(whatsappUrl, '_blank');
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (!isPlanRequired && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200/80 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* Header con gradiente elegante - shrink-0 garantiza visibilidad permanente sin recortes */}
        <div className="shrink-0 relative bg-gradient-to-r from-purple-800 via-indigo-900 to-neutral-900 text-white px-5 py-4 sm:px-7 sm:py-5">
          {!isPlanRequired && (
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap pr-8 sm:pr-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-purple-200 text-[10px] font-black uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3 h-3 text-purple-300" />
              <span>Plataforma Multitienda SaaS</span>
            </div>
            {isPlanRequired && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                Paso Requerido: Elige y Activa tu Plan
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
            Elige tu Plan y Activa tu Tienda
          </h2>
          <p className="text-xs text-purple-200/90 mt-1 max-w-xl leading-relaxed">
            {finalPrice === 0
              ? '¡Tu cupón cubre el 100% del plan! Activa tu tienda al instante con un solo clic.'
              : 'Abona vía Yape e ingresa tu código de aprobación de 3 dígitos para verificación y activación automática al instante.'}
          </p>
        </div>

        {/* 1. Pantalla de Éxito: Verificación Automática Exitosa */}
        {autoVerifiedSuccess ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200 overscroll-contain">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>¡Activación Inmediata Exitosa!</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
                {finalPrice === 0 ? '¡Plan Gratuito y Tienda Activa!' : '¡Pago Verificado y Tienda Activa!'}
              </h3>
              <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed pt-1">
                {verifyMessage || `Tu plan ${selectedPlan.name} ha sido activado exitosamente por 30 días. Tu catálogo ya está disponible para el público.`}
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-xs text-left max-w-md mx-auto space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500 font-medium">Plan activado:</span>
                <span className="font-black text-neutral-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500 font-medium">Monto validado:</span>
                <span className="font-black text-emerald-700">
                  {finalPrice === 0 ? 'S/ 0.00 (Cupón 100% Gratuito)' : `S/ ${finalPrice.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-500 font-medium">Estado de la cuenta:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-black">
                  <Check className="w-3.5 h-3.5" /> Activo
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs shadow-lg transition-colors cursor-pointer"
              >
                Comenzar a Administrar mi Tienda
              </button>
            </div>
          </div>
        ) : submittedSuccess ? (
          /* 2. Pantalla de Espera: Comprobante Manual Enviado */
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-center space-y-4 animate-in zoom-in-95 duration-200 overscroll-contain">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-black text-neutral-900">
                ¡Comprobante Remitido por WhatsApp!
              </h3>
              <p className="text-xs text-neutral-600 mt-1 max-w-md mx-auto leading-relaxed">
                Tu comprobante ha sido registrado y enviado por WhatsApp al SuperAdministrador. Tu tienda se encuentra en <strong>espera de validación</strong>.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 text-left space-y-1.5 max-w-md mx-auto">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>¿Qué sucede a continuación?</span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                El SuperAdministrador verificará tu comprobante en el número oficial <strong>+51 925 763 903</strong> y autorizará tu cuenta.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Entendido, ir al panel
              </button>
            </div>
          </div>
        ) : (
          /* 3. Formulario de Selección, Pago y Verificación */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 overscroll-contain">
            {/* 1. Selector de Planes */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block mb-2.5">
                1. Selecciona tu Plan de Suscripción:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAAS_PLANS.map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  const isCurrent = user?.subscription?.planId === plan.id;
                  const isLockedCurrent = isCurrent && !canRenewCurrentPlan;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        if (isLockedCurrent) return;
                        setSelectedPlanId(plan.id);
                        setPromoResult(null); // Reset promo when switching plan
                        setVerifyStatus('idle');
                        setVerifyMessage(null);
                      }}
                      className={`relative p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        isLockedCurrent
                          ? 'border-neutral-200 bg-neutral-50/90 cursor-not-allowed opacity-75'
                          : isSelected
                          ? 'border-purple-600 bg-purple-50/40 shadow-md ring-2 ring-purple-600/20 cursor-pointer'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white cursor-pointer'
                      }`}
                      title={
                        isLockedCurrent
                          ? `Renovación disponible a partir de los últimos 3 días antes de vencer (te quedan ${daysRemaining} días vigentes).`
                          : undefined
                      }
                    >
                      {plan.recommended && !isCurrent && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-600 text-white uppercase tracking-wider shadow-xs">
                          Recomendado
                        </span>
                      )}

                      {isCurrent && (
                        <span className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs ${
                          isLockedCurrent ? 'bg-neutral-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {isLockedCurrent ? `Vigente (${daysRemaining}d)` : 'Tu Plan Actual'}
                        </span>
                      )}

                      <div>
                        <div className="text-[11px] font-black text-neutral-900 uppercase">
                          {plan.name}
                        </div>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xl font-black text-neutral-950">
                            S/ {plan.priceMonthly}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-medium">/mes</span>
                        </div>

                        <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                          <Store className="w-3 h-3 text-purple-600" />
                          <span>{plan.maxStores === 1 ? '1 Tienda' : `Hasta ${plan.maxStores} tiendas`}</span>
                        </div>

                        <p className="text-[10px] text-neutral-500 mt-2 line-clamp-2">
                          {plan.tagline}
                        </p>

                        {isLockedCurrent && (
                          <div className="mt-2 text-[9px] text-amber-800 bg-amber-50 rounded-lg p-1.5 border border-amber-200 font-medium leading-tight">
                            Renovación disponible a los últimos 3 días (quedan {daysRemaining} días)
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-neutral-100 text-[10px] text-neutral-600 space-y-1">
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <Check className="w-3 h-3 shrink-0" />
                          <span>Hasta {plan.maxProducts >= 9999 ? 'Ilimitados' : plan.maxProducts} productos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>WhatsApp Directo</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Banner Informativo de Días Restantes / Acumulación */}
              {daysRemaining > 0 && (
                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-300/90 text-emerald-950 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-emerald-900 uppercase text-[10px] tracking-wider bg-emerald-200/80 px-2 py-0.5 rounded-md">
                        {isChangingPlan ? 'Cambio de Plan con Tiempo a Favor' : 'Renovación de Plan'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        {daysRemaining} día(s) restante(s) conservados
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                      {isChangingPlan ? (
                        <>
                          Al cambiar al <strong>{selectedPlan.name}</strong>, se respetan tus <strong>{daysRemaining} días restantes</strong> de tu plan actual y se le suman <strong>30 días</strong> del nuevo plan. Tu nueva vigencia total será de <strong>{daysRemaining + 30} días</strong>.
                        </>
                      ) : (
                        <>
                          Al renovar tu <strong>{selectedPlan.name}</strong>, no pierdes tus <strong>{daysRemaining} días vigentes</strong>; se sumarán <strong>30 días adicionales</strong> a tu fecha de expiración (vigencia total acumulada: <strong>{daysRemaining + 30} días</strong>).
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Alerta de bloqueo si el plan actual tiene más de 3 días vigentes */}
            {isCurrentSubActive && !canRenewCurrentPlan && selectedPlanId === user?.subscription?.planId ? (
              <div className="p-6 rounded-3xl border-2 border-amber-300 bg-amber-50/80 text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">
                    Renovación de Plan Actual no Disponible Aún
                  </h3>
                  <p className="text-xs text-amber-900/90 max-w-md mx-auto mt-1 leading-relaxed">
                    Tu plan <strong>{selectedPlan.name}</strong> aún cuenta con <strong>{daysRemaining} día(s) de vigencia activa</strong>. La renovación de tu plan actual se activará automáticamente cuando falten <strong>3 días o menos</strong> para su vencimiento.
                  </p>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-neutral-600">
                    Si deseas aumentar productos o capacidades de tu tienda de inmediato, selecciona un plan superior arriba.
                  </p>
                </div>
              </div>
            ) : (
              <>

            {/* 2. Código Promocional */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5 mb-2">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>¿Tienes un Código Promocional?</span>
              </label>

              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. PROMO20, BIENVENIDO"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs uppercase font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-600 bg-white"
                />
                <button
                  type="submit"
                  disabled={promoLoading || !promoInput.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {promoLoading ? 'Validando...' : 'Aplicar'}
                </button>
              </form>

              {promoResult && (
                <div
                  className={`mt-2 p-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${
                    promoResult.valid
                      ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100/80 text-rose-900 border border-rose-300'
                  }`}
                >
                  {promoResult.valid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {promoResult.message} Descuento de S/ {promoResult.discountAmount?.toFixed(2)}.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{promoResult.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {finalPrice === 0 ? (
              /* Tarjeta de Activación Gratuita Directa (Monto = 0) */
              <div className="p-6 rounded-3xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white shadow-lg space-y-4 animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 uppercase tracking-wider">
                      ¡Cupón 100% Gratuito Aplicado!
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 mt-0.5">
                      Acceso Total sin Costo (S/ 0.00)
                    </h3>
                    <p className="text-xs text-neutral-600">
                      Tu cupón cubre el 100% de la suscripción para el <strong>{selectedPlan.name}</strong>. No requieres comprobante ni verificación de pago.
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 border border-emerald-200 text-xs space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                    <span className="text-neutral-500 font-medium">Plan Seleccionado:</span>
                    <span className="font-black text-neutral-900">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                    <span className="text-neutral-500 font-medium">Cupón Activo:</span>
                    <span className="font-mono font-bold text-purple-700">{promoResult?.code}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                    <span className="text-neutral-500 font-medium">Descuento:</span>
                    <span className="font-bold text-emerald-600">-S/ {discountAmount.toFixed(2)} (100% OFF)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-900 font-black">Total a Pagar:</span>
                    <span className="text-xl font-black text-emerald-700">S/ 0.00</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDirectFreeActivation}
                    disabled={verifyingYape}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {verifyingYape ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Activando tu tienda al instante...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-white" />
                        <span>⚡ Activar Plan y Acceder Directamente a mi Tienda</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-emerald-800/80 text-center mt-2 font-medium">
                    Activación instantánea y automática. Tu tienda quedará lista para vender inmediatamente.
                  </p>
                </div>

                {verifyStatus === 'error' && verifyMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <span className="font-black block">Error al activar el plan gratuito</span>
                      <span className="text-[11px] text-rose-800 leading-relaxed block">
                        {verifyMessage}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 3. Tarjeta de Pago Yape Oficial */}
                <div className="rounded-3xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/50 to-white p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100">
                    <div>
                      <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">
                        Total a transferir por {selectedPlan.name}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        {discountAmount > 0 && (
                          <span className="text-sm line-through text-neutral-400 font-bold">
                            S/ {basePrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-3xl font-black text-neutral-900">
                          S/ {finalPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">PEN</span>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-600 text-white text-xs font-black shadow-xs self-start sm:self-center">
                      <span>Yape / Plin Oficial</span>
                    </div>
                  </div>

                  {/* Yape Card Box con QR y Teléfono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white rounded-2xl p-4 border border-neutral-200">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white text-center shadow-md">
                      <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center overflow-hidden">
                        <img loading="lazy" decoding="async"
                          src={yapeActiveQR}
                          alt="QR Yape Pago"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = autoQR;
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-purple-200 mt-2 flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        <span>Escanea con Yape o Plin</span>
                      </span>
                    </div>

                    {/* Número y Titular */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                          Número Yape / Plin
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-lg font-mono font-black text-purple-900 tracking-wider">
                            {yapeDisplayPhone}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPhone}
                            className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedPhone ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                          Titular de Cuenta
                        </span>
                        <span className="font-bold text-neutral-800 text-xs">
                          {yapeHolder}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200/80 text-[11px] text-purple-950 font-medium">
                        {yapeInstructions || (
                          <>Abona el monto exacto de <strong>S/ {finalPrice.toFixed(2)}</strong>. Luego copia el <strong>código de 3 dígitos</strong> de tu Yape para activación inmediata.</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. VERIFICACIÓN AUTOMÁTICA CON CÓDIGO YAPE (3 DÍGITOS) */}
                <div className={`p-5 rounded-3xl border-2 transition-all ${
                  mustSendWhatsapp
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-purple-400 bg-gradient-to-br from-purple-50/60 via-indigo-50/30 to-white shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Zap className="w-5 h-5 fill-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-neutral-900 uppercase tracking-tight flex items-center gap-1.5">
                          <span>Verificación Automática Yape</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            Recomendado
                          </span>
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          Ingresa el código de 3 dígitos que figura en tu confirmación de Yape.
                        </p>
                      </div>
                    </div>

                    {/* Contador de intentos */}
                    <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border self-start sm:self-center shrink-0 ${
                      attemptsRemaining <= 1
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : attemptsRemaining === 2
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-purple-100 text-purple-800 border-purple-200'
                    }`}>
                      {attemptsRemaining > 0 ? `${attemptsRemaining} de 3 intentos` : '0 intentos restantes'}
                    </div>
                  </div>

                  {!mustSendWhatsapp && attemptsRemaining > 0 ? (
                    <form onSubmit={handleAutoVerifyYape} className="space-y-3 pt-1">
                      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="Ej: 895"
                            value={yapeCode}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                              setYapeCode(val);
                              if (verifyStatus === 'error') setVerifyStatus('idle');
                            }}
                            className="w-full text-center sm:text-left px-4 py-3 rounded-2xl border-2 border-purple-300 focus:border-purple-600 focus:outline-hidden text-lg font-mono font-black tracking-widest text-purple-950 bg-white shadow-inner placeholder:text-neutral-300 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400 pointer-events-none hidden sm:inline">
                            3 dígitos
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={verifyingYape || yapeCode.length !== 3}
                          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-[0.99] text-white font-black text-xs shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {verifyingYape ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Verificando Yape...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 fill-white" />
                              <span>Verificar y Activar Automáticamente</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 px-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>El código de aprobación de 3 dígitos aparece en la pantalla de éxito de Yape (bajo el monto).</span>
                      </div>

                      {/* Alerta de Error si falló intento */}
                      {verifyStatus === 'error' && verifyMessage && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 flex-1">
                            <span className="font-black block">No se pudo verificar el pago</span>
                            <span className="text-[11px] text-rose-800 leading-relaxed block">
                              {verifyMessage}
                            </span>
                          </div>
                        </div>
                      )}
                    </form>
                  ) : (
                    /* Estado: Intentos Agotados -> Enviar a WhatsApp Obligatoriamente */
                    <div className="p-4 rounded-2xl bg-amber-100/80 border border-amber-300 text-amber-950 space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h5 className="font-black text-xs text-amber-900 uppercase">
                            Has agotado los 3 intentos de verificación automática
                          </h5>
                          <p className="text-[11px] text-amber-900/90 leading-relaxed">
                            Por favor envía tu comprobante directamente a nuestro WhatsApp oficial (<strong>{yapeDisplayPhone}</strong>). El SuperAdministrador validará tu transferencia y activará tu tienda de inmediato.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendProof()}
                        disabled={submitting}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>Enviar Comprobante por WhatsApp ({yapeDisplayPhone})</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. SECCIÓN MANUAL / FALLBACK: Subida de Comprobante por WhatsApp */}
                <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50/50">
                  <button
                    type="button"
                    onClick={() => setShowManualSection(prev => !prev)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>¿Prefieres enviar tu comprobante manualmente o adjuntar captura?</span>
                    </div>
                    {showManualSection ? (
                      <ChevronUp className="w-4 h-4 text-neutral-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                    )}
                  </button>

                  {showManualSection && (
                    <form onSubmit={handleSendProof} className="p-4 pt-2 border-t border-neutral-200 bg-white space-y-3.5 animate-in fade-in">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 block mb-1">
                          Número de Operación / Referencia Yape (Opcional):
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Operación 1084920 o tu nombre de Yape"
                          value={referenceNumber}
                          onChange={e => setReferenceNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-600 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 block mb-1">
                          Captura del Comprobante (Opcional):
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-neutral-300 hover:border-purple-600 bg-neutral-50 hover:bg-purple-50/40 text-neutral-700 font-bold text-xs cursor-pointer transition-colors">
                            <UploadCloud className="w-4 h-4 text-purple-600" />
                            <span>{receiptImage ? 'Cambiar Captura' : 'Subir Captura de Pago'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                          {receiptImage && (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Imagen lista</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                          <span>
                            {submitting
                              ? 'Abriendo WhatsApp...'
                              : `Enviar Comprobante por WhatsApp (S/ ${finalPrice.toFixed(2)})`}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" />
                        </button>
                        <p className="text-[10px] text-neutral-400 text-center mt-1.5">
                          Número oficial de activación: {yapeDisplayPhone}
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
              </>
            )}
          </div>
        )}

        {/* Footer persistente cuando la activación es obligatoria */}
        {isPlanRequired && (
          <div className="shrink-0 px-5 sm:px-6 py-3 bg-neutral-100 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-600">
            <span>Para administrar tu tienda, adquiere o activa tu suscripción.</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="text-neutral-500 hover:text-rose-600 font-bold underline cursor-pointer transition-colors"
            >
              Cerrar sesión y salir
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
