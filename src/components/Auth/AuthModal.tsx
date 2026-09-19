import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PlanTier } from '../../types';
import { SAAS_PLANS } from '../../data/initialData';
import {
  X, LogIn, Store, Sparkles, ShieldCheck, CheckCircle2,
  Lock, Mail, User, ArrowRight, ArrowLeft, AlertCircle,
  CreditCard, MapPin, Building, Eye, EyeOff, FileText, ArrowDown,
  ShieldAlert, KeyRound, AlertTriangle
} from 'lucide-react';

const CATS = [
  { id: 'Moda',         label: '👗 Moda & Calzado' },
  { id: 'Gastronomía',  label: '🍔 Restaurante & Comida' },
  { id: 'Cafetería',    label: '☕ Café & Postres' },
  { id: 'Tecnología',   label: '📱 Tecnología & Celulares' },
  { id: 'Belleza',      label: '💄 Belleza & Cosmética' },
  { id: 'Abarrotes',    label: '🛒 Market & Abarrotes' },
  { id: 'Salud',        label: '💊 Farmacia & Salud' },
  { id: 'Hogar',        label: '🛋 Hogar & Decoración' },
  { id: 'Servicios',    label: '💼 Servicios Profesionales' },
  { id: 'General',      label: '✨ Boutique General' },
];

const inp = 'w-full py-2.5 px-3 rounded-xl border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all';
const inpI = 'w-full py-2.5 pl-9 pr-3 rounded-xl border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all';
const inpP = 'w-full py-2.5 pl-14 pr-3 rounded-xl border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all';

