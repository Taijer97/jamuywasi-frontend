import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

export const ChangePinModal: React.FC = () => {
  const { mustChangePinModalOpen, changePin, currentUser } = useApp();

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mustChangePinModalOpen && !currentUser?.mustChangePin) return null;

  // Validación de seguridad local
  const validateSecurity = () => {
    const p = newPin.trim();
    if (p.length !== 6) return 'El nuevo PIN debe tener exactamente 6 dígitos numéricos.';
    if (!/^\d{6}$/.test(p)) return 'El PIN solo debe contener números.';
    if (p === '000000') return 'No puedes usar 000000 como tu nuevo PIN.';
    if (new Set(p.split('')).size === 1) return 'No uses números repetitivos (ej. 111111).';
    const sequences = ['012345', '123456', '234567', '345678', '456789', '543210', '654321', '765432', '876543', '987654'];
    if (sequences.includes(p)) return 'No uses números en secuencia (ej. 123456, 654321).';
    if (currentUser?.dni && (currentUser.dni.includes(p) || p === currentUser.dni.slice(0, 6) || p === currentUser.dni.slice(-6))) {
      return 'Por seguridad, no utilices partes de tu número de DNI.';
    }
    if (newPin !== confirmPin) return 'Los dos campos de PIN no coinciden.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateSecurity();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await changePin(newPin.trim(), confirmPin.trim());
      if (!res.success) {
        setError(res.error || 'No se pudo actualizar el PIN.');
      } else {
        setNewPin('');
        setConfirmPin('');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const isMatch = newPin.length === 6 && confirmPin.length === 6 && newPin === confirmPin;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Cabecera de Alerta de Seguridad */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-black/20 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            Seguridad Requerida
          </span>
          <h2 className="text-lg font-black tracking-tight">
            Actualiza tu PIN de Seguridad
          </h2>
          <p className="text-xs text-amber-50 mt-1 max-w-xs mx-auto">
            Tu cuenta fue reseteada temporalmente con el PIN 000000. Por protección, debes registrar tu nuevo PIN personal de 6 dígitos.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Atención:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Campo Nuevo PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700">
                Nuevo PIN (6 dígitos)
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Ocultar' : 'Ver'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                maxLength={6}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingresa 6 números"
                className="w-full py-3 px-4 rounded-2xl border border-neutral-300 bg-neutral-50/50 text-base font-mono text-center tracking-widest text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Campo Confirmar Nuevo PIN */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1.5">
              Confirmar Nuevo PIN (6 dígitos)
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                maxLength={6}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Repite los 6 números"
                className={`w-full py-3 px-4 rounded-2xl border text-base font-mono text-center tracking-widest text-neutral-900 focus:bg-white focus:outline-none transition-all ${
                  confirmPin.length === 6
                    ? isMatch
                      ? 'border-emerald-500 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500'
                      : 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400'
                    : 'border-neutral-300 bg-neutral-50/50 focus:ring-2 focus:ring-amber-500'
                }`}
              />
            </div>
            {confirmPin.length === 6 && (
              <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold">
                {isMatch ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Los PIN coinciden correctamente
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Los PIN no coinciden
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Pautas de seguridad */}
          <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/70 text-[11px] text-neutral-600 space-y-1">
            <p className="font-bold text-neutral-800 text-xs">Pautas de seguridad:</p>
            <ul className="space-y-0.5 list-disc list-inside text-neutral-500">
              <li>Exactamente 6 números.</li>
              <li>No números repetitivos (ej. 111111, 222222).</li>
              <li>No secuencias numéricas (ej. 123456, 654321).</li>
              <li>Distinto de 000000.</li>
            </ul>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading || newPin.length !== 6 || confirmPin.length !== 6 || !isMatch}
            className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Guardando nuevo PIN...' : 'Guardar y Proteger Mi Cuenta'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