const Ico: React.FC<{ c: React.ReactNode }> = ({ c }) => (
  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">{c}</span>
);

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode, login, registerMerchantStore, requestForgotPin } = useApp();

  const [lid, setLid] = useState('');
  const [lpin, setLpin] = useState('');
  const [showLP, setShowLP] = useState(false);
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const [step, setStep] = useState<1|2|3|4>(1);
  const [dni, setDni] = useState('');
  const [rname, setRname] = useState('');
  const [rphone, setRphone] = useState('');
  const [remail, setRemail] = useState('');
  const [raddr, setRaddr] = useState('');

  const [sName, setSName] = useState('');
  const [ruc, setRuc] = useState('');
  const [cat, setCat] = useState('Moda');
  const [smode, setSmode] = useState<'fisica'|'virtual'>('virtual');
  const [sAddr, setSAddr] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [about, setAbout] = useState('');
  const [plan, setPlan] = useState<PlanTier>('pro');

  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [showP, setShowP] = useState(false);
  const [regErr, setRegErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  const handleTermsScroll = () => {
    if (!termsScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = termsScrollRef.current;
    if (scrollHeight - scrollTop - clientHeight <= 30) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (step === 4 && termsScrollRef.current) {
      const { scrollHeight, clientHeight } = termsScrollRef.current;
      if (scrollHeight <= clientHeight + 10) {
        setHasScrolledToBottom(true);
      }
    }
  }, [step]);

  if (!authModalOpen) return null;

  const slug = sName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  const getPinSt = (p: string) => {
    if (!p) return { ok: false, msg: 'Ingresa 6 dígitos.' };
    if (!/^\d+$/.test(p)) return { ok: false, msg: 'Solo números.' };
    if (p.length < 6) return { ok: false, msg: `Faltan ${6 - p.length} dígitos.` };
    if (new Set(p.split('')).size === 1) return { ok: false, msg: 'PIN muy simple (ej. 111111).' };
    const seq = ['012345','123456','234567','345678','456789','543210','654321','765432','876543','987654'];
    if (seq.includes(p)) return { ok: false, msg: 'PIN muy simple (secuencia).' };
    if (dni && (dni.includes(p) || p === dni.slice(0,6) || p === dni.slice(-6)))
      return { ok: false, msg: 'No uses dígitos de tu DNI.' };
    if (rphone && rphone.replace(/\D/g,'').endsWith(p))
      return { ok: false, msg: 'No uses dígitos de tu celular.' };
    return { ok: true, msg: '✓ PIN seguro' };
  };
  const pSt = getPinSt(p1);

  const goStep1 = (e: React.FormEvent) => {
    e.preventDefault(); setRegErr(null);
    if (dni.replace(/\D/g,'').length !== 8) { setRegErr('El DNI debe tener 8 dígitos.'); return; }
    if (rname.trim().length < 3) { setRegErr('Ingresa tus nombres completos.'); return; }
    if (rphone.replace(/\D/g,'').length < 9) { setRegErr('Ingresa un celular válido (9 dígitos).'); return; }
    if (!remail.includes('@')) { setRegErr('Ingresa un correo válido.'); return; }
    if (raddr.trim().length < 5) { setRegErr('Ingresa tu dirección.'); return; }
    if (!sPhone) setSPhone(rphone.replace(/\D/g,''));
    setStep(2);
  };

  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault(); setRegErr(null);
    if (sName.trim().length < 2) { setRegErr('Escribe el nombre de tu tienda.'); return; }
    if (ruc.trim() && ruc.replace(/\D/g,'').length !== 11) { setRegErr('El RUC debe tener 11 dígitos.'); return; }
    if (smode === 'fisica' && sAddr.trim().length < 5) { setRegErr('Ingresa la dirección del local.'); return; }
    if (sPhone.replace(/\D/g,'').length < 9) { setRegErr('Ingresa el WhatsApp de la tienda.'); return; }
    setStep(3);
  };

  const goStep3 = (e: React.FormEvent) => {
    e.preventDefault(); setRegErr(null);
    if (!pSt.ok) { setRegErr(pSt.msg); return; }
    if (p1 !== p2) { setRegErr('Los PIN no coinciden.'); return; }
    setStep(4);
  };

  const handleCompleteRegistration = async () => {
    if (!acceptedTerms || !hasScrolledToBottom) {
      setRegErr('Debes leer los términos hasta el final y marcar la casilla de aceptación.');
      return;
    }
    setLoading(true);
    setRegErr(null);
    try {
      const r = await registerMerchantStore({
        dni: dni.replace(/\D/g,''),
        merchantName: rname.trim(),
        phone: rphone.replace(/\D/g,''),
        email: remail.trim().toLowerCase(),
        personalAddress: raddr.trim(),
        storeName: sName.trim(),
        ruc: ruc.replace(/\D/g,'') || undefined,
        category: cat,
        storeType: smode,
        storeAddress: smode === 'fisica' ? sAddr.trim() : 'Venta online',
        storePhone: sPhone.replace(/\D/g,''),
        storeEmail: sEmail.trim().toLowerCase() || undefined,
        about: about.trim() || undefined,
        pin: p1.trim(),
        plan,
      });
      if (r.success) {
        setAuthModalOpen(false);
        setStep(1);
        setAcceptedTerms(false);
        setHasScrolledToBottom(false);
      } else {
        setRegErr(r.error || 'Error al registrar.');
      }
    } catch (err: any) {
      setRegErr(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(null);
    setForgotSuccess(null);
    if (!lid.trim()) { setLoginErr('Ingresa tu DNI o correo.'); return; }
    if (!lpin.trim()) { setLoginErr('Ingresa tu PIN de 6 dígitos.'); return; }
    setLoading(true);
    try {
      const r = await login(lid.trim(), lpin.trim());
      if (!r.success) {
        setLoginErr(r.error || 'Credenciales incorrectas.');
        if (r.locked || r.remainingAttempts === 0) {
          setIsLocked(true);
          setRemainingAttempts(0);
        } else if (r.remainingAttempts !== undefined) {
          setRemainingAttempts(r.remainingAttempts);
          setIsLocked(false);
        }
      } else {
        setAuthModalOpen(false);
        setIsLocked(false);
        setRemainingAttempts(null);
        setLoginErr(null);
      }
    } catch (err: any) {
      setLoginErr(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    if (!lid.trim()) {
      setLoginErr('Por favor ingresa tu DNI o Correo en el campo de arriba para solicitar el restablecimiento.');
      return;
    }
    setForgotLoading(true);
    setLoginErr(null);
    try {
      const res = await requestForgotPin(lid.trim());
      if (res.success) {
        setForgotSuccess(
          '¡Solicitud registrada en el sistema!'
        );
        setIsLocked(true);
        setRemainingAttempts(0);
        if (res.whatsappUrl) {
          window.open(res.whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        setLoginErr(res.error || 'No se pudo registrar la solicitud de restablecimiento.');
      }
    } catch (err: any) {
      setLoginErr(err.message || 'Error al solicitar restablecimiento de PIN.');
    } finally {
      setForgotLoading(false);
    }
  };

  const STEPS = ['Titular', 'Tienda', 'PIN', 'Términos'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-4 px-3 bg-neutral-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-neutral-900 text-sm">JamuyWasi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 gap-0.5 text-xs font-semibold">
              <button type="button"
                onClick={() => { setAuthModalMode('login'); setLoginErr(null); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  authModalMode === 'login' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                }`}>
                <LogIn className="w-3.5 h-3.5" /><span>Ingresar</span>
              </button>
              <button type="button"
                onClick={() => { setAuthModalMode('register'); setRegErr(null); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  authModalMode === 'register' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                }`}>
                <Sparkles className="w-3.5 h-3.5" /><span>Registrar</span>
              </button>
            </div>
            <button onClick={() => setAuthModalOpen(false)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success */}
        {ok && (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="font-black text-neutral-900">¡Registro exitoso!</p>
            <p className="text-sm text-neutral-600">{ok}</p>
          </div>
        )}

        {/* LOGIN */}
        {!ok && authModalMode === 'login' && (
          <div className="px-5 py-5 space-y-4">
            <div>
              <h3 className="font-black text-neutral-900 text-base">Iniciar Sesión</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Ingresa tu DNI o Correo y tu PIN de seguridad (6 dígitos)</p>
            </div>

            {/* Aviso de Éxito de Solicitud de Reseteo */}
            {forgotSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Solicitud de Reseteo Registrada</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  {forgotSuccess}
                </p>
              </div>
            )}

            {/* Bloqueo por 3 intentos fallidos */}
            {isLocked ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Acceso Bloqueado (Máximo 3 Intentos Fallidos)</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Has alcanzado el límite de 3 intentos con tu PIN. Por seguridad tu cuenta ha sido bloqueada temporalmente.
                  Presiona el botón para solicitar al Super Administrador que restablezca tu PIN.
                </p>
                <button
                  type="button"
                  onClick={handleForgotPin}
                  disabled={forgotLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-60"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{forgotLoading ? 'Enviando solicitud...' : 'Olvidé mi PIN / Solicitar Restablecimiento al Admin'}</span>
                </button>
              </div>
            ) : (
              <>
                {/* Advertencia de intentos restantes */}
                {remainingAttempts !== null && remainingAttempts < 3 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Te quedan <strong>{remainingAttempts}</strong> intento(s) de PIN.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotPin}
                      className="text-[11px] text-amber-900 font-bold underline hover:text-amber-700 cursor-pointer ml-2 shrink-0"
                    >
                      ¿Olvidaste tu PIN?
                    </button>
                  </div>
                )}

                {/* Error de login */}
                {loginErr && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginErr}</span>
                  </div>
                )}
              </>
            )}

            <form onSubmit={doLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">DNI o Correo</label>
                <div className="relative">
                  <Ico c={<User className="w-4 h-4" />} />
                  <input
                    type="text"
                    required
                    value={lid}
                    onChange={e => { setLid(e.target.value); setIsLocked(false); }}
                    placeholder="72839401 o tu@correo.com"
                    className={inpI}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-600">PIN de Seguridad (6 dígitos)</label>
                  <button type="button" onClick={() => setShowLP(!showLP)}
                    className="flex items-center gap-0.5 text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer">
                    {showLP ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showLP ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Ico c={<Lock className="w-4 h-4" />} />
                  <input
                    type={showLP ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={lpin}
                    onChange={e => setLpin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className={`${inpI} font-mono tracking-widest`}
                    autoComplete="current-password"
                    disabled={isLocked}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={handleForgotPin}
                    disabled={forgotLoading}
                    className="text-[11px] text-neutral-500 hover:text-emerald-700 font-semibold cursor-pointer"
                  >
                    ¿Olvidaste tu PIN?
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Verificando credenciales...' : 'Ingresar a mi Cuenta'}</span>
              </button>
            </form>

            <p className="text-center text-xs text-neutral-500">
              ¿No tienes una cuenta?{' '}
              <button type="button" onClick={() => { setAuthModalMode('register'); setStep(1); }}
                className="text-emerald-700 font-bold hover:underline cursor-pointer">
                Regístrate aquí
              </button>
            </p>
          </div>
        )}

        {/* REGISTRO */}
        {!ok && authModalMode === 'register' && (
          <div>
            {/* Stepper */}
            <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                {STEPS.map((s, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const active = step === n;
                  return (
                    <React.Fragment key={s}>
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                          done ? 'bg-emerald-500 text-white' : active ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-400'
                        }`}>
                          {done ? <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> : n}
                        </div>
                        <span className={`text-[11px] sm:text-xs font-semibold ${
                          active ? 'text-neutral-900' : done ? 'text-emerald-600' : 'text-neutral-400'
                        }`}>{s}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-1 sm:mx-2 min-w-[6px] ${step > n ? 'bg-emerald-400' : 'bg-neutral-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {regErr && (
              <div className="mx-4 mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{regErr}</span>
              </div>
            )}

            <div className="px-4 py-4 max-h-[62vh] overflow-y-auto space-y-3">

              {/* PASO 1 */}
              {step === 1 && (
                <form onSubmit={goStep1} className="space-y-3">
                  <p className="text-xs font-bold text-neutral-700">Datos del Titular</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">DNI *</label>
                      <div className="relative"><Ico c={<CreditCard className="w-4 h-4" />} />
                        <input type="text" maxLength={8} required value={dni}
                          onChange={e => setDni(e.target.value.replace(/\D/g,''))}
                          placeholder="8 dígitos" className={`${inpI} font-mono`} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">Nombre completo *</label>
                      <div className="relative"><Ico c={<User className="w-4 h-4" />} />
                        <input type="text" required value={rname}
                          onChange={e => {
                            const val = e.target.value.replace(/(?:^|\s)\S/g, char => char.toUpperCase());
                            setRname(val);
                          }}
                          placeholder="Tu nombre y apellido" className={`${inpI} capitalize`} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">Celular *</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500">+51</span>
                        <input type="tel" maxLength={9} required value={rphone}
                          onChange={e => setRphone(e.target.value.replace(/\D/g,''))}
                          placeholder="987654321" className={inpP} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">Correo *</label>
                      <div className="relative"><Ico c={<Mail className="w-4 h-4" />} />
                        <input type="email" required value={remail} onChange={e => setRemail(e.target.value)}
                          placeholder="tu@correo.com" className={inpI} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-600 block mb-1">Dirección de residencia *</label>
                    <div className="relative"><Ico c={<MapPin className="w-4 h-4" />} />
                      <input type="text" required value={raddr} onChange={e => setRaddr(e.target.value)}
                        placeholder="Jr. Los Pinos 345, Atalaya" className={inpI} />
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all">
                    <span>Continuar</span><ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* PASO 2 */}
              {step === 2 && (
                <form onSubmit={goStep2} className="space-y-3">
                  <p className="text-xs font-bold text-neutral-700">Datos de la Tienda</p>

                  <div>
                    <label className="text-xs font-semibold text-neutral-600 block mb-1">Nombre comercial *</label>
                    <div className="relative"><Ico c={<Store className="w-4 h-4" />} />
                      <input type="text" required value={sName} onChange={e => setSName(e.target.value)}
                        placeholder="Ej. Boutique El Sol" className={inpI} />
                    </div>
                    {sName && <p className="text-xs text-emerald-700 mt-0.5">URL: /{slug}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">Rubro *</label>
                      <select value={cat} onChange={e => setCat(e.target.value)} className={inp}>
                        {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">Modalidad *</label>
                      <div className="grid grid-cols-2 gap-1 h-[42px]">
                        {(['virtual', 'fisica'] as const).map(v => (
                          <button key={v} type="button" onClick={() => setSmode(v)}
                            className={`text-xs font-bold rounded-lg border-2 cursor-pointer transition-all ${
                              smode === v ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                            }`}>
                            {v === 'virtual' ? 'Virtual' : 'Física'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {smode === 'fisica' && (
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">Dirección del local *</label>
                      <div className="relative"><Ico c={<MapPin className="w-4 h-4" />} />
                        <input type="text" required value={sAddr} onChange={e => setSAddr(e.target.value)}
                          placeholder="Av. Principal 123" className={inpI} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-neutral-600">WhatsApp tienda *</label>
                        {rphone && sPhone !== rphone && (
                          <button type="button" onClick={() => setSPhone(rphone)}
                            className="text-[10px] text-emerald-700 font-bold cursor-pointer hover:underline">Usar el mio</button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500">+51</span>
                        <input type="tel" maxLength={9} required value={sPhone}
                          onChange={e => setSPhone(e.target.value.replace(/\D/g,''))}
                          placeholder="987654321" className={inpP} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">RUC <span className="font-normal text-neutral-400">(opc)</span></label>
                      <div className="relative"><Ico c={<Building className="w-4 h-4" />} />
                        <input type="text" maxLength={11} value={ruc}
                          onChange={e => setRuc(e.target.value.replace(/\D/g,''))}
                          placeholder="11 dígitos" className={`${inpI} font-mono`} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-600 block mb-1">¿A qué se dedica? <span className="font-normal text-neutral-400">(opc)</span></label>
                    <textarea rows={2} value={about} onChange={e => setAbout(e.target.value)}
                      placeholder="Breve descripción de tu negocio" className={`${inp} resize-none`} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => { setRegErr(null); setStep(1); }}
                      className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 cursor-pointer">
                      <ArrowLeft className="w-4 h-4" /><span>Atrás</span>
                    </button>
                    <button type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all">
                      <span>Continuar</span><ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* PASO 3 */}
              {step === 3 && (
                <form onSubmit={goStep3} className="space-y-3">
                  <p className="text-xs font-bold text-neutral-700">Crea tu PIN de acceso</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-neutral-600">PIN (6 dígitos) *</label>
                        <button type="button" onClick={() => setShowP(!showP)}
                          className="flex items-center gap-0.5 text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer">
                          {showP ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="relative"><Ico c={<Lock className="w-4 h-4" />} />
                        <input type={showP ? 'text' : 'password'} maxLength={6} required value={p1}
                          onChange={e => setP1(e.target.value.replace(/\D/g,''))}
                          placeholder="Ej. 849201" className={`${inpI} font-mono text-center tracking-widest`} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 block mb-1">Confirmar PIN *</label>
                      <div className="relative"><Ico c={<Lock className="w-4 h-4" />} />
                        <input type={showP ? 'text' : 'password'} maxLength={6} required value={p2}
                          onChange={e => setP2(e.target.value.replace(/\D/g,''))}
                          placeholder="••••••" className={`${inpI} font-mono text-center tracking-widest`} />
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium ${
                    pSt.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                  }`}>
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${pSt.ok ? 'text-emerald-600' : 'text-neutral-400'}`} />
                    <span>{pSt.msg}</span>
                  </div>

                  <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-500 space-y-0.5">
                    <p className="font-semibold text-neutral-700">Reglas del PIN:</p>
                    <p>Sin repeticiones (111111) ni secuencias (123456).</p>
                    <p>No coincida con tu DNI o celular.</p>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <p className="font-bold text-emerald-900">Resumen:</p>
                    <p><span className="text-neutral-500">Titular:</span> <b>{rname}</b> &middot; DNI: {dni}</p>
                    <p><span className="text-neutral-500">Tienda:</span> <b>{sName}</b> &middot; {cat}</p>
                    <p><span className="text-neutral-500">WhatsApp:</span> +51 {sPhone}</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="button" disabled={loading} onClick={() => { setRegErr(null); setStep(2); }}
                      className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 cursor-pointer disabled:opacity-50">
                      <ArrowLeft className="w-4 h-4" /><span>Atrás</span>
                    </button>
                    <button type="submit" disabled={!pSt.ok}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all">
                      <span>Continuar a Términos</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* PASO 4 - TÉRMINOS Y CONDICIONES (LEGISLACIÓN PERUANA) */}
              {step === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Términos de Servicio y Contrato Digital SaaS</p>
                      <p className="text-[11px] text-neutral-500">Conforme a la legislación vigente de la República del Perú</p>
                    </div>
                  </div>

                  {/* Contenedor con scroll para lectura completa obligatoria */}
                  <div
                    ref={termsScrollRef}
                    onScroll={handleTermsScroll}
                    tabIndex={0}
                    className="h-64 sm:h-72 overflow-y-auto p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/80 text-xs text-neutral-700 leading-relaxed space-y-3 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    <div>
                      <h4 className="font-bold text-neutral-900">1. Marco Legal y Naturaleza del Servicio</h4>
                      <p className="mt-1 text-neutral-600">
                        El presente Contrato Electrónico de Software como Servicio (SaaS) regula el alta, acceso y uso de la plataforma multitienda <b>JamuyWasi</b>. La aceptación electrónica del presente instrumento se suscribe válidamente con arreglo al artículo 141-A del <b>Código Civil Peruano</b>, la <b>Ley N° 27269 (Ley de Firmas y Certificados Digitales)</b> y su Reglamento, ostentando plena eficacia jurídica y validez probatoria entre las partes.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-neutral-900">2. Declaración Jurada de Identidad y Veracidad</h4>
                      <p className="mt-1 text-neutral-600">
                        El solicitante declara bajo juramento que los datos aportados (Documento Nacional de Identidad - <b>DNI</b> expedido por RENIEC, Registro Único de Contribuyentes - <b>RUC</b> ante la SUNAT, dirección domiciliaria y números telefónicos) corresponden fielmente a su identidad y son verdaderos. La suplantación de identidad o consignación de datos falsos constituye delito contra la fe pública sancionado conforme al <b>Código Penal Peruano</b>, facultando el bloqueo inmediato y denuncia correspondiente.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-neutral-900">3. Protección y Tratamiento de Datos Personales (Ley N° 29733)</h4>
                      <p className="mt-1 text-neutral-600">
                        En observancia obligatoria de la <b>Ley N° 29733 (Ley de Protección de Datos Personales)</b> y el <b>D.S. N° 003-2013-JUS</b>, El Titular otorga su <b>consentimiento previo, libre, expreso, informado e inequívoco</b> para la recopilación y tratamiento automatizado de sus datos personales. Dicha información será utilizada exclusivamente para la gestión de su cuenta en JamuyWasi, administración de catálogos digitales, soporte técnico, facturación y notificaciones de servicio. El Titular podrá ejercitar en cualquier momento sus <b>derechos ARCO</b> (Acceso, Rectificación, Cancelación y Oposición) ante el soporte de la plataforma.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-neutral-900">4. Cumplimiento Tributario y Emisión de Comprobantes (SUNAT)</h4>
                      <p className="mt-1 text-neutral-600">
                        JamuyWasi presta un servicio estrictamente tecnológico de catálogo digital y facilitación de pedidos comerciales; no actúa como intermediario comercial, mandatario de ventas ni agente de retención. El Titular es el <b>único y exclusivo responsable tributario ante la Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT)</b> por la tributación de sus ventas y la emisión obligatoria de comprobantes de pago electrónicos de venta (boletas o facturas) a los clientes conforme a la normativa tributaria peruana.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-neutral-900">5. Protección al Consumidor y Productos Permitidos (INDECOPI / DIGEMID)</h4>
                      <p className="mt-1 text-neutral-600">
                        En cumplimiento del <b>Código de Protección y Defensa del Consumidor (Ley N° 29571)</b>, el comercio asume total responsabilidad frente a los compradores por la veracidad publicitaria, idoneidad, estado, garantía y entrega efectiva de los productos ofertados. Queda <b>terminantemente prohibido</b> ofertar productos robados, falsificados, de contrabando, adulterados, o medicamentos y cosméticos sin los correspondientes registros sanitarios emitidos por <b>DIGEMID, DIGESA o SENASA</b>. JamuyWasi dará de baja inmediata a cualquier comercio denunciado o presunto infractor sin lugar a resarcimiento.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-neutral-900">6. Licencia SaaS, Pagos y Disponibilidad de Tienda</h4>
                      <p className="mt-1 text-neutral-600">
                        El registro inicial crea el perfil del titular y tienda. La publicación activa del catálogo ante el público y la recepción de pedidos comerciales se encuentra supeditada a mantener una suscripción activa según los planes vigentes. La plataforma podrá ocultar o deshabilitar tiendas con mensualidades vencidas o impagas hasta su acreditación.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-neutral-900">7. Confidencialidad del PIN y Seguridad Operativa</h4>
                      <p className="mt-1 text-neutral-600">
                        El código numérico (PIN de 6 dígitos) es personal, secreto e intransferible. El titular responderá íntegramente por todas las modificaciones de inventario, precios y configuraciones operadas bajo sus credenciales autenticadas en la plataforma.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-neutral-900">8. Ley Aplicable, Jurisdicción y Validez Legal</h4>
                      <p className="mt-1 text-neutral-600">
                        Este contrato se rige e interpretará bajo las leyes vigentes de la República del Perú. Las partes declaran someter cualquier divergencia a los jueces y tribunales competentes de la jurisdicción del Perú, renunciando expresamente a cualquier otro fuero.
                      </p>
                    </div>

                    <div className="pt-2 text-center text-[10px] text-neutral-400 font-mono">
                      --- Fin de los Términos y Condiciones Legales de JamuyWasi ---
                    </div>
                  </div>

                  {/* Indicador de estado del Scroll */}
                  {!hasScrolledToBottom ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium animate-pulse">
                      <ArrowDown className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                      <span>Desplaza la lectura hasta el final para habilitar la casilla de aceptación.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Has revisado los términos completos. Ya puedes confirmar tu aceptación.</span>
                    </div>
                  )}

                  {/* Casilla de Aceptación */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                    !hasScrolledToBottom
                      ? 'opacity-50 cursor-not-allowed bg-neutral-50 border-neutral-200'
                      : acceptedTerms
                      ? 'bg-emerald-50/60 border-emerald-300 cursor-pointer'
                      : 'hover:bg-neutral-50 border-neutral-200 cursor-pointer'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!hasScrolledToBottom}
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-neutral-700 leading-snug">
                      He leído y <b>acepto los Términos de Servicio y Contrato Digital SaaS</b>, las políticas de Protección de Datos Personales (Ley N° 29733) y mis obligaciones tributarias y comerciales ante SUNAT e INDECOPI.
                    </span>
                  </label>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => { setRegErr(null); setStep(3); }}
                      className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /><span>Atrás</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading || !acceptedTerms || !hasScrolledToBottom}
                      onClick={handleCompleteRegistration}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{loading ? 'Registrando Tienda...' : 'Aceptar y Registrar Tienda'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
